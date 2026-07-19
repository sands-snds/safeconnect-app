import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    ResponsiveContainer
} from "recharts";

import Section from "../shared/Section";

import { FALLBACK_COLORS } from "../shared/chartUtils";

export default function PieChartCard({
    title,
    data,
    colorMap
}) {
    return (
        <Section title={title}>
            {data.length === 0 ? (

                <div
                    style={{
                        textAlign: "center",
                        padding: "48px",
                        color: "#6b7280"
                    }}
                >
                    No data available yet
                </div>
            ) : (
                <ResponsiveContainer
                    width="100%"
                    height={280}
                >
                    <PieChart>

                        <Pie
                            data={data}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={90}
                            label
                        >
                            {data.map((entry, index) => (
                                <Cell
                                    key={entry.name}
                                    fill={
                                        colorMap[
                                            entry.name
                                        ] ||
                                        FALLBACK_COLORS[
                                            index %
                                            FALLBACK_COLORS.length
                                        ]
                                    }
                                />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            )}
        </Section>
    );
}