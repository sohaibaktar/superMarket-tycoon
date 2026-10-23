/**
 * Product definitions for Supermarket Tycoon: Mini Mart.
 * Values calibrated to Section 3 of the Technical Specification.
 */
export const PRODUCTS = {
    apples: {
        id: 'apples',
        displayName: 'Fresh Apples',
        shortName: 'Apples',
        restockCost: 5,
        sellPrice: 10,
        startingStock: 5,
        maxShelfStock: 20,
        color: 0xef4444, // Vibrant Red
        textColor: '#ef4444',
        accentColor: 0xdc2626
    },
    milk: {
        id: 'milk',
        displayName: 'Whole Milk',
        shortName: 'Milk',
        restockCost: 8,
        sellPrice: 15,
        startingStock: 5,
        maxShelfStock: 15,
        color: 0x3b82f6, // Crisp Blue
        textColor: '#3b82f6',
        accentColor: 0x2563eb
    },
    bread: {
        id: 'bread',
        displayName: 'Artisan Bread',
        shortName: 'Bread',
        restockCost: 6,
        sellPrice: 12,
        startingStock: 5,
        maxShelfStock: 15,
        color: 0xf59e0b, // Warm Amber
        textColor: '#f59e0b',
        accentColor: 0xd97706
    },
    rice: {
        id: 'rice',
        displayName: 'Jasmine Rice',
        shortName: 'Rice',
        restockCost: 10,
        sellPrice: 18,
        startingStock: 5,
        maxShelfStock: 10,
        color: 0x10b981, // Fresh Emerald
        textColor: '#10b981',
        accentColor: 0x059669
    },
    snacks: {
        id: 'snacks',
        displayName: 'Crispy Snacks',
        shortName: 'Snacks',
        restockCost: 4,
        sellPrice: 9,
        startingStock: 5,
        maxShelfStock: 25,
        color: 0xec4899, // Bright Pink
        textColor: '#ec4899',
        accentColor: 0xdb2777
    }
};

export const INITIAL_COINS = 500;
export const FIRST_MILESTONE_COINS = 2000;
