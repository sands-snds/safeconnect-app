// Shared "SC-<year>-<sequence>" reference number generator, used by all
// report types (emergency, assistance, petty crime) so the numbering logic
// isn't duplicated three times.
const generateReference = async (getLatestFn) => {
    const year = new Date().getFullYear();
    const latest = await getLatestFn();
    let nextNumber = 1;
    if (latest && latest.report_reference) {
        const parts = latest.report_reference.split("-");
        if (parts.length === 3 && parts[1] === String(year)) {
            nextNumber = parseInt(parts[2], 10) + 1;
        }
    }
    return `SC-${year}-${String(nextNumber).padStart(6, "0")}`;
};

module.exports = { generateReference };
