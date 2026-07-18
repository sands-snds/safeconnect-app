import PieChartCard from "./PieChartCard";
import { STATUS_COLORS,SEVERITY_COLORS} from "./chartConstants";
import { buildPieData } from "./chartUtils";
export default function DashboardCharts({
    emergencyReports,
    assistanceRequests

}) {
    return (
        <div
            style={{
                display: "grid",
                gridTemplateColumns:
                    "repeat(auto-fit,minmax(300px,1fr))",
                gap: "20px",
                marginTop: "24px"
            }}
        >

            <PieChartCard
                title="Incidents by Status"
                data={buildPieData(
                    emergencyReports,
                    "status"
                )}
                colorMap={STATUS_COLORS}
            />

            <PieChartCard
                title="Incidents by Severity"
                data={buildPieData(
                    emergencyReports,
                    "severity"
                )}
                colorMap={SEVERITY_COLORS}
            />

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