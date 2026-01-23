type PolicyStatus = "ACTIVE" | "PENDING" | "CANCELLED";

type Policy = {
  policyId: string;
  memberName: string;
  status: PolicyStatus;
  monthlyPremiumUsd: number;
  lastUpdated: string; // ISO date string
};

const MOCK_POLICIES: Policy[] = [
  {
    policyId: "POL-10021",
    memberName: "A. Kumar",
    status: "ACTIVE",
    monthlyPremiumUsd: 220,
    lastUpdated: "2026-01-18",
  },
  {
    policyId: "POL-10022",
    memberName: "S. Reddy",
    status: "PENDING",
    monthlyPremiumUsd: 180,
    lastUpdated: "2026-01-20",
  },
  {
    policyId: "POL-10023",
    memberName: "M. Patel",
    status: "CANCELLED",
    monthlyPremiumUsd: 140,
    lastUpdated: "2026-01-12",
  },
];

export default function PoliciesPage() {
  return (
    <section>
      <h1>Policies</h1>
      <p>Sample table (mock data) to establish UI structure and TypeScript typing.</p>

      <div className="tableWrap">
        <table className="table">
          <thead>
            <tr>
              <th>Policy ID</th>
              <th>Member</th>
              <th>Status</th>
              <th>Monthly Premium (USD)</th>
              <th>Last Updated</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_POLICIES.map((p) => (
              <tr key={p.policyId}>
                <td className="mono">{p.policyId}</td>
                <td>{p.memberName}</td>
                <td>
                  <span className={`pill pill-${p.status.toLowerCase()}`}>{p.status}</span>
                </td>
                <td>${p.monthlyPremiumUsd.toFixed(2)}</td>
                <td>{p.lastUpdated}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
