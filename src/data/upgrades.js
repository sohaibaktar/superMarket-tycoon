/**
 * Store upgrade definitions and milestone targets.
 */
export const UPGRADES = {
    cashier_speed: {
        id: 'cashier_speed',
        name: 'Register Scanner Speed',
        icon: '⚡',
        description: 'Accelerate barcode scanning and customer checkout throughput.',
        maxLevel: 3,
        levels: [
            { level: 1, name: 'Laser Barcode Scanner', cost: 150, perkDescription: '40% faster checkout scans', delayMs: 500 },
            { level: 2, name: 'Dual-Belt Conveyor', cost: 350, perkDescription: '70% faster checkout scans', delayMs: 280 },
            { level: 3, name: 'AI Express Checkout', cost: 750, perkDescription: 'Near-instant checkout scans', delayMs: 120 }
        ]
    },
    shelf_capacity: {
        id: 'shelf_capacity',
        name: 'Warehouse Shelf Capacity',
        icon: '📦',
        description: 'Expand inventory capacity across all store display shelves.',
        maxLevel: 3,
        levels: [
            { level: 1, name: 'Reinforced Steel Brackets', cost: 120, perkDescription: '+5 extra shelf capacity to all goods', extraCap: 5 },
            { level: 2, name: 'Double Gondola Display', cost: 280, perkDescription: '+10 extra shelf capacity to all goods', extraCap: 10 },
            { level: 3, name: 'Industrial Bulk Racks', cost: 600, perkDescription: '+20 extra shelf capacity to all goods', extraCap: 20 }
        ]
    },
    department_license: {
        id: 'department_license',
        name: 'Gourmet Department Permit',
        icon: '🌾',
        description: 'Permit to stock high-margin Jasmine Rice and specialty groceries.',
        maxLevel: 1,
        levels: [
            { level: 1, name: 'Jasmine Rice Commercial Permit', cost: 200, perkDescription: 'Unlocks Jasmine Rice for customer demand and restocking' }
        ]
    }
};

export const MILESTONES = [
    { id: 'm1_mini_mart', title: 'Local Mini Mart', targetRevenue: 2000, rewardCoins: 300 },
    { id: 'm2_supermarket', title: 'Neighborhood Supermarket', targetRevenue: 5000, rewardCoins: 800 },
    { id: 'm3_tycoon', title: 'Mega Supermarket Tycoon', targetRevenue: 15000, rewardCoins: 2500 }
];
