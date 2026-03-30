import { useEffect, useState } from "react";

type PolicyStatus = "ACTIVE" | "PENDING" | "EXPIRED" | string;

type Policy = {
  id: number;
  policyNumber: string;
  holderName: string;
  status: PolicyStatus;
  premium: number;
};

type PolicyPageResponse = {
  content: Policy[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
};

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [policyNumber, setPolicyNumber] = useState("");
  const [holderName, setHolderName] = useState("");
  const [newStatus, setNewStatus] = useState("ACTIVE");
  const [premium, setPremium] = useState("");

  async function loadPolicies(
    selectedStatus: string,
    currentPage: number,
    currentSize: number,
    signal?: AbortSignal
  ) {
    setLoading(true);
    setError("");

    try {
      const url = selectedStatus
        ? `http://localhost:8080/api/policies/search?status=${encodeURIComponent(
          selectedStatus
        )}&page=${currentPage}&size=${currentSize}`
        : `http://localhost:8080/api/policies?page=${currentPage}&size=${currentSize}`;

      const response = await fetch(url, { signal });

      if (!response.ok) {
        throw new Error("Failed to fetch policies");
      }

      const data: PolicyPageResponse = await response.json();
      setPolicies(data.content ?? []);
      setTotalPages(data.totalPages ?? 0);
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setError("Unable to load policies.");
        setPolicies([]);
        setTotalPages(0);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    loadPolicies(status, page, size, controller.signal);

    return () => controller.abort();
  }, [status, page, size]);

  function handleStatusChange(event: React.ChangeEvent<HTMLSelectElement>) {
    setStatus(event.target.value);
    setPage(0);
  }

  async function handleCreatePolicy(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    try {
      const response = await fetch("http://localhost:8080/api/policies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          policyNumber,
          holderName,
          status: newStatus,
          premium: Number(premium),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create policy");
      }

      setPolicyNumber("");
      setHolderName("");
      setNewStatus("ACTIVE");
      setPremium("");

      setPage(0);
      await loadPolicies(status, 0, size);
    } catch (err) {
      setError("Unable to create policy.");
    }
  }

  return (
    <section>
      <h1>Policies</h1>
      <p>Policy list loaded from the Spring Boot backend.</p>

      <form onSubmit={handleCreatePolicy} style={{ marginBottom: "20px" }}>
        <h2>Create Policy</h2>

        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
            marginBottom: "10px",
          }}
        >
          <input
            type="text"
            placeholder="Policy Number"
            value={policyNumber}
            onChange={(e) => setPolicyNumber(e.target.value)}
            required
          />

          <input
            type="text"
            placeholder="Holder Name"
            value={holderName}
            onChange={(e) => setHolderName(e.target.value)}
            required
          />

          <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
            <option value="ACTIVE">ACTIVE</option>
            <option value="PENDING">PENDING</option>
            <option value="EXPIRED">EXPIRED</option>
          </select>

          <input
            type="number"
            placeholder="Premium"
            value={premium}
            onChange={(e) => setPremium(e.target.value)}
            required
          />

          <button type="submit">Create Policy</button>
        </div>
      </form>

      <div
        style={{
          marginBottom: "16px",
          display: "flex",
          gap: "12px",
          alignItems: "center",
        }}
      >
        <label htmlFor="statusFilter">Filter by status:</label>

        <select id="statusFilter" value={status} onChange={handleStatusChange}>
          <option value="">All</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="PENDING">PENDING</option>
          <option value="EXPIRED">EXPIRED</option>
        </select>
      </div>

      {loading && <p>Loading policies...</p>}
      {error && <p>{error}</p>}

      {!loading && !error && (
        <>
          <div className="tableWrap">
            <table className="table">
              <thead>
              <tr>
                <th>ID</th>
                <th>Policy Number</th>
                <th>Holder Name</th>
                <th>Status</th>
                <th>Premium</th>
              </tr>
              </thead>
              <tbody>
              {policies.length > 0 ? (
                policies.map((p) => (
                  <tr key={p.id}>
                    <td>{p.id}</td>
                    <td className="mono">{p.policyNumber}</td>
                    <td>{p.holderName}</td>
                    <td>
                        <span className={`pill pill-${String(p.status).toLowerCase()}`}>
                          {p.status}
                        </span>
                    </td>
                    <td>${p.premium}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5}>No policies found</td>
                </tr>
              )}
              </tbody>
            </table>
          </div>

          <div
            style={{
              marginTop: "16px",
              display: "flex",
              gap: "10px",
              alignItems: "center",
            }}
          >
            <button onClick={() => setPage((prev) => prev - 1)} disabled={page === 0}>
              Previous
            </button>

            <span>
              Page {page + 1} of {totalPages === 0 ? 1 : totalPages}
            </span>

            <button
              onClick={() => setPage((prev) => prev + 1)}
              disabled={totalPages === 0 || page >= totalPages - 1}
            >
              Next
            </button>
          </div>
        </>
      )}
    </section>
  );
}