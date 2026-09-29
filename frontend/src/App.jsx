import { useState } from "react";
import axios from "axios";

import Login from "./Login";
import Dashboard from "./Dashboard";
import ProductManagement from "./ProductManagement";
import SupplierManagement from "./SupplierManagement";
import StaffManagement from "./StaffManagement";
import ReturnsManagement from "./ReturnsManagement";
import TransactionManagement from "./TransactionManagement";
import LedgerManagement from "./LedgerManagement";
import ReportsManagement from "./ReportsManagement";
import Billing from "./Billing";
import SalesHistory from "./SalesHistory";

function App() {
  const [user, setUser] = useState(null);
  const [activePage, setActivePage] = useState("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);

  const isAdmin = user?.role === "admin";
  const isStaff = user?.role === "staff";

  const handleLogin = (loggedInUser) => {
    setUser(loggedInUser);

    axios.defaults.headers.common["X-User-ID"] = String(loggedInUser.id);

    if (loggedInUser.role === "admin") {
      setActivePage("dashboard");
    } else {
      setActivePage("billing");
    }
  };

  const handleLogout = () => {
    delete axios.defaults.headers.common["X-User-ID"];
    setUser(null);
    setActivePage("dashboard");
    setMenuOpen(false);
  };

  const openPage = (page) => {
    setActivePage(page);
    setMenuOpen(false);
  };

  const getPageTitle = () => {
    const titles = {
      dashboard: "Dashboard",
      products: "Product Management",
      suppliers: "Supplier Management",
      staff: "Staff Management",
      returns: "Returns Management",
      transactions: "Transactions",
      ledger: "Ledger",
      reports: "Reports",
      billing: "Billing",
      sales: "Sales History",
    };

    return titles[activePage] || "POS Billing";
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="admin-layout">
      {/* SIDEBAR */}
      <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
        <div className="sidebar-logo">
          POS <span>Billing</span>
        </div>

        <div className="sidebar-section">
          {isAdmin ? "ADMIN PORTAL" : "STAFF PORTAL"}
        </div>

        <div className="sidebar-menu">
          {isAdmin && (
            <>
              <button
                className={activePage === "dashboard" ? "active" : ""}
                onClick={() => openPage("dashboard")}
              >
                <span className="icon">📊</span>
                Dashboard
              </button>

              <button
                className={activePage === "products" ? "active" : ""}
                onClick={() => openPage("products")}
              >
                <span className="icon">📦</span>
                Products
              </button>

              <button
                className={activePage === "suppliers" ? "active" : ""}
                onClick={() => openPage("suppliers")}
              >
                <span className="icon">🚚</span>
                Suppliers
              </button>

              <button
                className={activePage === "staff" ? "active" : ""}
                onClick={() => openPage("staff")}
              >
                <span className="icon">👥</span>
                Staff
              </button>

              <button
                className={activePage === "returns" ? "active" : ""}
                onClick={() => openPage("returns")}
              >
                <span className="icon">↩️</span>
                Returns
              </button>

              <button
                className={activePage === "transactions" ? "active" : ""}
                onClick={() => openPage("transactions")}
              >
                <span className="icon">💳</span>
                Transactions
              </button>

              <button
                className={activePage === "ledger" ? "active" : ""}
                onClick={() => openPage("ledger")}
              >
                <span className="icon">📒</span>
                Ledger
              </button>

              <button
                className={activePage === "reports" ? "active" : ""}
                onClick={() => openPage("reports")}
              >
                <span className="icon">📈</span>
                Reports
              </button>
            </>
          )}

          <div className="sidebar-section">SALES</div>

          <button
            className={activePage === "billing" ? "active" : ""}
            onClick={() => openPage("billing")}
          >
            <span className="icon">🧾</span>
            Billing
          </button>

          <button
            className={activePage === "sales" ? "active" : ""}
            onClick={() => openPage("sales")}
          >
            <span className="icon">📋</span>
            Sales History
          </button>

          <button onClick={handleLogout} style={{ marginTop: "20px" }}>
            <span className="icon">🚪</span>
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="main-area">
        {/* TOPBAR */}
        <header className="topbar">
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              className="mobile-menu-btn"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              ☰
            </button>
            <h1 className="topbar-title">{getPageTitle()}</h1>
          </div>

          <div className="user-area">
            <div className="user-avatar">
              {user.name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="user-info">
              <strong>{user.name}</strong>
              <span>{user.role}</span>
            </div>
          </div>
        </header>

        {/* ACTIVE PAGE COMPONENT */}
        <div className="page-content">
          {isAdmin && activePage === "dashboard" && <Dashboard />}
          {isAdmin && activePage === "products" && <ProductManagement />}
          {isAdmin && activePage === "suppliers" && <SupplierManagement />}
          {isAdmin && activePage === "staff" && <StaffManagement />}
          {isAdmin && activePage === "returns" && <ReturnsManagement />}
          {isAdmin && activePage === "transactions" && <TransactionManagement />}
          {isAdmin && activePage === "ledger" && <LedgerManagement />}
          {isAdmin && activePage === "reports" && <ReportsManagement />}
          {(isAdmin || isStaff) && activePage === "billing" && <Billing />}
          {(isAdmin || isStaff) && activePage === "sales" && <SalesHistory />}
        </div>
      </div>
    </div>
  );
}

export default App;