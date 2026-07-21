import PieChartCard from "./PieChartCard";
import { STATUS_COLORS, SEVERITY_COLORS, buildPieData } from "../shared/chartUtils";

export default function DashboardCharts({
    emergencyReports = [],
    assistanceRequests = [],
    pettyCrimeReports = []
}) {
    return (
        <div
            style={{
                display: "grid",
                gridTemplateColumns:
                    window.innerWidth < 768
                        ? "1fr"
                        : "repeat(2, 1fr)",
                gap: "20px",
                marginTop: "24px",
                alignItems: "stretch"
            }}
        >

            <PieChartCard
                title="Petty Crimes by Status"
                data={(() => {
                    const chartData = buildPieData(
                        pettyCrimeReports,
                        "status"
                    );
                    return chartData;
                })()}
                colorMap={STATUS_COLORS}
            />


            <PieChartCard
                title="Emergency Reports by Status"
                data={buildPieData(
                    emergencyReports,
                    "status"
                )}
                colorMap={STATUS_COLORS}
            />

{/*
            <PieChartCard
                title="Reports by Severity"
                data={buildPieData(
                    emergencyReports,
                    "severity"
                )}
                colorMap={SEVERITY_COLORS}
            />
*/}

            <PieChartCard
                title="Assistance Requests by Status"
                data={buildPieData(
                    assistanceRequests,
                    "status"
                )}
                colorMap={STATUS_COLORS}
            />

        </div>
    );
}