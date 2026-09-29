import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "http://127.0.0.1:5000/api";

function Dashboard() {
  const [data, setData] = useState({
    total_sales: 0,
    total_bills: 0,
    total_products: 0,
    low_stock: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const response = await axios.get(
        `${API_URL}/dashboard`
      );

      setData(response.data);
      setError("");
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Unable to load dashboard."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="page">
        <div className="page-loading">
          Loading dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="page">

      {/* PAGE HEADER */}
      <div className="page-heading">
        <div>
          <h1>Dashboard</h1>
          <p>Overview of your POS system</p>
        </div>

        <button
          className="refresh-button"
          onClick={loadDashboard}
        >
          ↻ Refresh
        </button>
      </div>

      {/* ERROR */}
      {error && (
        <div className="error-box">
          {error}
        </div>
      )}

      {/* STATISTICS */}
      <div className="stats-grid">

        <div className="stat-card">
          <div className="stat-icon">₹</div>

          <div>
            <span>Total Sales</span>

            <strong>
              ₹{Number(data.total_sales).toFixed(2)}
            </strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🧾</div>

          <div>
            <span>Total Bills</span>

            <strong>
              {data.total_bills}
            </strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📦</div>

          <div>
            <span>Products</span>

            <strong>
              {data.total_products}
            </strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⚠️</div>

          <div>
            <span>Low Stock</span>

            <strong>
              {data.low_stock}
            </strong>
          </div>
        </div>

      </div>

      {/* INFORMATION SECTION */}
      <div className="dashboard-info">

        <div className="info-card">
          <h3>Quick Actions</h3>

          <p>
            Use the menu to manage products,
            suppliers, staff, billing and reports.
          </p>
        </div>

        <div className="info-card">
          <h3>System Status</h3>

          <p className="status-success">
            ✓ POS system is ready
          </p>

          <p>
            You can manage your store operations
            from the navigation menu.
          </p>
        </div>

      </div>

    </div>
  );
}

export default Dashboard;