const DashboardHeader = ({ lastUpdate }) => {
    return (
        <div
            style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "25px"
            }}
        >
            <div>
                <h1 className="font-bold text-2xl">
                    Dashboard
                </h1>

                <p
                    style={{
                        color: "#6b7280",
                        marginTop: "5px"
                    }}
                >
                    Overview of SafeConnect activity
                </p>
            </div>

            <div
                style={{
                    fontSize: ".9rem",
                    color: "#6b7280"
                }}
            >
                Last Updated:
                <br />
                {lastUpdate
                    ? lastUpdate.toLocaleTimeString()
                    : "Loading..."}
            </div>
        </div>
    );
};

export default DashboardHeader;