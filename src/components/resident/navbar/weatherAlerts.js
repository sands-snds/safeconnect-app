// Heat index and tropical cyclone wind signal, worked out from the
// Open-Meteo forecast (temperature, humidity, sustained wind).

// NOAA's heat index (Rothfusz regression with its adjustments), which PAGASA
// also uses. Takes and returns °C.
export const heatIndexC = (tempC, humidity) => {
    if (!Number.isFinite(tempC) || !Number.isFinite(humidity)) return null;
    const T = tempC * 9 / 5 + 32;
    const R = humidity;
    let hi = 0.5 * (T + 61 + (T - 68) * 1.2 + R * 0.094);
    if ((hi + T) / 2 >= 80) {
        hi = -42.379 + 2.04901523 * T + 10.14333127 * R - 0.22475541 * T * R
            - 0.00683783 * T * T - 0.05481717 * R * R + 0.00122874 * T * T * R
            + 0.00085282 * T * R * R - 0.00000199 * T * T * R * R;
        if (R < 13 && T >= 80 && T <= 112) hi -= ((13 - R) / 4) * Math.sqrt((17 - Math.abs(T - 95)) / 17);
        else if (R > 85 && T >= 80 && T <= 87) hi += ((R - 85) / 10) * ((87 - T) / 5);
    }
    return Math.round((hi - 32) * 5 / 9);
};

// PAGASA's heat index classification.
const HEAT_LEVELS = [
    { min: 52, key: "extremeDanger", color: "#7f1d1d" },
    { min: 42, key: "danger", color: "#dc2626" },
    { min: 33, key: "extremeCaution", color: "#c2410c" },
    { min: 27, key: "caution", color: "#a16207" }
];

export const heatLevel = (hi) => {
    if (!Number.isFinite(hi)) return null;
    return HEAT_LEVELS.find((l) => hi >= l.min) || { key: "normal", color: "#15803d" };
};

// PAGASA Tropical Cyclone Wind Signals, by sustained wind (km/h).
const SIGNALS = [
    { level: 5, min: 185, range: "185+" },
    { level: 4, min: 118, range: "118–184" },
    { level: 3, min: 89, range: "89–117" },
    { level: 2, min: 62, range: "62–88" },
    { level: 1, min: 39, range: "39–61" }
];

export const SIGNAL_COLORS = { 1: "#0ea5e9", 2: "#eab308", 3: "#f97316", 4: "#dc2626", 5: "#7c3aed" };

export const windSignal = (windKmh) => {
    if (!Number.isFinite(windKmh)) return null;
    return SIGNALS.find((s) => windKmh >= s.min) || null;
};
