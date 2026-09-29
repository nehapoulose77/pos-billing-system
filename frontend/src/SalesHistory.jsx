import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "https://pos-billing-system-backend-vuxs.onrender.com/api";

function SalesHistory() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadBills = async () => {
    try {
      setLoading(true);

      const response = await axios.get(
        `${API_URL}/bills`
      );

      setBills(response.data);
      setError("");
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Unable to load sales history."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBills();
  }, []);

  if (loading) {
    return (
      <div className="page-loading">
        Loading sales history...
      </div>
    );
  }

  return (
    <div className="page">

      <div className="page-heading">
        <div>
          <h1>Sales History</h1>
          <p>View all generated bills</p>
        </div>

        <button
          className="refresh-button"
          onClick={loadBills}
        >
          ↻ Refresh
        </button>
      </div>

      {error && (
        <div className="error-box">
          {error}
        </div>
      )}

      <div className="table-card">

        {bills.length === 0 ? (
          <div className="empty-state">
            No sales found.
          </div>
        ) : (
          <div className="responsive-table">

            <table>

              <thead>
                <tr>
                  <th>Bill ID</th>
                  <th>Date</th>
                  <th>Subtotal</th>
                  <th>Tax</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>

                {bills.map((bill) => (
                  <tr key={bill.id}>

                    <td>
                      <strong>
                        #{bill.id}
                      </strong>
                    </td>

                    <td>
                      {bill.bill_date}
                    </td>

                    <td>
                      ₹
                      {Number(
                        bill.subtotal
                      ).toFixed(2)}
                    </td>

                    <td>
                      ₹
                      {Number(
                        bill.tax
                      ).toFixed(2)}
                    </td>

                    <td>
                      <strong>
                        ₹
                        {Number(
                          bill.total
                        ).toFixed(2)}
                      </strong>
                    </td>

                    <td>
                      {bill.payment_method}
                    </td>

                    <td>
                      <span
                        className={
                          bill.payment_status ===
                          "Paid"
                            ? "status-paid"
                            : "status-pending"
                        }
                      >
                        {bill.payment_status}
                      </span>
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

export default SalesHistory;