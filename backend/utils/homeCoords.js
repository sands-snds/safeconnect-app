const { isWithinSantaFe } = require("./santaFeArea");

// A resident's home pin (from the sign-up map), or null.
const homePinOf = (account) => {
    const lat = Number(account && account.home_latitude);
    const lng = Number(account && account.home_longitude);
    if (!account || account.home_latitude == null || account.home_longitude == null) return null;
    return Number.isFinite(lat) && Number.isFinite(lng) && isWithinSantaFe(lat, lng) ? { lat, lng } : null;
};

const norm = (s) => String(s || "").toLowerCase().replace(/\s+/g, " ").trim();

// A new report with no map position whose address is the reporter's
// registered home ("at my home"): it takes their home pin, so it is on the
// map like every other report. A report with its own pin, or somewhere else,
// is left as it is.
const fillHomeCoords = (body, account) => {
    const hasCoords = Number.isFinite(Number(body.latitude)) && body.latitude !== null && body.latitude !== ""
        && Number.isFinite(Number(body.longitude)) && body.longitude !== null && body.longitude !== "";
    if (hasCoords) return body;
    const pin = homePinOf(account);
    const house = norm(account && account.address_house_number);
    const street = norm(account && account.address_street);
    const location = norm(body.location);
    if (!pin || !house || !street || !location.includes(house) || !location.includes(street)) return body;
    return { ...body, latitude: pin.lat, longitude: pin.lng };
};

module.exports = { homePinOf, fillHomeCoords };
