import { NavLink, Route, Routes } from "react-router-dom";
import "./App.css";
import DashboardPage from "./pages/DashboardPage";
import PoliciesPage from "./pages/PoliciesPage";
import NotFoundPage from "./pages/NotFoundPage";
import ApiDemoPage from "./pages/ApiDemoPage";


export default function App() {
  return (
    <div className="appShell">
      <header className="appHeader">
        <div className="brand">Policy Pulse</div>

        <nav className="nav">
          <NavLink
            to="/"
            end
            className={({ isActive }) => (isActive ? "navLink active" : "navLink")}
          >
            Dashboard
          </NavLink>

          <NavLink
            to="/policies"
            className={({ isActive }) => (isActive ? "navLink active" : "navLink")}
          >
            Policies
          </NavLink>
          <NavLink
            to="/api-demo"
            className={({ isActive }) => (isActive ? "navLink active" : "navLink")}
          >
            API Demo
          </NavLink>

        </nav>
      </header>

      <main className="appMain">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/policies" element={<PoliciesPage />} />
          <Route path="*" element={<NotFoundPage />} />
          <Route path="/api-demo" element={<ApiDemoPage />} />
        </Routes>
      </main>
    </div>
  );
}
