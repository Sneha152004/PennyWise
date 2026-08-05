/**
 * PennyWise - Data-Driven Modular Theme Engine & Clash of Clans Dream Map Component Renderer
 * Provides hierarchical search-as-you-type selection, regional grouping, custom destination maps,
 * cartoon 3D graphics (NO EMOJIS), milestone nodes, animated treasure chests, and level-up popups.
 */

// LEVEL 1: GOAL CATEGORIES
const GOAL_CATEGORIES = [
    { id: 'travel', name: '✈️ Travel', icon: 'fa-plane' },
    { id: 'medical', name: '🏥 Medical & Wellness', icon: 'fa-user-nurse' },
    { id: 'house', name: '🏠 Dream House', icon: 'fa-house-chimney' },
    { id: 'vehicle', name: '🚗 Vehicle', icon: 'fa-car' },
    { id: 'gaming', name: '🎮 Gaming Setup', icon: 'fa-gamepad' },
    { id: 'education', name: '🎓 Higher Education', icon: 'fa-graduation-cap' },
    { id: 'wedding', name: '💍 Wedding', icon: 'fa-ring' },
    { id: 'emergency', name: '🛡️ Emergency Fund', icon: 'fa-shield-halved' }
];

// LEVEL 2: REGIONAL TRAVEL DESTINATIONS (Data-Driven Architecture)
const TRAVEL_DESTINATIONS_DATA = {
    india: {
        regionName: '🇮🇳 INDIA',
        items: [
            { id: 'goa', name: 'Goa Beach Escape' },
            { id: 'kashmir', name: 'Kashmir Paradise' },
            { id: 'kerala', name: 'Kerala Backwaters' },
            { id: 'rajasthan', name: 'Royal Rajasthan' },
            { id: 'puri', name: 'Puri Coastal Heritage' },
            { id: 'ladakh', name: 'Ladakh Expedition' },
            { id: 'andaman', name: 'Andaman Islands' },
            { id: 'meghalaya', name: 'Meghalaya Adventure' },
            { id: 'darjeeling', name: 'Darjeeling Hills' },
            { id: 'ooty', name: 'Ooty Escape' },
            { id: 'hampi', name: 'Hampi Heritage' },
            { id: 'konark', name: 'Konark Heritage' },
            { id: 'varanasi', name: 'Varanasi Spiritual Tour' },
            { id: 'rishikesh', name: 'Rishikesh Adventure' },
            { id: 'kanyakumari', name: 'Kanyakumari Sunset' },
            { id: 'mumbai', name: 'Mumbai City Lights' },
            { id: 'delhi', name: 'Delhi Heritage Walk' },
            { id: 'agra', name: 'Agra Taj Mahal Journey' },
            { id: 'shimla', name: 'Shimla Escape' },
            { id: 'manali', name: 'Manali Adventure' },
            { id: 'coorg', name: 'Coorg Retreat' },
            { id: 'munnar', name: 'Munnar Hills' },
            { id: 'pondicherry', name: 'Pondicherry Coast' },
            { id: 'hyderabad', name: 'Hyderabad Heritage' },
            { id: 'mysore', name: 'Mysore Palace Tour' },
            { id: 'udaipur', name: 'Udaipur Lakes' },
            { id: 'jaipur', name: 'Jaipur Pink City' },
            { id: 'sikkim', name: 'Sikkim Explorer' },
            { id: 'arunachal', name: 'Arunachal Adventure' }
        ]
    },
    asia: {
        regionName: '🇯🇵 ASIA',
        items: [
            { id: 'tokyo', name: 'Tokyo Adventure' },
            { id: 'seoul', name: 'Seoul Discovery' },
            { id: 'singapore', name: 'Singapore Skyline' },
            { id: 'bangkok', name: 'Bangkok Adventure' },
            { id: 'bali', name: 'Bali Retreat' },
            { id: 'hongkong', name: 'Hong Kong Lights' },
            { id: 'kualalumpur', name: 'Kuala Lumpur Escape' },
            { id: 'phuket', name: 'Phuket Paradise' },
            { id: 'hanoi', name: 'Hanoi Heritage' },
            { id: 'kyoto', name: 'Kyoto Tradition' },
            { id: 'osaka', name: 'Osaka Explorer' },
            { id: 'beijing', name: 'Beijing Expedition' },
            { id: 'shanghai', name: 'Shanghai Skyline' },
            { id: 'greatwall', name: 'Great Wall Expedition' }
        ]
    },
    europe: {
        regionName: '🇪🇺 EUROPE',
        items: [
            { id: 'greece', name: 'Greece Odyssey' },
            { id: 'paris', name: 'Paris Romance' },
            { id: 'london', name: 'London Explorer' },
            { id: 'rome', name: 'Rome Odyssey' },
            { id: 'santorini', name: 'Santorini Escape' },
            { id: 'barcelona', name: 'Barcelona Fiesta' },
            { id: 'switzerland', name: 'Swiss Alps Expedition' },
            { id: 'amsterdam', name: 'Amsterdam Canals' },
            { id: 'venice', name: 'Venice Escape' },
            { id: 'prague', name: 'Prague Heritage' },
            { id: 'vienna', name: 'Vienna Symphony' },
            { id: 'berlin', name: 'Berlin Discovery' },
            { id: 'istanbul', name: 'Istanbul Journey' },
            { id: 'iceland', name: 'Iceland Northern Lights' },
            { id: 'norway', name: 'Norwegian Fjords' },
            { id: 'scotland', name: 'Scottish Highlands' },
            { id: 'lisbon', name: 'Lisbon Coast' },
            { id: 'florence', name: 'Florence Renaissance' },
            { id: 'athens', name: 'Athens Mythology' }
        ]
    },
    north_america: {
        regionName: '🇺🇸 NORTH AMERICA',
        items: [
            { id: 'nyc', name: 'New York City Lights' },
            { id: 'la', name: 'Los Angeles Dreams' },
            { id: 'vegas', name: 'Las Vegas Nights' },
            { id: 'sf', name: 'San Francisco Bay' },
            { id: 'miami', name: 'Miami Beach Escape' },
            { id: 'banff', name: 'Banff Mountains' },
            { id: 'toronto', name: 'Toronto Skyline' },
            { id: 'vancouver', name: 'Vancouver Explorer' },
            { id: 'niagara', name: 'Niagara Falls Adventure' }
        ]
    },
    oceania: {
        regionName: '🇦🇺 OCEANIA',
        items: [
            { id: 'sydney', name: 'Sydney Harbour' },
            { id: 'melbourne', name: 'Melbourne Discovery' },
            { id: 'nz', name: 'New Zealand Explorer' },
            { id: 'queenstown', name: 'Queenstown Adventure' }
        ]
    },
    middle_east_africa: {
        regionName: '🇦🇪 MIDDLE EAST & AFRICA',
        items: [
            { id: 'dubai', name: 'Dubai Luxury' },
            { id: 'abudhabi', name: 'Abu Dhabi Grand Tour' },
            { id: 'egypt', name: 'Egyptian Wonders' },
            { id: 'safari', name: 'Cape Town Safari' },
            { id: 'marrakech', name: 'Marrakech Adventure' },
            { id: 'petra', name: 'Petra Expedition' }
        ]
    },
    south_america: {
        regionName: '🇧🇷 SOUTH AMERICA',
        items: [
            { id: 'rio', name: 'Rio Carnival' },
            { id: 'machupicchu', name: 'Machu Picchu Expedition' },
            { id: 'patagonia', name: 'Patagonia Adventure' },
            { id: 'buenosaires', name: 'Buenos Aires Explorer' }
        ]
    },
    custom: {
        regionName: '🌍 CUSTOM',
        items: [
            { id: 'other_destination', name: '🌍 Other Destination' }
        ]
    }
};

// MASTER THEME ASSETS & MILESTONE DEFINITIONS
const DREAM_THEMES = {
    // TRAVEL DESTINATION THEMES
    greece: {
        id: 'greece', name: 'Greece Odyssey', category: 'Travel', badgeColor: '#0284c7',
        bgGradient: 'linear-gradient(135deg, #0c4a6e 0%, #0369a1 40%, #0284c7 100%)', pathColor: '#7dd3fc',
        nodes: [
            { level: 1, name: 'Athens Port', pct: 0, title: 'Penny Beginner', icon: 'hut' },
            { level: 2, name: 'Parthenon Citadel', pct: 20, title: 'Budget Explorer', icon: 'fort' },
            { level: 3, name: 'Aegean Sea', pct: 40, title: 'Treasure Hunter', icon: 'river' },
            { level: 4, name: 'Santorini Sunset', pct: 60, title: 'Savings Knight', icon: 'beach' },
            { level: 5, name: 'Greece Paradise', pct: 80, title: 'Wealth Wizard', icon: 'skyline' }
        ]
    },
    tokyo: {
        id: 'tokyo', name: 'Tokyo Adventure', category: 'Travel', badgeColor: '#ec4899',
        bgGradient: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4338ca 100%)', pathColor: '#f472b6',
        nodes: [
            { level: 1, name: 'Sakura Village', pct: 0, title: 'Penny Beginner', icon: 'torii' },
            { level: 2, name: 'Sakura Garden', pct: 20, title: 'Budget Explorer', icon: 'blossom' },
            { level: 3, name: 'Temple Town', pct: 40, title: 'Treasure Hunter', icon: 'pagoda' },
            { level: 4, name: 'Mount Fuji Base', pct: 60, title: 'Savings Knight', icon: 'mountain' },
            { level: 5, name: 'Tokyo Capital', pct: 80, title: 'Wealth Wizard', icon: 'skyline' }
        ]
    },
    paris: {
        id: 'paris', name: 'Paris Romance', category: 'Travel', badgeColor: '#8b5cf6',
        bgGradient: 'linear-gradient(135deg, #2e1065 0%, #4c1d95 40%, #6d28d9 100%)', pathColor: '#c084fc',
        nodes: [
            { level: 1, name: 'Cafe Quarter', pct: 0, title: 'Penny Beginner', icon: 'cafe' },
            { level: 2, name: 'Seine Riverbank', pct: 20, title: 'Budget Explorer', icon: 'river' },
            { level: 3, name: 'Eiffel Esplanade', pct: 40, title: 'Treasure Hunter', icon: 'eiffel' },
            { level: 4, name: 'Louvre Palace', pct: 60, title: 'Savings Knight', icon: 'louvre' },
            { level: 5, name: 'Paris Capital', pct: 80, title: 'Wealth Wizard', icon: 'triumph' }
        ]
    },
    switzerland: {
        id: 'switzerland', name: 'Swiss Alps Expedition', category: 'Travel', badgeColor: '#06b6d4',
        bgGradient: 'linear-gradient(135deg, #083344 0%, #164e63 40%, #155e75 100%)', pathColor: '#67e8f9',
        nodes: [
            { level: 1, name: 'Alpine Village', pct: 0, title: 'Penny Beginner', icon: 'chalet' },
            { level: 2, name: 'Pine Forest', pct: 20, title: 'Budget Explorer', icon: 'pines' },
            { level: 3, name: 'Glacier Lake', pct: 40, title: 'Treasure Hunter', icon: 'lake' },
            { level: 4, name: 'Matterhorn Peak', pct: 60, title: 'Savings Knight', icon: 'peak' },
            { level: 5, name: 'Alpine Sanctuary', pct: 80, title: 'Wealth Wizard', icon: 'castle' }
        ]
    },
    dubai: {
        id: 'dubai', name: 'Dubai Luxury', category: 'Travel', badgeColor: '#f59e0b',
        bgGradient: 'linear-gradient(135deg, #451a03 0%, #78350f 40%, #b45309 100%)', pathColor: '#fcd34d',
        nodes: [
            { level: 1, name: 'Desert Dunes', pct: 0, title: 'Penny Beginner', icon: 'dunes' },
            { level: 2, name: 'Oasis Resort', pct: 20, title: 'Budget Explorer', icon: 'oasis' },
            { level: 3, name: 'Marina Towers', pct: 40, title: 'Treasure Hunter', icon: 'marina' },
            { level: 4, name: 'Palm Jumeirah', pct: 60, title: 'Savings Knight', icon: 'palm' },
            { level: 5, name: 'Burj Khalifa Peak', pct: 80, title: 'Wealth Wizard', icon: 'burj' }
        ]
    },
    goa: {
        id: 'goa', name: 'Goa Beach Escape', category: 'Travel', badgeColor: '#10b981',
        bgGradient: 'linear-gradient(135deg, #064e3b 0%, #047857 40%, #059669 100%)', pathColor: '#6ee7b7',
        nodes: [
            { level: 1, name: 'Beach Hut', pct: 0, title: 'Penny Beginner', icon: 'hut' },
            { level: 2, name: 'Palm Forest', pct: 20, title: 'Budget Explorer', icon: 'palms' },
            { level: 3, name: 'Portuguese Fort', pct: 40, title: 'Treasure Hunter', icon: 'fort' },
            { level: 4, name: 'Cruise Port', pct: 60, title: 'Savings Knight', icon: 'cruise' },
            { level: 5, name: 'Sunset Beach', pct: 80, title: 'Wealth Wizard', icon: 'beach' }
        ]
    },
    kashmir: {
        id: 'kashmir', name: 'Kashmir Paradise', category: 'Travel', badgeColor: '#3b82f6',
        bgGradient: 'linear-gradient(135deg, #172554 0%, #1e40af 40%, #2563eb 100%)', pathColor: '#93c5fd',
        nodes: [
            { level: 1, name: 'Valley Village', pct: 0, title: 'Penny Beginner', icon: 'valley' },
            { level: 2, name: 'Pine Forest', pct: 20, title: 'Budget Explorer', icon: 'snowpines' },
            { level: 3, name: 'Snow Glacier', pct: 40, title: 'Treasure Hunter', icon: 'snowpeak' },
            { level: 4, name: 'Dal Lake', pct: 60, title: 'Savings Knight', icon: 'shikara' },
            { level: 5, name: 'Shikara Haven', pct: 80, title: 'Wealth Wizard', icon: 'heaven' }
        ]
    },
    kerala: {
        id: 'kerala', name: 'Kerala Backwaters', category: 'Travel', badgeColor: '#14b8a6',
        bgGradient: 'linear-gradient(135deg, #042f2e 0%, #115e59 40%, #0d9488 100%)', pathColor: '#5eead4',
        nodes: [
            { level: 1, name: 'Coconut Grove', pct: 0, title: 'Penny Beginner', icon: 'coconut' },
            { level: 2, name: 'Backwater Canal', pct: 20, title: 'Budget Explorer', icon: 'canal' },
            { level: 3, name: 'Spice Garden', pct: 40, title: 'Treasure Hunter', icon: 'spices' },
            { level: 4, name: 'Houseboat Port', pct: 60, title: 'Savings Knight', icon: 'houseboat' },
            { level: 5, name: 'Kerala Sanctuary', pct: 80, title: 'Wealth Wizard', icon: 'resort' }
        ]
    },
    rajasthan: {
        id: 'rajasthan', name: 'Royal Rajasthan', category: 'Travel', badgeColor: '#f97316',
        bgGradient: 'linear-gradient(135deg, #431407 0%, #7c2d12 40%, #c2410c 100%)', pathColor: '#fdba74',
        nodes: [
            { level: 1, name: 'Desert Camp', pct: 0, title: 'Penny Beginner', icon: 'tent' },
            { level: 2, name: 'Sandstone Fort', pct: 20, title: 'Budget Explorer', icon: 'sandfort' },
            { level: 3, name: 'Hawa Palace', pct: 40, title: 'Treasure Hunter', icon: 'hawa' },
            { level: 4, name: 'Royal Lake', pct: 60, title: 'Savings Knight', icon: 'palace' },
            { level: 5, name: 'Palace Citadel', pct: 80, title: 'Wealth Wizard', icon: 'citadel' }
        ]
    },
    puri: {
        id: 'puri', name: 'Puri Coastal Heritage', category: 'Travel', badgeColor: '#eab308',
        bgGradient: 'linear-gradient(135deg, #3f2e04 0%, #713f12 40%, #a16207 100%)', pathColor: '#fef08a',
        nodes: [
            { level: 1, name: 'Golden Beach', pct: 0, title: 'Penny Beginner', icon: 'sand' },
            { level: 2, name: 'Seafront Shrine', pct: 20, title: 'Budget Explorer', icon: 'shrine' },
            { level: 3, name: 'Konark Trail', pct: 40, title: 'Treasure Hunter', icon: 'wheel' },
            { level: 4, name: 'Sun Temple', pct: 60, title: 'Savings Knight', icon: 'suntemple' },
            { level: 5, name: 'Jagannath Sanctuary', pct: 80, title: 'Wealth Wizard', icon: 'grandtemple' }
        ]
    },
    nyc: {
        id: 'nyc', name: 'New York City Lights', category: 'Travel', badgeColor: '#38bdf8',
        bgGradient: 'linear-gradient(135deg, #0f172a 0%, #1e293b 40%, #0284c7 100%)', pathColor: '#7dd3fc', weatherType: 'gold_dust',
        nodes: [
            { level: 1, name: 'Brooklyn Promenade', pct: 0, title: 'Penny Beginner', icon: 'bridge' },
            { level: 2, name: 'Times Square', pct: 20, title: 'Budget Explorer', icon: 'lights' },
            { level: 3, name: 'Central Park', pct: 40, title: 'Treasure Hunter', icon: 'park' },
            { level: 4, name: 'Empire Tower', pct: 60, title: 'Savings Knight', icon: 'tower' },
            { level: 5, name: 'Liberty Citadel', pct: 80, title: 'Wealth Wizard', icon: 'statue' }
        ]
    },
    london: {
        id: 'london', name: 'London Explorer', category: 'Travel', badgeColor: '#ef4444',
        bgGradient: 'linear-gradient(135deg, #450a0a 0%, #7f1d1d 40%, #991b1b 100%)', pathColor: '#fca5a5', weatherType: 'light_rain',
        nodes: [
            { level: 1, name: 'Thames Bank', pct: 0, title: 'Penny Beginner', icon: 'river' },
            { level: 2, name: 'Tower Bridge', pct: 20, title: 'Budget Explorer', icon: 'bridge' },
            { level: 3, name: 'London Eye', pct: 40, title: 'Treasure Hunter', icon: 'wheel' },
            { level: 4, name: 'Big Ben Clocktower', pct: 60, title: 'Savings Knight', icon: 'clock' },
            { level: 5, name: 'Buckingham Palace', pct: 80, title: 'Wealth Wizard', icon: 'palace' }
        ]
    },
    rome: {
        id: 'rome', name: 'Rome Odyssey', category: 'Travel', badgeColor: '#d97706',
        bgGradient: 'linear-gradient(135deg, #451a03 0%, #78350f 40%, #b45309 100%)', pathColor: '#fde047', weatherType: 'gold_dust',
        nodes: [
            { level: 1, name: 'Tiber River', pct: 0, title: 'Penny Beginner', icon: 'river' },
            { level: 2, name: 'Trevi Fountain', pct: 20, title: 'Budget Explorer', icon: 'fountain' },
            { level: 3, name: 'Pantheon Ruins', pct: 40, title: 'Treasure Hunter', icon: 'temple' },
            { level: 4, name: 'Colosseum Arena', pct: 60, title: 'Savings Knight', icon: 'arena' },
            { level: 5, name: 'Roman Citadel', pct: 80, title: 'Wealth Wizard', icon: 'castle' }
        ]
    },
    egypt: {
        id: 'egypt', name: 'Egyptian Wonders', category: 'Travel', badgeColor: '#eab308',
        bgGradient: 'linear-gradient(135deg, #451a03 0%, #854d0e 40%, #ca8a04 100%)', pathColor: '#fef08a', weatherType: 'gold_dust',
        nodes: [
            { level: 1, name: 'Nile Port', pct: 0, title: 'Penny Beginner', icon: 'river' },
            { level: 2, name: 'Desert Oasis', pct: 20, title: 'Budget Explorer', icon: 'oasis' },
            { level: 3, name: 'Great Sphinx', pct: 40, title: 'Treasure Hunter', icon: 'sphinx' },
            { level: 4, name: 'Pyramid Valley', pct: 60, title: 'Savings Knight', icon: 'pyramid' },
            { level: 5, name: 'Pharaoh Citadel', pct: 80, title: 'Wealth Wizard', icon: 'citadel' }
        ]
    },
    sydney: {
        id: 'sydney', name: 'Sydney Harbour', category: 'Travel', badgeColor: '#06b6d4',
        bgGradient: 'linear-gradient(135deg, #083344 0%, #0e7490 40%, #0891b2 100%)', pathColor: '#67e8f9', weatherType: 'ocean_waves',
        nodes: [
            { level: 1, name: 'Bondi Cove', pct: 0, title: 'Penny Beginner', icon: 'beach' },
            { level: 2, name: 'Harbour Bridge', pct: 20, title: 'Budget Explorer', icon: 'bridge' },
            { level: 3, name: 'Darling Marina', pct: 40, title: 'Treasure Hunter', icon: 'marina' },
            { level: 4, name: 'Opera Sails', pct: 60, title: 'Savings Knight', icon: 'opera' },
            { level: 5, name: 'Sydney Citadel', pct: 80, title: 'Wealth Wizard', icon: 'skyline' }
        ]
    },
    agra: {
        id: 'agra', name: 'Agra Taj Mahal Journey', category: 'Travel', badgeColor: '#ec4899',
        bgGradient: 'linear-gradient(135deg, #4c0519 0%, #831843 40%, #be185d 100%)', pathColor: '#f472b6', weatherType: 'sakura_petals',
        nodes: [
            { level: 1, name: 'Yamuna Riverbank', pct: 0, title: 'Penny Beginner', icon: 'river' },
            { level: 2, name: 'Agra Fort', pct: 20, title: 'Budget Explorer', icon: 'fort' },
            { level: 3, name: 'Charbagh Gardens', pct: 40, title: 'Treasure Hunter', icon: 'garden' },
            { level: 4, name: 'Lotus Reflecting Pool', pct: 60, title: 'Savings Knight', icon: 'pool' },
            { level: 5, name: 'Taj Mahal Citadel', pct: 80, title: 'Wealth Wizard', icon: 'tajmahal' }
        ]
    },
    bali: {
        id: 'bali', name: 'Bali Retreat', category: 'Travel', badgeColor: '#10b981',
        bgGradient: 'linear-gradient(135deg, #064e3b 0%, #047857 40%, #059669 100%)', pathColor: '#6ee7b7', weatherType: 'ocean_waves',
        nodes: [
            { level: 1, name: 'Kuta Beach', pct: 0, title: 'Penny Beginner', icon: 'beach' },
            { level: 2, name: 'Ubud Rice Terraces', pct: 20, title: 'Budget Explorer', icon: 'terraces' },
            { level: 3, name: 'Monkey Forest Shrine', pct: 40, title: 'Treasure Hunter', icon: 'shrine' },
            { level: 4, name: 'Water Temple', pct: 60, title: 'Savings Knight', icon: 'pagoda' },
            { level: 5, name: 'Bali Paradise Sanctuary', pct: 80, title: 'Wealth Wizard', icon: 'resort' }
        ]
    },
    singapore: {
        id: 'singapore', name: 'Singapore Skyline', category: 'Travel', badgeColor: '#3b82f6',
        bgGradient: 'linear-gradient(135deg, #172554 0%, #1e40af 40%, #2563eb 100%)', pathColor: '#93c5fd', weatherType: 'gold_dust',
        nodes: [
            { level: 1, name: 'Merlion Park', pct: 0, title: 'Penny Beginner', icon: 'fountain' },
            { level: 2, name: 'Gardens by the Bay', pct: 20, title: 'Budget Explorer', icon: 'supertree' },
            { level: 3, name: 'Clarke Quay', pct: 40, title: 'Treasure Hunter', icon: 'river' },
            { level: 4, name: 'Marina Bay Sands', pct: 60, title: 'Savings Knight', icon: 'marinabay' },
            { level: 5, name: 'Singapore Sky Citadel', pct: 80, title: 'Wealth Wizard', icon: 'skyline' }
        ]
    },
    rio: {
        id: 'rio', name: 'Rio Carnival', category: 'Travel', badgeColor: '#f59e0b',
        bgGradient: 'linear-gradient(135deg, #451a03 0%, #b45309 40%, #d97706 100%)', pathColor: '#fcd34d', weatherType: 'ocean_waves',
        nodes: [
            { level: 1, name: 'Copacabana Beach', pct: 0, title: 'Penny Beginner', icon: 'beach' },
            { level: 2, name: 'Sugarloaf Cable Car', pct: 20, title: 'Budget Explorer', icon: 'cable' },
            { level: 3, name: 'Sambadrome Lawn', pct: 40, title: 'Treasure Hunter', icon: 'carnival' },
            { level: 4, name: 'Corcovado Peak', pct: 60, title: 'Savings Knight', icon: 'peak' },
            { level: 5, name: 'Christ Redeemer Citadel', pct: 80, title: 'Wealth Wizard', icon: 'redeemer' }
        ]
    },

    // NON-TRAVEL CATEGORIES
    medical: {
        id: 'medical', name: 'Medical & Wellness Fund', category: 'Medical & Wellness', badgeColor: '#0284c7',
        bgGradient: 'linear-gradient(135deg, #0c4a6e 0%, #0369a1 40%, #0284c7 100%)', pathColor: '#38bdf8',
        nodes: [
            { level: 1, name: 'Clinic', pct: 0, title: 'Penny Beginner', icon: 'clinic' },
            { level: 2, name: 'Laboratory', pct: 20, title: 'Budget Explorer', icon: 'lab' },
            { level: 3, name: 'Hospital', pct: 40, title: 'Treasure Hunter', icon: 'hospital' },
            { level: 4, name: 'Recovery Garden', pct: 60, title: 'Savings Knight', icon: 'garden' },
            { level: 5, name: 'Health Palace', pct: 80, title: 'Wealth Wizard', icon: 'wellness' }
        ]
    },
    house: {
        id: 'house', name: 'Dream House Villa', category: 'Dream House', badgeColor: '#10b981',
        bgGradient: 'linear-gradient(135deg, #064e3b 0%, #047857 40%, #10b981 100%)', pathColor: '#a7f3d0',
        nodes: [
            { level: 1, name: 'Cottage', pct: 0, title: 'Penny Beginner', icon: 'cottage' },
            { level: 2, name: 'Garden Villa', pct: 20, title: 'Budget Explorer', icon: 'villa' },
            { level: 3, name: 'Suburban Residence', pct: 40, title: 'Treasure Hunter', icon: 'suburb' },
            { level: 4, name: 'Luxury Villa', pct: 60, title: 'Savings Knight', icon: 'luxury' },
            { level: 5, name: 'Dream Mansion', pct: 80, title: 'Wealth Wizard', icon: 'mansion' }
        ]
    },
    vehicle: {
        id: 'vehicle', name: 'Vehicle & Garage', category: 'Vehicle', badgeColor: '#ef4444',
        bgGradient: 'linear-gradient(135deg, #450a0a 0%, #7f1d1d 40%, #b91c1c 100%)', pathColor: '#fca5a5',
        nodes: [
            { level: 1, name: 'Garage Bay', pct: 0, title: 'Penny Beginner', icon: 'garage' },
            { level: 2, name: 'Tuning Shop', pct: 20, title: 'Budget Explorer', icon: 'tuning' },
            { level: 3, name: 'Highway Circuit', pct: 40, title: 'Treasure Hunter', icon: 'track' },
            { level: 4, name: 'Showroom', pct: 60, title: 'Savings Knight', icon: 'showroom' },
            { level: 5, name: 'Supercar Garage', pct: 80, title: 'Wealth Wizard', icon: 'supercar' }
        ]
    },
    gaming: {
        id: 'gaming', name: 'Pro Gaming Setup', category: 'Gaming Setup', badgeColor: '#a855f7',
        bgGradient: 'linear-gradient(135deg, #3b0764 0%, #581c87 40%, #7e22ce 100%)', pathColor: '#d8b4fe',
        nodes: [
            { level: 1, name: 'RGB Desk Setup', pct: 0, title: 'Penny Beginner', icon: 'desk' },
            { level: 2, name: 'Battlestation', pct: 20, title: 'Budget Explorer', icon: 'rig' },
            { level: 3, name: 'Stream Studio', pct: 40, title: 'Treasure Hunter', icon: 'studio' },
            { level: 4, name: 'Esports Arena', pct: 60, title: 'Savings Knight', icon: 'arena' },
            { level: 5, name: 'Gaming Palace', pct: 80, title: 'Wealth Wizard', icon: 'gamingpalace' }
        ]
    },
    education: {
        id: 'education', name: 'Higher Education Fund', category: 'Higher Education', badgeColor: '#6366f1',
        bgGradient: 'linear-gradient(135deg, #1e1b4b 0%, #3730a3 40%, #4f46e5 100%)', pathColor: '#c7d2fe',
        nodes: [
            { level: 1, name: 'Study Nook', pct: 0, title: 'Penny Beginner', icon: 'books' },
            { level: 2, name: 'Library', pct: 20, title: 'Budget Explorer', icon: 'library' },
            { level: 3, name: 'Classroom', pct: 40, title: 'Treasure Hunter', icon: 'classroom' },
            { level: 4, name: 'Graduation Hall', pct: 60, title: 'Savings Knight', icon: 'grad' },
            { level: 5, name: 'University Sanctuary', pct: 80, title: 'Wealth Wizard', icon: 'university' }
        ]
    },
    wedding: {
        id: 'wedding', name: 'Royal Wedding Fund', category: 'Wedding', badgeColor: '#f43f5e',
        bgGradient: 'linear-gradient(135deg, #4c0519 0%, #881337 40%, #be123c 100%)', pathColor: '#fda4af',
        nodes: [
            { level: 1, name: 'Garden Gazebo', pct: 0, title: 'Penny Beginner', icon: 'gazebo' },
            { level: 2, name: 'Celebration Lawn', pct: 20, title: 'Budget Explorer', icon: 'lawn' },
            { level: 3, name: 'Grand Pavilion', pct: 40, title: 'Treasure Hunter', icon: 'pavilion' },
            { level: 4, name: 'Palace Hall', pct: 60, title: 'Savings Knight', icon: 'ballroom' },
            { level: 5, name: 'Wedding Fortress', pct: 80, title: 'Wealth Wizard', icon: 'weddingpalace' }
        ]
    },
    emergency: {
        id: 'emergency', name: 'Fortress Emergency Vault', category: 'Emergency Fund', badgeColor: '#64748b',
        bgGradient: 'linear-gradient(135deg, #0f172a 0%, #1e293b 40%, #334155 100%)', pathColor: '#94a3b8',
        nodes: [
            { level: 1, name: 'Safe Box', pct: 0, title: 'Penny Beginner', icon: 'safe' },
            { level: 2, name: 'Vault Room', pct: 20, title: 'Budget Explorer', icon: 'vault' },
            { level: 3, name: 'Bank Reserve', pct: 40, title: 'Treasure Hunter', icon: 'bank' },
            { level: 4, name: 'Treasury Citadel', pct: 60, title: 'Savings Knight', icon: 'treasury' },
            { level: 5, name: 'Wealth Fortress', pct: 80, title: 'Wealth Wizard', icon: 'fortress' }
        ]
    }
};

/**
 * Dynamic Custom Travel Theme Generator (Place-wise unique color palette and icons)
 */
function generateCustomTravelTheme(customDestinationName) {
    const cleanName = (customDestinationName || 'Destination').replace(/Expedition|Journey|Goal/gi, '').trim();
    let hash = 0;
    for (let i = 0; i < cleanName.length; i++) {
        hash = cleanName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    const badgeColor = `hsl(${hue}, 85%, 55%)`;
    const pathColor = `hsl(${hue}, 90%, 75%)`;
    const bgGradient = `linear-gradient(135deg, hsl(${hue}, 60%, 15%) 0%, hsl(${(hue + 40) % 360}, 70%, 25%) 50%, hsl(${hue}, 80%, 35%) 100%)`;

    return {
        id: 'custom_' + cleanName.toLowerCase().replace(/[^a-z0-9]/g, '_'),
        name: cleanName + ' Expedition',
        category: 'Travel',
        badgeColor: badgeColor,
        bgGradient: bgGradient,
        pathColor: pathColor,
        nodes: [
            { level: 1, name: cleanName + ' Base', pct: 0, title: 'Penny Beginner', icon: 'tent' },
            { level: 2, name: cleanName + ' Trail', pct: 20, title: 'Budget Explorer', icon: 'valley' },
            { level: 3, name: cleanName + ' River', pct: 40, title: 'Treasure Hunter', icon: 'river' },
            { level: 4, name: cleanName + ' Peak', pct: 60, title: 'Savings Knight', icon: 'peak' },
            { level: 5, name: cleanName + ' Citadel', pct: 80, title: 'Wealth Wizard', icon: 'skyline' }
        ]
    };
}

/**
 * Cartoon 3D SVG Landmark Icon Generator (NO EMOJIS)
 */
function getLandmarkSVG(iconType, isUnlocked) {
    const strokeColor = isUnlocked ? '#ffffff' : '#64748b';
    const fillColor = isUnlocked ? 'url(#nodeGlow)' : '#1e293b';

    const svgs = {
        torii: `<path d="M4 8h24M6 6v20M26 6v20M10 12h12M12 12v14M20 12v14" stroke="${strokeColor}" stroke-width="2.5" stroke-linecap="round"/>`,
        blossom: `<path d="M16 4a6 6 0 016 6c0 6-6 12-6 12S10 16 10 10a6 6 0 016-6z" fill="${fillColor}" stroke="${strokeColor}" stroke-width="2"/>`,
        pagoda: `<path d="M16 3l-8 5h16l-8-5zm-6 5v4h12V8H10zm-2 4l-4 4h20l-4-4H8zm-2 4v6h16v-6H6z" fill="${fillColor}" stroke="${strokeColor}" stroke-width="1.8"/>`,
        mountain: `<path d="M16 4L4 24h24L16 4zm0 6l4 8h-8l4-8z" fill="${fillColor}" stroke="${strokeColor}" stroke-width="2"/>`,
        skyline: `<path d="M4 26V14h6v12M10 26V8h6v18M16 26V18h6v8M22 26V4h6v22" fill="${fillColor}" stroke="${strokeColor}" stroke-width="2"/>`,
        cafe: `<path d="M6 10h14v10a4 4 0 01-4 4h-6a4 4 0 01-4-4V10zm14 2h3a2 2 0 012 2v2a2 2 0 01-2 2h-3v-6z" fill="${fillColor}" stroke="${strokeColor}" stroke-width="2"/>`,
        eiffel: `<path d="M16 3L11 26h10L16 3zm-4 15h8M10 22h12" stroke="${strokeColor}" stroke-width="2" stroke-linecap="round"/>`,
        louvre: `<path d="M16 4L4 24h24L16 4zM10 16h12M14 10h4" fill="${fillColor}" stroke="${strokeColor}" stroke-width="1.8"/>`,
        chalet: `<path d="M16 4L4 14h4v12h16V14h4L16 4zm-2 10h4v6h-4v-6z" fill="${fillColor}" stroke="${strokeColor}" stroke-width="2"/>`,
        pines: `<path d="M16 3l-6 8h3l-5 8h4l-3 6h14l-3-6h4l-5-8h3l-6-8z" fill="${fillColor}" stroke="${strokeColor}" stroke-width="1.8"/>`,
        hut: `<path d="M16 4L4 14h24L16 4zm-8 10v12h16V14" fill="${fillColor}" stroke="${strokeColor}" stroke-width="2"/>`,
        fort: `<path d="M4 8v16h24V8H4zm4-4h4v4H8V4zm12 0h4v4h-4V4z" fill="${fillColor}" stroke="${strokeColor}" stroke-width="2"/>`,
        cruise: `<path d="M4 18l4-8h16l4 8H4zm4 0v6h16v-6" fill="${fillColor}" stroke="${strokeColor}" stroke-width="2"/>`,
        clinic: `<path d="M12 4h8v8h8v8h-8v8h-8v-8H4v-8h8V4z" fill="${fillColor}" stroke="${strokeColor}" stroke-width="2"/>`,
        hospital: `<path d="M6 6h20v20H6V6zm8 4h4v12h-4V10zm-4 4h12v4H10v-4z" fill="${fillColor}" stroke="${strokeColor}" stroke-width="2"/>`,
        cottage: `<path d="M16 3L3 13h4v12h18V13h4L16 3zm-2 10h4v6h-4v-6z" fill="${fillColor}" stroke="${strokeColor}" stroke-width="2"/>`,
        mansion: `<path d="M2 14l14-10 14 10v12H2V14zm6 2h6v10H8V16zm10 0h6v10h-6V16z" fill="${fillColor}" stroke="${strokeColor}" stroke-width="2"/>`,
        garage: `<path d="M4 8h24v16H4V8zm4 4h16v2H8v-2zm0 4h16v2H8v-2zm0 4h16v2H8v-2z" fill="${fillColor}" stroke="${strokeColor}" stroke-width="2"/>`,
        supercar: `<path d="M5 17l3-7h16l3 7v5H5v-5zm4 1a2 2 0 100 4 2 2 0 000-4zm14 0a2 2 0 100 4 2 2 0 000-4z" fill="${fillColor}" stroke="${strokeColor}" stroke-width="2"/>`,
        desk: `<path d="M4 8h24v4H4V8zm2 4v10M26 12v10M10 12v6h12v-6" fill="${fillColor}" stroke="${strokeColor}" stroke-width="2"/>`,
        rig: `<path d="M6 6h20v14H6V6zm-2 18h24v2H4v-2z" fill="${fillColor}" stroke="${strokeColor}" stroke-width="2"/>`,
        safe: `<path d="M6 6h20v20H6V6zm10 6a4 4 0 100 8 4 4 0 000-8z" fill="${fillColor}" stroke="${strokeColor}" stroke-width="2"/>`,
        vault: `<path d="M4 4h24v24H4V4zm12 4a8 8 0 100 16 8 8 0 000-16z" fill="${fillColor}" stroke="${strokeColor}" stroke-width="2"/>`,
        tent: `<path d="M16 3L2 26h28L16 3zm0 6l6 14H10l6-14z" fill="${fillColor}" stroke="${strokeColor}" stroke-width="2"/>`,
        valley: `<path d="M4 24L12 10l6 8 6-12 8 18H4z" fill="${fillColor}" stroke="${strokeColor}" stroke-width="2"/>`,
        river: `<path d="M4 8c8 0 4 16 12 16s4-16 12-16" fill="none" stroke="${strokeColor}" stroke-width="3"/>`,
        peak: `<path d="M16 4L4 26h24L16 4zm0 4l5 9-5 2-3-4 3-7z" fill="${fillColor}" stroke="${strokeColor}" stroke-width="2"/>`,
        final_castle: `<path d="M4 10v16h24V10l-4-4v4h-4V6l-4 4h-4V6L8 10V6L4 10zm6 6h4v10h-4V16zm8 0h4v10h-4V16z" fill="${fillColor}" stroke="${strokeColor}" stroke-width="2"/>`
    };

    return svgs[iconType] || `<circle cx="16" cy="16" r="10" fill="${fillColor}" stroke="${strokeColor}" stroke-width="2"/>`;
}

/**
 * Cartoon Treasure Chest Component (Closed, Unlocked, Opened)
 */
function getTreasureChestSVG(isUnlocked, isOpened) {
    if (isOpened) {
        return `
            <svg class="chest-svg opened" viewBox="0 0 40 40" width="38" height="38">
                <path d="M6 22h28v12H6z" fill="#b45309" stroke="#fcd34d" stroke-width="2"/>
                <path d="M4 14l16-8 16 8-16 4z" fill="#f59e0b" stroke="#fef08a" stroke-width="2"/>
                <circle cx="20" cy="22" r="3" fill="#fef08a"/>
                <circle cx="12" cy="12" r="2" fill="#fef08a"/>
                <circle cx="28" cy="10" r="2.5" fill="#fef08a"/>
                <circle cx="20" cy="8" r="3" fill="#fcd34d"/>
            </svg>
        `;
    } else if (isUnlocked) {
        return `
            <svg class="chest-svg unlocked bounce" viewBox="0 0 40 40" width="38" height="38">
                <path d="M6 16h28v16H6z" fill="#d97706" stroke="#fef08a" stroke-width="2"/>
                <path d="M6 12a4 4 0 014-4h20a4 4 0 014 4v4H6v-4z" fill="#f59e0b" stroke="#fcd34d" stroke-width="2"/>
                <rect x="17" y="18" width="6" height="8" rx="2" fill="#fef08a" stroke="#78350f" stroke-width="1.5"/>
            </svg>
        `;
    } else {
        return `
            <svg class="chest-svg locked" viewBox="0 0 40 40" width="34" height="34" opacity="0.6">
                <path d="M6 16h28v16H6z" fill="#475569" stroke="#94a3b8" stroke-width="2"/>
                <path d="M6 12a4 4 0 014-4h20a4 4 0 014 4v4H6v-4z" fill="#334155" stroke="#64748b" stroke-width="2"/>
                <rect x="17" y="18" width="6" height="8" rx="2" fill="#94a3b8"/>
            </svg>
        `;
    }
}

function getThemeWeatherHTML(weatherType) {
    if (weatherType === 'sakura_petals') {
        return `
            <div class="weather-layer weather-sakura-petals">
                <div class="petal" style="left:10%; animation-delay:0s;"></div>
                <div class="petal" style="left:30%; animation-delay:2s;"></div>
                <div class="petal" style="left:55%; animation-delay:4s;"></div>
                <div class="petal" style="left:75%; animation-delay:1s;"></div>
                <div class="petal" style="left:90%; animation-delay:3s;"></div>
            </div>
        `;
    } else if (weatherType === 'light_rain') {
        return `
            <div class="weather-layer weather-paris-rain">
                <div class="rain-drop" style="left:15%; animation-delay:0s;"></div>
                <div class="rain-drop" style="left:35%; animation-delay:0.4s;"></div>
                <div class="rain-drop" style="left:60%; animation-delay:0.8s;"></div>
                <div class="rain-drop" style="left:80%; animation-delay:0.2s;"></div>
            </div>
        `;
    } else if (weatherType === 'ocean_waves') {
        return `
            <div class="weather-layer weather-goa-waves">
                <svg class="wave-line" viewBox="0 0 1200 120" preserveAspectRatio="none">
                    <path d="M0,0 Q300,60 600,0 T1200,0 V120 H0 Z"></path>
                </svg>
            </div>
        `;
    } else if (weatherType === 'falling_snow') {
        return `
            <div class="weather-layer weather-kashmir-snow">
                <div class="snowflake" style="left:12%; animation-delay:0s;"></div>
                <div class="snowflake" style="left:28%; animation-delay:1.5s;"></div>
                <div class="snowflake" style="left:50%; animation-delay:3s;"></div>
                <div class="snowflake" style="left:72%; animation-delay:0.8s;"></div>
                <div class="snowflake" style="left:88%; animation-delay:2.2s;"></div>
            </div>
        `;
    } else if (weatherType === 'health_aura') {
        return `
            <div class="weather-layer weather-medical-aura">
                <div class="aura-particle" style="left:20%; animation-delay:0s;"></div>
                <div class="aura-particle" style="left:45%; animation-delay:1.8s;"></div>
                <div class="aura-particle" style="left:70%; animation-delay:3.2s;"></div>
            </div>
        `;
    } else if (weatherType === 'gold_dust') {
        return `
            <div class="weather-layer weather-emergency-gold">
                <div class="gold-sparkle" style="left:15%; animation-delay:0s;"></div>
                <div class="gold-sparkle" style="left:40%; animation-delay:1.2s;"></div>
                <div class="gold-sparkle" style="left:65%; animation-delay:2.5s;"></div>
                <div class="gold-sparkle" style="left:85%; animation-delay:0.6s;"></div>
            </div>
        `;
    }
    return '';
}

function getThemeEnvironmentBackground(themeKey, theme) {
    if (themeKey === 'tokyo') {
        return `<svg class="scenery-bg-svg" viewBox="0 0 950 200" preserveAspectRatio="none">
            <path d="M 320 180 L 475 40 L 630 180 Z" fill="rgba(236,72,153,0.25)"/>
            <path d="M 440 70 L 475 40 L 510 70 Z" fill="#ffffff" opacity="0.85"/>
            <path d="M 0 160 Q 200 120, 450 160 T 950 160 L 950 200 L 0 200 Z" fill="rgba(49,46,129,0.5)"/>
        </svg>`;
    } else if (themeKey === 'paris') {
        return `<svg class="scenery-bg-svg" viewBox="0 0 950 200" preserveAspectRatio="none">
            <path d="M 450 20 L 470 170 h-40 Z" fill="rgba(192,132,252,0.3)" stroke="#c084fc" stroke-width="2"/>
            <path d="M 0 150 Q 250 130, 500 150 T 950 150 L 950 200 L 0 200 Z" fill="rgba(76,29,149,0.5)"/>
        </svg>`;
    } else if (themeKey === 'goa') {
        return `<svg class="scenery-bg-svg" viewBox="0 0 950 200" preserveAspectRatio="none">
            <path d="M 0 140 Q 230 120, 475 140 T 950 140 L 950 200 L 0 200 Z" fill="rgba(4,120,87,0.4)"/>
        </svg>`;
    } else if (themeKey === 'kashmir' || themeKey === 'switzerland') {
        return `<svg class="scenery-bg-svg" viewBox="0 0 950 200" preserveAspectRatio="none">
            <path d="M 0 180 L 150 50 L 300 180 L 500 30 L 700 180 L 850 60 L 950 180 L 950 200 L 0 200 Z" fill="#ffffff" opacity="0.3"/>
            <path d="M 110 85 L 150 50 L 190 85 Z M 440 70 L 500 30 L 560 70 Z M 800 90 L 850 60 L 900 90 Z" fill="#ffffff" opacity="0.9"/>
        </svg>`;
    } else if (themeKey === 'medical') {
        return `<svg class="scenery-bg-svg" viewBox="0 0 950 200" preserveAspectRatio="none">
            <path d="M 100 190 V 60 H 160 V 190 M 300 190 V 40 H 380 V 190 M 700 190 V 50 H 780 V 190" fill="rgba(56,189,248,0.2)"/>
        </svg>`;
    } else if (themeKey === 'emergency') {
        return `<svg class="scenery-bg-svg" viewBox="0 0 950 200" preserveAspectRatio="none">
            <path d="M 0 190 V 70 H 150 V 100 H 300 V 50 H 500 V 100 H 750 V 60 H 950 V 190 Z" fill="rgba(245,158,11,0.25)" stroke="#fcd34d" stroke-width="2"/>
        </svg>`;
    }
    return `<svg class="scenery-bg-svg" viewBox="0 0 950 200" preserveAspectRatio="none">
        <path d="M 0 170 L 150 90 L 300 170 L 500 70 L 700 170 L 850 80 L 950 170 L 950 200 L 0 200 Z" fill="${theme ? theme.badgeColor : '#6366f1'}" opacity="0.25"/>
    </svg>`;
}

function getThemeEnvironmentDecorations(themeKey, theme) {
    if (themeKey === 'tokyo') {
        return `<svg class="scenery-fg-svg" viewBox="0 0 950 200" preserveAspectRatio="none">
            <g opacity="0.6">
                <path d="M 60 175 v-35 h30 v35 M50 145 h50 M55 153 h40" stroke="#f472b6" stroke-width="3" fill="none"/>
                <circle cx="880" cy="135" r="22" fill="#f472b6" opacity="0.5"/>
                <path d="M 880 175 v-20" stroke="#ec4899" stroke-width="4"/>
            </g>
        </svg>`;
    } else if (themeKey === 'paris') {
        return `<svg class="scenery-fg-svg" viewBox="0 0 950 200" preserveAspectRatio="none">
            <g opacity="0.5">
                <path d="M 120 175 v-40 M 115 135 h10 M 118 135 v-10" stroke="#c084fc" stroke-width="2.5"/>
                <path d="M 820 175 v-40 M 815 135 h10 M 818 135 v-10" stroke="#c084fc" stroke-width="2.5"/>
            </g>
        </svg>`;
    } else if (themeKey === 'goa') {
        return `<svg class="scenery-fg-svg" viewBox="0 0 950 200" preserveAspectRatio="none">
            <g opacity="0.7">
                <path d="M 80 175 C 60 130, 90 110, 85 90 M 85 90 l -25 -10 M 85 90 l 25 -10 M 85 90 l -15 20 M 85 90 l 15 20" stroke="#6ee7b7" stroke-width="3" fill="none"/>
                <path d="M 860 175 C 840 130, 870 110, 865 90 M 865 90 l -25 -10 M 865 90 l 25 -10" stroke="#6ee7b7" stroke-width="3" fill="none"/>
            </g>
        </svg>`;
    } else if (themeKey === 'kashmir' || themeKey === 'switzerland') {
        return `<svg class="scenery-fg-svg" viewBox="0 0 950 200" preserveAspectRatio="none">
            <g opacity="0.6">
                <path d="M 80 175 l-15-30 h10 l-15-30 h10 l-10-20 l10 0 l-10 20 h10 l-15 30 h10 z" fill="#67e8f9"/>
                <path d="M 860 175 l-15-30 h10 l-15-30 h10 l-10-20 l10 0 l-10 20 h10 l-15 30 h10 z" fill="#67e8f9"/>
            </g>
        </svg>`;
    } else if (themeKey === 'medical') {
        return `<svg class="scenery-fg-svg" viewBox="0 0 950 200" preserveAspectRatio="none">
            <g opacity="0.6">
                <path d="M 60 140 h30 v30 h-30 z M 70 150 h10 v10 h-10 z" fill="none" stroke="#38bdf8" stroke-width="2"/>
                <path d="M 850 140 h30 v30 h-30 z M 860 150 h10 v10 h-10 z" fill="none" stroke="#38bdf8" stroke-width="2"/>
            </g>
        </svg>`;
    } else if (themeKey === 'emergency') {
        return `<svg class="scenery-fg-svg" viewBox="0 0 950 200" preserveAspectRatio="none">
            <g opacity="0.6">
                <path d="M 70 175 v-40 h20 v40 M 65 135 h30" stroke="#fcd34d" stroke-width="3" fill="none"/>
                <path d="M 860 175 v-40 h20 v40 M 855 135 h30" stroke="#fcd34d" stroke-width="3" fill="none"/>
            </g>
        </svg>`;
    }
    return '';
}

function getWeatherTypeByTheme(themeKey) {
    if (themeKey === 'tokyo') return 'sakura_petals';
    if (themeKey === 'paris') return 'light_rain';
    if (themeKey === 'goa') return 'ocean_waves';
    if (themeKey === 'kashmir' || themeKey === 'switzerland') return 'falling_snow';
    if (themeKey === 'medical') return 'health_aura';
    if (themeKey === 'emergency') return 'gold_dust';
    return 'gold_dust';
}

function getDestinationTheme(themeKey, goalTitle) {
    if (!themeKey) themeKey = 'tokyo';

    // 1. Check explicit DREAM_THEMES registry
    if (DREAM_THEMES[themeKey]) {
        return DREAM_THEMES[themeKey];
    }

    // 2. Lookup in TRAVEL_DESTINATIONS_DATA
    let destName = null;
    if (typeof TRAVEL_DESTINATIONS_DATA !== 'undefined') {
        for (const regionKey in TRAVEL_DESTINATIONS_DATA) {
            const item = TRAVEL_DESTINATIONS_DATA[regionKey].items.find(i => i.id === themeKey);
            if (item) {
                destName = item.name;
                break;
            }
        }
    }

    if (!destName) {
        destName = goalTitle ? goalTitle.replace(/Expedition|Journey|Goal/gi, '').trim() : themeKey;
    }

    // 3. Generate place-wise unique theme
    return generateCustomTravelTheme(destName);
}

/**
 * DreamMap Renderer Component
 * Renders Clash-of-Clans style horizontally scrollable journey map canvas
 */
function renderDreamJourneyMap(goal) {
    let themeKey = goal.theme || 'tokyo';
    let theme = getDestinationTheme(themeKey, goal.title);

    const currentAmount = parseFloat(goal.current_amount || 0);
    const targetAmount = parseFloat(goal.target_amount || 1000);
    const progressPct = Math.min(100, Math.floor((currentAmount / targetAmount) * 100));

    let currentLevel = 1;
    if (progressPct >= 100) currentLevel = 5;
    else if (progressPct >= 80) currentLevel = 5;
    else if (progressPct >= 60) currentLevel = 4;
    else if (progressPct >= 40) currentLevel = 3;
    else if (progressPct >= 20) currentLevel = 2;

    const isCompleted = progressPct >= 100;
    const unlockedTitle = goal.unlocked_title || (theme && theme.nodes && theme.nodes[currentLevel - 1] ? (theme.nodes[currentLevel - 1].name || 'Penny Beginner') : 'Penny Beginner');
    const weatherType = theme ? (theme.weatherType || getWeatherTypeByTheme(themeKey)) : 'gold_dust';

    let nodesHTML = '';
    theme.nodes.forEach((node, index) => {
        const nodeLevel = index + 1;
        const isUnlocked = progressPct >= node.pct;
        const isCurrent = (currentLevel === nodeLevel && !isCompleted) || (isCompleted && nodeLevel === 5);
        const isChestOpened = progressPct >= node.pct;
        const isFinalCastle = nodeLevel === 5;

        const nodeIcon = isFinalCastle ? 'final_castle' : node.icon;
        let nodeClass = isUnlocked ? (isCurrent ? 'node-item active-current' : 'node-item unlocked') : 'node-item locked';
        if (isFinalCastle) nodeClass += ' final-castle-node';

        nodesHTML += `
            <div class="${nodeClass}" data-level="${nodeLevel}" onclick="onMilestoneNodeClick(${goal.id}, ${nodeLevel}, ${isUnlocked}, '${node.name.replace(/'/g, "\\'")}')">
                ${isCurrent ? `<div class="player-marker-avatar"><i class="fa-solid fa-location-dot"></i> YOU ARE HERE</div>` : ''}
                ${isFinalCastle ? `<div class="castle-flag-banner"><i class="fa-solid fa-flag"></i> 100% CASTLE</div>` : ''}

                <div class="node-badge">
                    <span class="level-num">${isFinalCastle ? '🏰 Citadel' : 'Lvl ' + nodeLevel}</span>
                </div>

                <div class="node-landmark-circle">
                    <svg viewBox="0 0 32 32" width="${isFinalCastle ? 54 : 44}" height="${isFinalCastle ? 54 : 44}">
                        <defs>
                            <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
                                <stop offset="0%" stop-color="${theme.badgeColor}"/>
                                <stop offset="100%" stop-color="#4f46e5"/>
                            </radialGradient>
                        </defs>
                        ${getLandmarkSVG(nodeIcon, isUnlocked)}
                    </svg>
                </div>

                <div class="node-info-box">
                    <div class="node-name">${node.name}</div>
                    <div class="node-pct-label">${node.pct}% Target</div>
                </div>

                <div class="node-chest-box" title="Click to view Milestone Rewards">
                    ${getTreasureChestSVG(isUnlocked, isChestOpened)}
                </div>
            </div>
        `;
    });

    return `
        <div class="dream-goal-card glass-card" id="goal-card-${goal.id}" style="background:${theme.bgGradient}; border:2px solid ${theme.badgeColor}; margin-bottom:28px;">
            <div class="dream-card-header">
                <div class="theme-title-box">
                    <span class="theme-badge" style="background:${theme.badgeColor};"><i class="fa-solid fa-map-location-dot"></i> ${theme.category} • ${theme.name}</span>
                    <h3 class="goal-main-title" style="margin-top:6px;">${goal.title}</h3>
                </div>
                <div class="goal-action-btns">
                    <button class="btn btn-secondary btn-sm" style="font-weight:700;" onclick="addGoalSavingsModal(${goal.id}, ${currentAmount}, ${targetAmount})">
                        <i class="fa-solid fa-plus-circle"></i> Add Savings
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deleteDreamGoal(${goal.id})">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>

            <div class="dream-xp-header" style="margin:16px 0 14px 0;">
                <div class="xp-title-row" style="display:flex; justify-content:space-between; font-size:13px; margin-bottom:8px;">
                    <span class="title-unlocked-badge" style="color:#fcd34d; font-weight:800;"><i class="fa-solid fa-shield-halved"></i> Title: ${unlockedTitle}</span>
                    <span class="pct-saved-label" style="font-weight:800; color:#ffffff;">${progressPct}% Saved (${fmt(currentAmount)} / ${fmt(targetAmount)})</span>
                </div>
                <div class="xp-bar-container" style="background:rgba(15,23,42,0.7); height:14px; border-radius:7px; overflow:hidden; border:1.5px solid rgba(255,255,255,0.2);">
                    <div class="xp-bar-fill-clash" style="width:${progressPct}%; background:${theme.badgeColor}; height:100%; transition:width 0.6s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 0 10px ${theme.badgeColor};"></div>
                </div>
            </div>

            <div class="dream-map-wrapper">
                <div class="dream-map-track">
                    <!-- Unique Environment Scenery Layers -->
                    ${getThemeEnvironmentBackground(themeKey, theme)}
                    ${getThemeEnvironmentDecorations(themeKey, theme)}

                    <!-- Unique Animated Weather Effects -->
                    ${getThemeWeatherHTML(weatherType)}

                    <!-- Floating Clouds -->
                    <div class="cloud cloud-1"></div>
                    <div class="cloud cloud-2"></div>
                    <div class="cloud cloud-3"></div>

                    <!-- Theme-Specific Textured Road / Path SVG -->
                    <svg class="map-connecting-path" viewBox="0 0 950 140" preserveAspectRatio="none">
                        <path d="M 50 70 Q 260 20, 475 70 T 900 70" fill="none" stroke="rgba(15,23,42,0.9)" stroke-width="16" stroke-linecap="round"/>
                        <path d="M 50 70 Q 260 20, 475 70 T 900 70" fill="none" stroke="${theme.pathColor}" stroke-width="10" stroke-linecap="round" opacity="0.9"/>
                        <path d="M 50 70 Q 260 20, 475 70 T 900 70" fill="none" stroke="#ffffff" stroke-width="3" stroke-dasharray="10 8" opacity="0.9"/>
                    </svg>

                    <!-- Milestone Nodes Row -->
                    <div class="nodes-row">
                        ${nodesHTML}
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Handle Node Click / Treasure Chest Interaction
 */
function onMilestoneNodeClick(goalId, level, isUnlocked, nodeName) {
    if (isUnlocked) {
        showAchievementPopup({
            title: `🏆 Milestone Unlocked!`,
            subtitle: `You reached Level ${level}: ${nodeName}`,
            xp: level * 50,
            badge: `Level ${level} Master`
        });
    } else {
        alert(`🔒 Node Locked: Save more money toward this goal to unlock Level ${level} (${nodeName}) and claim your Treasure Chest rewards!`);
    }
}

/**
 * Show Achievement Level-Up Celebratory Popup Modal
 */
function showAchievementPopup({ title, subtitle, xp, badge }) {
    const modal = document.getElementById('modal-goal-levelup');
    if (!modal) return;

    document.getElementById('levelup-modal-title').innerText = title;
    document.getElementById('levelup-modal-sub').innerText = subtitle;
    document.getElementById('levelup-xp-amount').innerText = `+${xp} XP`;
    document.getElementById('levelup-badge-name').innerText = badge;

    openModal('modal-goal-levelup');
}

/**
 * Initialize 2-Level Searchable Dropdowns for Goal Categories & Destinations
 */
function initDreamGoalDropdowns() {
    const destSelect = document.getElementById('goal-destination-select');
    if (!destSelect) return;

    let html = '';
    for (const key in TRAVEL_DESTINATIONS_DATA) {
        const group = TRAVEL_DESTINATIONS_DATA[key];
        html += `<optgroup label="${group.regionName}" data-region="${key}">`;
        group.items.forEach(item => {
            html += `<option value="${item.id}">${item.name}</option>`;
        });
        html += `</optgroup>`;
    }
    destSelect.innerHTML = html;

    // Trigger initial category check
    onGoalCategoryChange();
}

/**
 * Level 1 Search Filter (Goal Category)
 */
function filterCategoryOptions() {
    const query = (document.getElementById('category-search-input').value || '').toLowerCase().trim();
    const select = document.getElementById('goal-category-select');
    if (!select) return;

    Array.from(select.options).forEach(opt => {
        const text = opt.text.toLowerCase();
        opt.style.display = text.includes(query) ? '' : 'none';
    });
}

/**
 * Level 2 Search Filter (Travel Destination with Fuzzy & Region Grouping)
 */
function filterDestinationOptions() {
    const query = (document.getElementById('destination-search-input').value || '').toLowerCase().trim();
    const select = document.getElementById('goal-destination-select');
    if (!select) return;

    Array.from(select.querySelectorAll('optgroup')).forEach(group => {
        let hasVisibleChild = false;
        Array.from(group.querySelectorAll('option')).forEach(opt => {
            const text = opt.text.toLowerCase();
            const matches = text.includes(query);
            opt.style.display = matches ? '' : 'none';
            if (matches) hasVisibleChild = true;
        });
        group.style.display = hasVisibleChild ? '' : 'none';
    });
}

/**
 * Level 1 Category Selection Change Event
 */
function onGoalCategoryChange() {
    const catSelect = document.getElementById('goal-category-select');
    const destBox = document.getElementById('travel-destination-box');
    const customBox = document.getElementById('custom-destination-box');
    if (!catSelect) return;

    const selectedCat = catSelect.value;
    if (selectedCat === 'travel') {
        if (destBox) destBox.style.display = 'block';
        onTravelDestinationChange();
    } else {
        if (destBox) destBox.style.display = 'none';
        if (customBox) customBox.style.display = 'none';
    }
}

/**
 * Level 2 Destination Selection Change Event
 */
function onTravelDestinationChange() {
    const destSelect = document.getElementById('goal-destination-select');
    const customBox = document.getElementById('custom-destination-box');
    if (!destSelect) return;

    if (destSelect.value === 'other_destination') {
        if (customBox) customBox.style.display = 'block';
    } else {
        if (customBox) customBox.style.display = 'none';
    }
}

/**
 * Get Final Theme Key / Custom Theme object for Goal Creation
 */
function getSelectedGoalTheme() {
    const catSelect = document.getElementById('goal-category-select');
    if (!catSelect) return 'tokyo';

    const category = catSelect.value;
    if (category === 'travel') {
        const destSelect = document.getElementById('goal-destination-select');
        const destValue = destSelect ? destSelect.value : 'tokyo';
        if (destValue === 'other_destination') {
            const customInput = document.getElementById('goal-custom-destination-input');
            const customName = customInput && customInput.value.trim() ? customInput.value.trim() : 'Antarctica';
            return 'custom_' + customName.toLowerCase().replace(/[^a-z0-9]/g, '_');
        }
        return destValue;
    } else {
        return category;
    }
}

// Automatically initialize when DOM loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDreamGoalDropdowns);
} else {
    initDreamGoalDropdowns();
}
