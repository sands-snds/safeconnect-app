import React, { useMemo, useState } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from "recharts";

import Section from "../shared/Section";
import GenerateReportButton from "../shared/GenerateReportButton";

const RANGE_OPTIONS = [
    { key: "7d", label: "Last 7 Days", days: 7 },
    { key: "15d", label: "Last 15 Days", days: 15 },
    { key: "30d", label: "Last 30 Days", days: 30 },
    { key: "90d", label: "Last 90 Days", days: 90 }
];

// "category" puts each category's bar side by side per day; "overall"
// stacks them into one bar showing the day's total.
const VIEW_OPTIONS = [
    { key: "category", label: "Each Category" },
    { key: "overall", label: "Overall" }
];

const toggleButtonStyle = (active) => ({
    padding: "6px 12px",
    borderRadius: "6px",
    border: "1px solid " + (active ? "#3b82f6" : "#d1d5db"),
    background: active ? "#eff6ff" : "#fff",
    color: active ? "#1d4ed8" : "#374151",
    fontSize: "12.5px",
    fontWeight: 500,
    cursor: "pointer"
});

const REPORT_SERIES = [
    { key: "emergency", label: "Emergency", color: "#ef4444" },
    { key: "assistance", label: "Assistance", color: "#3b82f6" },
    { key: "pettyCrime", label: "Petty Crime", color: "#f59e0b" }
];

// Local YYYY-MM-DD key -- deliberately not toISOString(), which shifts to
// UTC and can push a late-evening local report into the "wrong" day's bucket.
const dayKey = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
};

const dayLabel = (date) =>
    date.toLocaleDateString(undefined, { month: "short", day: "numeric" });

export default function ReportsOverTimeChart({
    emergencyReports = [],
    assistanceRequests = [],
    pettyCrimeReports = []
}) {
    const [rangeKey, setRangeKey] = useState("30d");
    const [viewMode, setViewMode] = useState("category");
    const range = RANGE_OPTIONS.find((r) => r.key === rangeKey) || RANGE_OPTIONS[2];
    const stacked = viewMode === "overall";

    const chartData = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Pre-build one bucket per day in the selected range, oldest first,
        // so days with zero reports still show up as a flat bar instead of
        // silently disappearing from the axis.
        const buckets = [];
        const bucketByKey = {};
        for (let i = range.days - 1; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const key = dayKey(d);
            const bucket = { key, label: dayLabel(d), emergency: 0, assistance: 0, pettyCrime: 0 };
            buckets.push(bucket);
            bucketByKey[key] = bucket;
        }

        const tally = (reports, seriesKey) => {
            reports.forEach((r) => {
                if (!r.rawDate) return;
                const reportDate = new Date(r.rawDate);
                if (isNaN(reportDate)) return;
                const key = dayKey(reportDate);
                const bucket = bucketByKey[key];
                if (bucket) bucket[seriesKey]++;
            });
        };

        tally(emergencyReports, "emergency");
        tally(assistanceRequests, "assistance");
        tally(pettyCrimeReports, "pettyCrime");

        return buckets;
    }, [emergencyReports, assistanceRequests, pettyCrimeReports, range.days]);

    const totalInRange = chartData.reduce(
        (sum, day) => sum + day.emergency + day.assistance + day.pettyCrime,
        0
    );

    const tickInterval = range.days > 30 ? Math.ceil(range.days / 15) : range.days > 14 ? 1 : 0;

    return (
        <Section title="Reports Over Time">
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "12px",
                    marginBottom: "16px"
                }}
            >
                <span style={{ fontSize: "13px", color: "#6b7280" }}>
                    {totalInRange} report{totalInRange === 1 ? "" : "s"} in this period
                </span>

                <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                    {RANGE_OPTIONS.map((opt) => (
                        <button
                            key={opt.key}
                            type="button"
                            onClick={() => setRangeKey(opt.key)}
                            style={toggleButtonStyle(rangeKey === opt.key)}
                        >
                            {opt.label}
                        </button>
                    ))}

                    {/* Exports the same range as the chart, one row per day. */}
                    <GenerateReportButton
                        type="reportsOverTime"
                        inline
                        filters={{
                            days: range.days,
                            tzOffset: new Date().getTimezoneOffset()
                        }}
                    />
                </div>
            </div>

            {totalInRange === 0 ? (
                <div style={{ textAlign: "center", padding: "48px", color: "#6b7280" }}>
                    No reports in this period yet
                </div>
            ) : (

                <div style={{ width: "100%", minWidth: 0, overflow: "hidden" }}>
                    <ResponsiveContainer width="100%" height={320} debounce={200}>
                        <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis
                                dataKey="label"
                                interval={tickInterval}
                                tick={{ fontSize: 11 }}
                                angle={range.days > 14 ? -35 : 0}
                                textAnchor={range.days > 14 ? "end" : "middle"}
                                height={range.days > 14 ? 50 : 30}
                            />
                            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={32} />
                            <Tooltip
                                formatter={(value, name) => [
                                    value,
                                    REPORT_SERIES.find((s) => s.key === name)?.label || name
                                ]}
                            />
                            <Legend
                                formatter={(value) =>
                                    REPORT_SERIES.find((s) => s.key === value)?.label || value
                                }
                            />
                            {REPORT_SERIES.map((series) => (
                                <Bar
                                    key={series.key}
                                    dataKey={series.key}
                                    name={series.key}
                                    stackId={stacked ? "reports" : undefined}
                                    fill={series.color}
                                    radius={
                                        !stacked || series.key === REPORT_SERIES[REPORT_SERIES.length - 1].key
                                            ? [4, 4, 0, 0]
                                            : 0
                                    }
                                />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {totalInRange > 0 && (
            <div style={{ display: "flex", justifyContent: "center", gap: "6px", marginTop: "12px" }}>
                {VIEW_OPTIONS.map((opt) => (
                    <button
                        key={opt.key}
                        type="button"
                        onClick={() => setViewMode(opt.key)}
                        style={toggleButtonStyle(viewMode === opt.key)}
                        aria-pressed={viewMode === opt.key}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>
            )}
        </Section>
    );
}