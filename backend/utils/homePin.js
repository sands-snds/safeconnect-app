const { isWithinSantaFe } = require("./santaFeArea");

// The home pin from the sign-up form's map (optional): { lat, lng }.
// Returns { pin: null } when none was set, { pin: { lat, lng } } (7 decimal
// places, about 1 cm) when it is in Barangay Santa Fe, or { error }.
const parseHomePin = (value) => {
    if (value == null || value === "") return { pin: null };
    const lat = Number(value.lat);
    const lng = Number(value.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
        return { error: "The map pin for your home isn't valid. Please pin it again." };
    }
    if (!isWithinSantaFe(lat, lng)) {
        return { error: "Your home pin is outside Barangay Santa Fe. Please move it to your home, or remove it." };
    }
    return { pin: { lat: Number(lat.toFixed(7)), lng: Number(lng.toFixed(7)) } };
};

module.exports = { parseHomePin };
