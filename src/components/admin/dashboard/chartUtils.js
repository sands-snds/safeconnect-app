export const buildPieData = (items, key) => {

    const counts = {};

    items.forEach(item => {

        const value = item[key] || "Unknown";

        counts[value] = (counts[value] || 0) + 1;

    });

    return Object.entries(counts).map(([name, value]) => ({
        name,
        value
    }));

};