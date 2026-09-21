// Aggregates a resident's reports across all three report types, for
// MyReportsPage.jsx (fetchMyReports() in Services/api.js calls
// GET /api/reports/user/:userId).
const Report = require("../models/Report");
const AssistanceRequest = require("../models/AssistanceRequest");
const PettyCrime = require("../models/PettyCrime");

// Normalizes each report type's raw DB columns into the shape
// MyReportsPage.jsx (list/filter/display) and the resident modals'
// edit-prefill code expect: type, title, description, date, location,
// status, id — plus the type-specific fields needed to restore the
// edit form (peopleAffected/specialNeeds, urgency, suspectInfo, etc.)
const normalizeEmergency = (r) => ({
    ...r,
    type: "Emergency",
    title: r.emergency_type,
    description: r.incident_details,
    date: r.time,
    location: r.location,
    peopleAffected: r.number_of_people_affected,
    specialNeeds: r.special_needs,
    latitude: r.latitude,
    longitude: r.longitude
});

const normalizeAssistance = (r) => ({
    ...r,
    type: "Assistance",
    title: r.request_assistance_type,
    description: r.describe_your_situation,
    date: r.timestamp,
    location: r.current_location,
    urgency: r.urgency_level,
    specialNeeds: r.special_needs,
    latitude: r.latitude,
    longitude: r.longitude
});

const normalizePettyCrime = (r) => ({
    ...r,
    type: "Petty Crime",
    title: r.crime_type,
    description: r.description,
    date: r.timestamp,
    location: r.location,
    suspectInfo: r.suspect_info,
    latitude: r.latitude,
    longitude: r.longitude
});

exports.getMyReports = async (req, res) => {
    try {
        const userId = req.params.userId;

        const [emergency, assistance, pettyCrime] = await Promise.all([
            Report.findByReporter(userId),
            AssistanceRequest.findByReporter(userId),
            PettyCrime.findByReporter(userId)
        ]);

        const combined = [
            ...emergency.map(normalizeEmergency),
            ...assistance.map(normalizeAssistance),
            ...pettyCrime.map(normalizePettyCrime)
        ].sort((a, b) => new Date(b.date) - new Date(a.date));

        res.json(combined);
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to load your reports." });
    }
};
