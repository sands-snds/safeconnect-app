// A resident's home address in Barangay Santa Fe: house / lot / block no.
// and street (required), subdivision or purok (optional). The barangay,
// city and province are always Santa Fe, Dasmariñas, Cavite.
const LIMITS = { houseNumber: 60, street: 120, area: 120 };

const clean = (value) => (typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "");

// Returns { address: { houseNumber, street, area } } or { error }.
const parseAddress = (input) => {
    const address = {
        houseNumber: clean(input && input.houseNumber),
        street: clean(input && input.street),
        area: clean(input && input.area)
    };
    if (!address.houseNumber) return { error: "Please enter your house, lot or block number in Barangay Santa Fe." };
    if (!address.street) return { error: "Please enter your street in Barangay Santa Fe." };
    for (const [key, max] of Object.entries(LIMITS)) {
        if (address[key].length > max) return { error: `That address is too long (up to ${max} characters per line).` };
    }
    return { address };
};

// The address columns of a registered_users row, as the API sends it.
const addressOf = (row) => (row && (row.address_house_number || row.address_street)
    ? { houseNumber: row.address_house_number || "", street: row.address_street || "", area: row.address_area || "" }
    : null);

module.exports = { parseAddress, addressOf };
