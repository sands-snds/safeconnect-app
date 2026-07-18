export default function DashboardSummary({

    emergencyReports = [],
    assistanceRequests = [],
    pettyCrimeReports = []

}) {

    const totalReports =
        emergencyReports.length +
        assistanceRequests.length +
        pettyCrimeReports.length;

    return (

        <div className="dashboard-card">

            <h2>Welcome Back, Administrator</h2>

            <p>

                There are currently

                <strong> {totalReports} </strong>

                total reports stored in the system.

            </p>

            <p>

                Use the charts below to monitor incoming incidents
                and manage community requests.

            </p>

        </div>

    );

}