export default function DashboardPage() {
  return (
    <section>
      <h1>Dashboard</h1>
      <p>High-level view of policy activity and operational metrics.</p>

      <div className="grid">
        <div className="card">
          <div className="cardTitle">Active Policies</div>
          <div className="cardValue">1,284</div>
          <div className="cardMeta">+2.1% this week</div>
        </div>

        <div className="card">
          <div className="cardTitle">Pending Reviews</div>
          <div className="cardValue">37</div>
          <div className="cardMeta">SLA: 24 hours</div>
        </div>

        <div className="card">
          <div className="cardTitle">Failed Premium Payments</div>
          <div className="cardValue">12</div>
          <div className="cardMeta">Last 7 days</div>
        </div>
      </div>
    </section>
  );
}
