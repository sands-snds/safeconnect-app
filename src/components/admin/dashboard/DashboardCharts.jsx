import PieChartCard from "./PieChartCard";
import GenerateReportButton from "../shared/GenerateReportButton";
import { STATUS_COLORS, buildPieData } from "../shared/chartUtils";
import { tx } from "../../../i18n/adminText";

export default function DashboardCharts({
    emergencyReports = [],
    assistanceRequests = [],
    pettyCrimeReports = []
}) {
    return (
        <div style={{ marginTop: "24px" }}>
        {/* Exports the counts behind these pie charts: each category by status. */}
        <div
            style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "12px",
                marginBottom: "12px"
            }}
        >
            <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "#111827", margin: 0 }}>
                {tx("Reports by Status")}
            </h3>
            <GenerateReportButton type="analytics" inline withOptions optionsTitle="SafeConnect-SantaFe Analytical Report" />
        </div>

        <div
            style={{
                display: "grid",
                gridTemplateColumns:
                    window.innerWidth < 768
                        ? "1fr"
                        : "repeat(2, 1fr)",
                gap: "20px",
                alignItems: "stretch"
            }}
        >

            <PieChartCard
                title={tx("Petty Crimes by Status")}
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
                title={tx("Emergency Reports by Status")}
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

            

        </div>
        <div
            className="dash-pie-wide"
            style={{
                gridColumn: "1 / -1",
                width: "50%",
                justifySelf: "center"
            }}>

            <PieChartCard
                title={tx("Assistance Requests by Status")}
                data={buildPieData(
                    assistanceRequests,
                    "status"
                )}
                colorMap={STATUS_COLORS}
            />
            
            
            </div>
        </div>
    );
}