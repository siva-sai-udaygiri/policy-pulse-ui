import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";

type PolicyStatus = "ACTIVE" | "PENDING" | "EXPIRED" | string;

type Policy = {
  id: number;
  policyNumber: string;
  holderName: string;
  status: PolicyStatus;
  premium: number;
  documentKey?: string | null;
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
  const [editingPolicyId, setEditingPolicyId] = useState<number | null>(null);

  const [selectedFiles, setSelectedFiles] = useState<Record<number, File | null>>({});
  const [uploadingById, setUploadingById] = useState<Record<number, boolean>>({});
  const [fileInputKeys, setFileInputKeys] = useState<Record<number, number>>({});

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
        setError("Unable to load policies.");
        setPolicies([]);
        setTotalPages(0);
        return;
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
    void loadPolicies(status, page, size, controller.signal);

    return () => controller.abort();
  }, [status, page, size]);

  function resetForm() {
    setPolicyNumber("");
    setHolderName("");
    setNewStatus("ACTIVE");
    setPremium("");
    setEditingPolicyId(null);
  }

  function handleStatusChange(event: ChangeEvent<HTMLSelectElement>) {
    setStatus(event.target.value);
    setPage(0);
  }

  function handleEditClick(policy: Policy) {
    setEditingPolicyId(policy.id);
    setPolicyNumber(policy.policyNumber);
    setHolderName(policy.holderName);
    setNewStatus(policy.status);
    setPremium(String(policy.premium));
    setError("");
  }

  function handleCancelEdit() {
    resetForm();
    setError("");
  }

  function handleFileChange(policyId: number, file: File | null) {
    setSelectedFiles((prev) => ({
      ...prev,
      [policyId]: file,
    }));
  }

  async function handleUpload(policyId: number) {
    const file = selectedFiles[policyId];

    if (!file) {
      alert("Please choose a file first");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setError("");
      setUploadingById((prev) => ({
        ...prev,
        [policyId]: true,
      }));

      const response = await fetch(
        `http://localhost:8080/api/policies/${policyId}/document`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        setError("Unable to upload document.");
        return;
      }

      await response.json();

      alert("Document uploaded successfully");

      setSelectedFiles((prev) => ({
        ...prev,
        [policyId]: null,
      }));

      setFileInputKeys((prev) => ({
        ...prev,
        [policyId]: (prev[policyId] ?? 0) + 1,
      }));
    } catch {
      setError("Unable to upload document.");
    } finally {
      setUploadingById((prev) => ({
        ...prev,
        [policyId]: false,
      }));
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const payload = {
      policyNumber,
      holderName,
      status: newStatus,
      premium: Number(premium),
    };

    try {
      const url =
        editingPolicyId === null
          ? "http://localhost:8080/api/policies"
          : `http://localhost:8080/api/policies/${editingPolicyId}`;

      const method = editingPolicyId === null ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        setError(
          editingPolicyId === null
            ? "Unable to create policy."
            : "Unable to update policy."
        );
        return;
      }

      resetForm();
      setPage(0);
      await loadPolicies(status, 0, size);
    } catch {
      setError(
        editingPolicyId === null
          ? "Unable to create policy."
          : "Unable to update policy."
      );
    }
  }

  async function handleDeletePolicy(id: number) {
    setError("");

    try {
      const response = await fetch(`http://localhost:8080/api/policies/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        setError("Unable to delete policy.");
        return;
      }

      const nextPage = policies.length === 1 && page > 0 ? page - 1 : page;

      if (nextPage !== page) {
        setPage(nextPage);
      } else {
        await loadPolicies(status, page, size);
      }
    } catch {
      setError("Unable to delete policy.");
    }
  }

  return (
    <section>
      <h1>Policies</h1>
      <p>Policy list loaded from the Spring Boot backend.</p>

      <form onSubmit={handleSubmit} style={{ marginBottom: "20px" }}>
        <h2>{editingPolicyId === null ? "Create Policy" : "Edit Policy"}</h2>

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

          <button type="submit">
            {editingPolicyId === null ? "Create Policy" : "Update Policy"}
          </button>

          {editingPolicyId !== null && (
            <button type="button" onClick={handleCancelEdit}>
              Cancel
            </button>
          )}
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
                <th>Actions</th>
                <th>Document</th>
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
                    <td>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        <button type="button" onClick={() => handleEditClick(p)}>
                          Edit
                        </button>
                        <button type="button" onClick={() => handleDeletePolicy(p.id)}>
                          Delete
                        </button>
                      </div>
                    </td>
                    <td>
                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          flexWrap: "wrap",
                          alignItems: "center",
                        }}
                      >
                        <input
                          key={fileInputKeys[p.id] ?? 0}
                          type="file"
                          onChange={(e) =>
                            handleFileChange(p.id, e.target.files?.[0] ?? null)
                          }
                        />
                        <button
                          type="button"
                          onClick={() => handleUpload(p.id)}
                          disabled={uploadingById[p.id] === true}
                        >
                          {uploadingById[p.id] ? "Uploading..." : "Upload"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7}>No policies found</td>
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
            <button
              type="button"
              onClick={() => setPage((prev) => prev - 1)}
              disabled={page === 0}
            >
              Previous
            </button>

            <span>
              Page {page + 1} of {totalPages === 0 ? 1 : totalPages}
            </span>

            <button
              type="button"
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