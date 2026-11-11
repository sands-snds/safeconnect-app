const { isWithinSantaFe } = require("./santaFeArea");

// The home pin from the sign-up form's map (required): { lat, lng }.
// Returns { pin: { lat, lng } } (7 decimal places, about 1 cm) when it is in
// Barangay Santa Fe, or { error }. Reports made "at my home" use it, so they
// show on the map (utils/homeCoords.js).
const parseHomePin = (value) => {
    if (value == null || value === "") return { error: "Please pin your home on the map." };
    const lat = Number(value.lat);
    const lng = Number(value.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
        return { error: "The map pin for your home isn't valid. Please pin it again." };
    }
    if (!isWithinSantaFe(lat, lng)) {
        return { error: "Your home pin is outside Barangay Santa Fe. Please move it to your home." };
    }
    return { pin: { lat: Number(lat.toFixed(7)), lng: Number(lng.toFixed(7)) } };
};

module.exports = { parseHomePin };
