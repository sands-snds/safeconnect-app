const Report = require("../models/Report");
const AssistanceRequest = require("../models/AssistanceRequest");
const PettyCrime = require("../models/PettyCrime");

// When the resident page's emergency call button appears: only after the
// resident has submitted a report, and only once that report's waiting time
// has passed. Times are worked out from the database's clock, so they hold
// across refreshes, sign-outs and devices. The button stays while the report
// is open (not Resolved, Dismissed or archived).
const MINUTE = 60;

// Where the barangay gave a range, the start of it is used, so help is
// reachable as soon as the range allows.
const EMERGENCY_WAIT = {
    "Fire Emergency": 0,
    "Flood Emergency": 10 * MINUTE, // 10–15 minutes
    "Earthquake": 5 * MINUTE, // 5–10 minutes
    "Typhoon": 10 * MINUTE // like a flood
};
const DEFAULT_EMERGENCY_WAIT = 10 * MINUTE;

const ASSISTANCE_WAIT = { "Transport Vehicle": 5 * MINUTE };
const DEFAULT_ASSISTANCE_WAIT = 20 * MINUTE;

const PETTY_CRIME_WAIT = 20 * MINUTE;

const waitFor = (type, kind) => {
    if (type === "emergency") return EMERGENCY_WAIT[kind] ?? DEFAULT_EMERGENCY_WAIT;
    if (type === "assistance") return ASSISTANCE_WAIT[kind] ?? DEFAULT_ASSISTANCE_WAIT;
    return PETTY_CRIME_WAIT;
};

// { available, secondsUntilAvailable }: available once any open report's
// wait is over; otherwise how long until the soonest one is (null when the
// resident has no open report at all).
exports.getCallAccess = async (reporterId) => {
    const [emergency, assistance, pettyCrime] = await Promise.all([
        Report.findOpenWithAge(reporterId),
        AssistanceRequest.findOpenWithAge(reporterId),
        PettyCrime.findOpenWithAge(reporterId)
    ]);

    const remaining = [
        ...emergency.map((r) => ["emergency", r]),
        ...assistance.map((r) => ["assistance", r]),
        ...pettyCrime.map((r) => ["pettyCrime", r])
    ].map(([type, r]) => Math.max(0, waitFor(type, r.kind) - Math.max(0, Number(r.age_seconds) || 0)));

    if (remaining.length === 0) return { available: false, secondsUntilAvailable: null };
    const soonest = Math.min(...remaining);
    return { available: soonest === 0, secondsUntilAvailable: soonest };
};
