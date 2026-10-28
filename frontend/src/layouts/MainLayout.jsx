import { Outlet } from "react-router-dom";

import Navbar from "../components/Navbar";

function MainLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <a
        href="#main-content"
        className="skip-link"
      >
        Skip to content
      </a>

      <Navbar />

      <main
        id="main-content"
        tabIndex={-1}
      >
        <Outlet />
      </main>
    </div>
  );
}

export default MainLayout;