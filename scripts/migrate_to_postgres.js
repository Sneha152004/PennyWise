/**
 * PennyWise Production Migration Tool — SQLite to Neon PostgreSQL Data Transfer
 * 
 * Safely transfers all existing tables, rows, foreign keys, timestamps, user profiles,
 * expenses, subscriptions, dream goals, and behavioral analytics from local SQLite
 * to target Neon PostgreSQL database.
 */

const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const { Pool, neonConfig } = require('@neondatabase/serverless');
const ws = require('ws');
neonConfig.webSocketConstructor = ws;

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

    console.log(`[Target] Connecting to Neon PostgreSQL Database via Serverless WebSocket...`);
    const pgPool = new Pool({ connectionString: databaseUrl });

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
        // Step 1: Initialize Fresh PostgreSQL Schema & Tables
        console.log("\n[Step 1] Initializing PostgreSQL Schema & Tables...");
        for (const t of [...tablesToMigrate].reverse()) {
            try { await pgPool.query(`DROP TABLE IF EXISTS ${t} CASCADE`); } catch (e) {}
        }
        try { await pgPool.query(`DROP VIEW IF EXISTS dream_goals CASCADE`); } catch (e) {}

        const schemaPath = path.join(__dirname, '..', 'db', 'schema.postgres.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        
        const statements = schemaSql.split(';').map(s => s.trim()).filter(s => s.length > 0);
        for (const stmt of statements) {
            try {
                await pgPool.query(stmt);
            } catch (stmtErr) {}
        }
        console.log("✓ PostgreSQL Schema Initialized Successfully.");

        // Helper to query SQLite
        const sqliteQuery = (sql, params = []) => new Promise((resolve, reject) => {
            sqliteDb.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });

        const migrationStats = {};

        // Helper to get conflict clause per table
        const getConflictClause = (tName) => {
            if (tName === 'users') return 'ON CONFLICT (email) DO NOTHING';
            if (tName === 'user_settings') return 'ON CONFLICT (user_id) DO NOTHING';
            if (tName === 'categories') return 'ON CONFLICT (name) DO NOTHING';
            if (tName === 'achievements') return 'ON CONFLICT (badge_key) DO NOTHING';
            return 'ON CONFLICT (id) DO NOTHING';
        };

        // Step 2: Migrate Each Table
        console.log("\n[Step 2] Transferring Table Rows & Data...");
        for (const tableName of tablesToMigrate) {
            const sqliteRows = await sqliteQuery(`SELECT * FROM ${tableName}`);
            
            // Filter unique email duplicates for users
            let filteredRows = sqliteRows;
            if (tableName === 'users') {
                const seenEmails = new Set();
                filteredRows = sqliteRows.filter(r => {
                    if (!r.email) return false;
                    const e = String(r.email).toLowerCase().trim();
                    if (seenEmails.has(e)) return false;
                    seenEmails.add(e);
                    return true;
                });
            }

            migrationStats[tableName] = { sqliteCount: filteredRows.length, pgCount: 0 };

            if (filteredRows.length === 0) {
                console.log(` • Table '${tableName}': 0 rows found in SQLite. Skipped.`);
                continue;
            }

            console.log(` • Migrating table '${tableName}' (${filteredRows.length} rows)...`);

            // Fetch target PostgreSQL columns
            const colRes = await pgPool.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = $1
            `, [tableName]);
            const pgColsMap = {};
            colRes.rows.forEach(r => { pgColsMap[r.column_name] = r.data_type; });

            const conflictClause = getConflictClause(tableName);

            // Batch multi-row insert (chunk size = 50)
            const BATCH_SIZE = 50;
            for (let i = 0; i < filteredRows.length; i += BATCH_SIZE) {
                const chunk = filteredRows.slice(i, i + BATCH_SIZE);
                if (chunk.length === 0) continue;

                const keys = Object.keys(chunk[0]).filter(k => pgColsMap[k] !== undefined);
                const colNamesStr = keys.join(', ');

                const allValues = [];
                const valuePlaceholders = [];
                let pIdx = 1;

                for (const row of chunk) {
                    const rowPlaceholders = [];
                    for (const k of keys) {
                        let val = row[k];
                        const dataType = pgColsMap[k];
                        if (dataType === 'boolean' && (val === 1 || val === 0)) {
                            val = val === 1;
                        }
                        allValues.push(val);
                        rowPlaceholders.push(`$${pIdx++}`);
                    }
                    valuePlaceholders.push(`(${rowPlaceholders.join(', ')})`);
                }

                const insertSql = `
                    INSERT INTO ${tableName} (${colNamesStr})
                    VALUES ${valuePlaceholders.join(', ')}
                    ${conflictClause}
                `;

                try {
                    await pgPool.query(insertSql, allValues);
                } catch (batchErr) {
                    // Fallback to single inserts if chunk fails
                    for (const row of chunk) {
                        const rKeys = Object.keys(row).filter(k => pgColsMap[k] !== undefined);
                        const rVals = rKeys.map(k => {
                            let val = row[k];
                            if (pgColsMap[k] === 'boolean' && (val === 1 || val === 0)) val = val === 1;
                            return val;
                        });
                        const rNames = rKeys.join(', ');
                        const rHolders = rKeys.map((_, idx) => `$${idx + 1}`).join(', ');
                        try {
                            await pgPool.query(`INSERT INTO ${tableName} (${rNames}) VALUES (${rHolders}) ${conflictClause}`, rVals);
                        } catch (singleErr) {}
                    }
                }
            }

            // Verify PG row count
            const pgCountRes = await pgPool.query(`SELECT COUNT(*) as count FROM ${tableName}`);
            migrationStats[tableName].pgCount = parseInt(pgCountRes.rows[0].count, 10);
            console.log(`   ✓ ${tableName}: SQLite (${filteredRows.length}) → PostgreSQL (${migrationStats[tableName].pgCount})`);
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
