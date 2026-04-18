import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

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

  const [uploadingPolicyId, setUploadingPolicyId] = useState<number | null>(null);
  const [downloadingPolicyId, setDownloadingPolicyId] = useState<number | null>(null);

  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

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

  function openFilePicker(policyId: number) {
    fileInputRefs.current[policyId]?.click();
  }

  async function handleFileSelected(
    policyId: number,
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setError("");
    setUploadingPolicyId(policyId);

    try {
      const formData = new FormData();
      formData.append("file", file);

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

      await loadPolicies(status, page, size);
    } catch {
      setError("Unable to upload document.");
    } finally {
      setUploadingPolicyId(null);

      if (fileInputRefs.current[policyId]) {
        fileInputRefs.current[policyId]!.value = "";
      }
    }
  }

  async function handleDownloadDocument(policy: Policy) {
    if (!policy.documentKey) {
      setError("No document available for this policy.");
      return;
    }

    setError("");
    setDownloadingPolicyId(policy.id);

    try {
      const response = await fetch(
        `http://localhost:8080/api/policies/${policy.id}/document`,
        {
          method: "GET",
        }
      );

      if (!response.ok) {
        setError("Unable to download document.");
        return;
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get("content-disposition");

      let fileName = policy.documentKey;

      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?(.*?)"?$/);
        if (match?.[1]) {
          fileName = match[1];
        }
      }

      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch {
      setError("Unable to download document.");
    } finally {
      setDownloadingPolicyId(null);
    }
  }

  function renderDocumentLabel(policy: Policy) {
    if (!policy.documentKey) {
      return "No document";
    }

    return policy.documentKey;
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
                <th>Document</th>
                <th>Actions</th>
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
                    <td style={{ maxWidth: "220px", wordBreak: "break-word" }}>
                      {renderDocumentLabel(p)}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        <button type="button" onClick={() => handleEditClick(p)}>
                          Edit
                        </button>

                        <button type="button" onClick={() => handleDeletePolicy(p.id)}>
                          Delete
                        </button>

                        <button
                          type="button"
                          onClick={() => openFilePicker(p.id)}
                          disabled={uploadingPolicyId === p.id}
                        >
                          {uploadingPolicyId === p.id ? "Uploading..." : "Choose & Upload"}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDownloadDocument(p)}
                          disabled={!p.documentKey || downloadingPolicyId === p.id}
                        >
                          {downloadingPolicyId === p.id ? "Downloading..." : "Download"}
                        </button>

                        <input
                          type="file"
                          ref={(element) => {
                            fileInputRefs.current[p.id] = element;
                          }}
                          style={{ display: "none" }}
                          onChange={(event) => void handleFileSelected(p.id, event)}
                        />
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