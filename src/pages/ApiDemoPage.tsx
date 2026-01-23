import { useState } from "react";

import { http } from "../api/http";
import { ApiError } from "../api/problemDetails";

type HealthResponse = {
  status: "UP" | "DOWN";
  version: string;
};

export default function ApiDemoPage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorJson, setErrorJson] = useState<string | null>(null);

  async function callHealth() {
    setLoading(true);
    setData(null);
    setError(null);
    setErrorJson(null);

    try {
      // Intentionally points to a non-existing endpoint for now.
      // Later, when you add a backend, you can make it real.
      const res = await http<HealthResponse>("/api/health", { timeoutMs: 3000 });
      setData(res);
    } catch (e) {
      if (e instanceof ApiError) {
        setError(`${e.status}: ${e.message}`);
        if (e.problem) {
          setErrorJson(JSON.stringify(e.problem, null, 2));
        }
        return;
      }
      setError("Unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <h1>API Demo</h1>
      <p>
        Demonstrates typed HTTP client + Spring Boot-friendly error parsing. Right now it
        calls <span className="mono">/api/health</span> (not implemented yet), so you should
        see a handled error.
      </p>

      <button onClick={callHealth} disabled={loading} className="btn">
        {loading ? "Calling..." : "Call /api/health"}
      </button>

      {data && (
        <div className="card" style={{ marginTop: 14 }}>
          <div className="cardTitle">Response</div>
          <pre className="pre">{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}

      {error && (
        <div className="card" style={{ marginTop: 14 }}>
          <div className="cardTitle">Handled Error</div>
          <div style={{ marginTop: 8 }}>{error}</div>
          {errorJson && (
            <pre className="pre" style={{ marginTop: 10 }}>
              {errorJson}
            </pre>
          )}
        </div>
      )}
    </section>
  );
}
