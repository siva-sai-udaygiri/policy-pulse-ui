import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <section>
      <h1>404</h1>
      <p>That page does not exist.</p>
      <Link to="/">Go back to Dashboard</Link>
    </section>
  );
}
