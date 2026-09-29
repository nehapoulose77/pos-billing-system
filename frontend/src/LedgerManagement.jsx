import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "http://127.0.0.1:5000/api";

function LedgerManagement() {
  const [data, setData] = useState({
    summary: [],
    overall: {
      total_transactions: 0,
      total_amount: 0,
    },
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadLedger = async () => {
    try {
      setLoading(true);

      const response = await axios.get(
        `${API_URL}/ledger`
      );

      setData(response.data);
      setError("");
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Unable to load ledger."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLedger();
  }, []);

  if (loading) {
    return (
      <div className="page-loading">
        Loading ledger...
      </div>
    );
  }

  return (
    <div className="page">

      <div className="page-heading">
        <div>
          <h1>Ledger</h1>
          <p>Payment-wise financial summary</p>
        </div>

        <button
          className="refresh-button"
          onClick={loadLedger}
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
          <div className="stat-icon">₹</div>

          <div>
            <span>Total Paid Amount</span>

            <strong>
              ₹
              {Number(
                data.overall?.total_amount || 0
              ).toFixed(2)}
            </strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🧾</div>

          <div>
            <span>Total Transactions</span>

            <strong>
              {data.overall?.total_transactions ||
                0}
            </strong>
          </div>
        </div>

      </div>

      <div className="table-card">

        <div className="table-header">
          <h2>Payment Summary</h2>
        </div>

        {data.summary.length === 0 ? (
          <div className="empty-state">
            No paid transactions found.
          </div>
        ) : (
          <div className="responsive-table">

            <table>

              <thead>
                <tr>
                  <th>Payment Method</th>
                  <th>Transactions</th>
                  <th>Total Amount</th>
                </tr>
              </thead>

              <tbody>

                {data.summary.map((item) => (
                  <tr
                    key={item.payment_method}
                  >
                    <td>
                      <strong>
                        {item.payment_method}
                      </strong>
                    </td>

                    <td>
                      {item.transaction_count}
                    </td>

                    <td>
                      ₹
                      {Number(
                        item.total_amount
                      ).toFixed(2)}
                    </td>
                  </tr>
                ))}

              </tbody>

            </table>

          </div>
        )}

      </div>

    </div>
  );
}

export default LedgerManagement;