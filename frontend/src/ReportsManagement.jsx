import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "https://pos-billing-system-backend-vuxs.onrender.com/api";

function ReportsManagement() {
  const [data, setData] = useState({
    today: {},
    monthly: {},
    payment_summary: [],
    daily_sales: [],
    monthly_sales: [],
    overall: {},
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReports = async () => {
    try {
      setLoading(true);

      const response = await axios.get(
        `${API_URL}/reports`
      );

      setData(response.data);
      setError("");
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Unable to load reports."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  if (loading) {
    return (
      <div className="page-loading">
        Loading reports...
      </div>
    );
  }

  return (
    <div className="page">

      <div className="page-heading">

        <div>
          <h1>Reports</h1>
          <p>Sales and revenue reports</p>
        </div>

        <button
          className="refresh-button"
          onClick={loadReports}
        >
          ↻ Refresh
        </button>

      </div>

      {error && (
        <div className="error-box">
          {error}
        </div>
      )}

      <div className="stats-grid">

        <div className="stat-card">
          <div className="stat-icon">
            📅
          </div>

          <div>
            <span>Today's Sales</span>

            <strong>
              ₹
              {Number(
                data.today?.total_sales || 0
              ).toFixed(2)}
            </strong>

            <small>
              {data.today?.transaction_count ||
                0} transactions
            </small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            📆
          </div>

          <div>
            <span>Monthly Sales</span>

            <strong>
              ₹
              {Number(
                data.monthly?.total_sales || 0
              ).toFixed(2)}
            </strong>

            <small>
              {data.monthly?.transaction_count ||
                0} transactions
            </small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            💰
          </div>

          <div>
            <span>Total Revenue</span>

            <strong>
              ₹
              {Number(
                data.overall?.total_revenue || 0
              ).toFixed(2)}
            </strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            🧾
          </div>

          <div>
            <span>Total Transactions</span>

            <strong>
              {data.overall?.total_transactions ||
                0}
            </strong>
          </div>
        </div>

      </div>

      <div className="report-grid">

        <div className="table-card">

          <div className="table-header">
            <h2>Payment Summary</h2>
          </div>

          {data.payment_summary.length === 0 ? (
            <div className="empty-state">
              No payment data.
            </div>
          ) : (
            <div className="responsive-table">

              <table>

                <thead>
                  <tr>
                    <th>Method</th>
                    <th>Transactions</th>
                    <th>Amount</th>
                  </tr>
                </thead>

                <tbody>

                  {data.payment_summary.map(
                    (item) => (
                      <tr
                        key={
                          item.payment_method
                        }
                      >

                        <td>
                          {
                            item.payment_method
                          }
                        </td>

                        <td>
                          {
                            item.transaction_count
                          }
                        </td>

                        <td>
                          ₹
                          {Number(
                            item.total_amount
                          ).toFixed(2)}
                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>

            </div>
          )}

        </div>

        <div className="table-card">

          <div className="table-header">
            <h2>Monthly Sales</h2>
          </div>

          {data.monthly_sales.length === 0 ? (
            <div className="empty-state">
              No monthly sales.
            </div>
          ) : (
            <div className="responsive-table">

              <table>

                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Transactions</th>
                    <th>Sales</th>
                  </tr>
                </thead>

                <tbody>

                  {data.monthly_sales.map(
                    (item) => (
                      <tr
                        key={item.sale_month}
                      >

                        <td>
                          {item.sale_month}
                        </td>

                        <td>
                          {
                            item.transaction_count
                          }
                        </td>

                        <td>
                          ₹
                          {Number(
                            item.total_sales
                          ).toFixed(2)}
                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>

            </div>
          )}

        </div>

      </div>

      <div className="table-card">

        <div className="table-header">
          <h2>Daily Sales</h2>
        </div>

        {data.daily_sales.length === 0 ? (
          <div className="empty-state">
            No daily sales.
          </div>
        ) : (
          <div className="responsive-table">

            <table>

              <thead>
                <tr>
                  <th>Date</th>
                  <th>Transactions</th>
                  <th>Total Sales</th>
                </tr>
              </thead>

              <tbody>

                {data.daily_sales.map(
                  (item) => (
                    <tr
                      key={item.sale_date}
                    >

                      <td>
                        {item.sale_date}
                      </td>

                      <td>
                        {item.transaction_count}
                      </td>

                      <td>
                        ₹
                        {Number(
                          item.total_sales
                        ).toFixed(2)}
                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>
        )}

      </div>

    </div>
  );
}

export default ReportsManagement;