/**
 * PennyWise Production Migration Tool — SQLite to Neon PostgreSQL Data Transfer
 * 
 * Safely transfers all existing tables, rows, foreign keys, timestamps, user profiles,
 * expenses, subscriptions, dream goals, and behavioral analytics from local SQLite
 * to target Neon PostgreSQL database.
 */

const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');

async function runMigration() {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
        console.error("❌ ERROR: DATABASE_URL environment variable is missing!");
        console.error("Usage: DATABASE_URL=postgres://... node scripts/migrate_to_postgres.js");
        process.exit(1);
    }

    console.log("==================================================");
    console.log("🚀 Starting PennyWise SQLite → PostgreSQL Migration");
    console.log("==================================================");

    const sqlitePath = path.join(__dirname, '..', 'db', 'finpilot.db');
    console.log(`[Source] Reading SQLite Database: ${sqlitePath}`);
    const sqliteDb = new sqlite3.Database(sqlitePath);

    console.log(`[Target] Connecting to PostgreSQL Database...`);
    const pgPool = new Pool({
        connectionString: databaseUrl,
        ssl: { rejectUnauthorized: false }
    });

    const tablesToMigrate = [
        'users',
        'user_settings',
        'categories',
        'deductions',
        'income',
        'expenses',
        'budgets',
        'savings_goals',
        'shared_goals',
        'subscriptions',
        'subscription_history',
        'savings_insights',
        'purchase_feedback',
        'price_watch',
        'achievements',
        'user_achievements',
        'challenges',
        'receipts',
        'notifications',
        'reports',
        'login_history'
    ];

    try {
        // Step 1: Read PostgreSQL Schema File and Initialize Tables
        const fs = require('fs');
        const schemaPath = path.join(__dirname, '..', 'db', 'schema.postgres.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        
        console.log("\n[Step 1] Initializing PostgreSQL Schema & Tables...");
        await pgPool.query(schemaSql);
        console.log("✓ PostgreSQL Schema Initialized Successfully.");

        // Helper to query SQLite
        const sqliteQuery = (sql, params = []) => new Promise((resolve, reject) => {
            sqliteDb.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });

        const migrationStats = {};

        // Step 2: Migrate Each Table
        console.log("\n[Step 2] Transferring Table Rows & Data...");
        for (const tableName of tablesToMigrate) {
            const sqliteRows = await sqliteQuery(`SELECT * FROM ${tableName}`);
            migrationStats[tableName] = { sqliteCount: sqliteRows.length, pgCount: 0 };

            if (sqliteRows.length === 0) {
                console.log(` • Table '${tableName}': 0 rows found in SQLite. Skipped.`);
                continue;
            }

            console.log(` • Migrating table '${tableName}' (${sqliteRows.length} rows)...`);

            // Fetch target PostgreSQL columns
            const colRes = await pgPool.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = $1
            `, [tableName]);
            const pgColsMap = {};
            colRes.rows.forEach(r => { pgColsMap[r.column_name] = r.data_type; });

            for (const row of sqliteRows) {
                const keys = Object.keys(row).filter(k => pgColsMap[k] !== undefined);
                const values = keys.map(k => {
                    let val = row[k];
                    const dataType = pgColsMap[k];
                    
                    // Convert SQLite 1/0 to Postgres boolean if needed
                    if (dataType === 'boolean' && (val === 1 || val === 0)) {
                        val = val === 1;
                    }
                    return val;
                });

                const colNamesStr = keys.join(', ');
                const placeholdersStr = keys.map((_, idx) => `$${idx + 1}`).join(', ');

                const insertSql = `
                    INSERT INTO ${tableName} (${colNamesStr})
                    VALUES (${placeholdersStr})
                    ON CONFLICT DO NOTHING
                `;

                await pgPool.query(insertSql, values);
            }

            // Verify PG row count
            const pgCountRes = await pgPool.query(`SELECT COUNT(*) as count FROM ${tableName}`);
            migrationStats[tableName].pgCount = parseInt(pgCountRes.rows[0].count, 10);
            console.log(`   ✓ ${tableName}: SQLite (${sqliteRows.length}) → PostgreSQL (${migrationStats[tableName].pgCount})`);
        }

        // Step 3: Reset Auto-Increment Sequences in PostgreSQL
        console.log("\n[Step 3] Resetting PostgreSQL Primary Key Sequences...");
        for (const tableName of tablesToMigrate) {
            if (tableName === 'user_settings') continue; // Composite / User_ID key
            try {
                await pgPool.query(`
                    SELECT setval(pg_get_serial_sequence($1, 'id'), COALESCE(MAX(id), 1)) FROM ${tableName}
                `, [tableName]);
            } catch (seqErr) {
                // Ignore if table has no serial sequence
            }
        }
        console.log("✓ PostgreSQL PK Sequences Updated.");

        // Step 4: Verification Summary Report
        console.log("\n==================================================");
        console.log("📊 MIGRATION VERIFICATION SUMMARY");
        console.log("==================================================");
        let totalSqliteRows = 0;
        let totalPgRows = 0;
        for (const [tName, stats] of Object.entries(migrationStats)) {
            console.log(` • ${tName.padEnd(24)} | SQLite: ${String(stats.sqliteCount).padStart(5)} | PG: ${String(stats.pgCount).padStart(5)} | Status: ${stats.sqliteCount <= stats.pgCount ? '✓ PASSED' : '⚠️ MISMATCH'}`);
            totalSqliteRows += stats.sqliteCount;
            totalPgRows += stats.pgCount;
        }
        console.log("--------------------------------------------------");
        console.log(` TOTAL ROWS TRANSFERRED   | SQLite: ${String(totalSqliteRows).padStart(5)} | PG: ${String(totalPgRows).padStart(5)}`);
        console.log("==================================================");
        console.log("🎉 SQLite → Neon PostgreSQL Migration Completed Successfully!");
        
        await pgPool.end();
        sqliteDb.close();
        process.exit(0);
    } catch (err) {
        console.error("\n❌ Migration Failed with Error:", err);
        process.exit(1);
    }
}

runMigration();
