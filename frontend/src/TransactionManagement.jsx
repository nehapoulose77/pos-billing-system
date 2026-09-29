import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "https://pos-billing-system-backend-vuxs.onrender.com/api";

function TransactionManagement() {
  const [transactions, setTransactions] =
    useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadTransactions = async () => {
    try {
      setLoading(true);

      const response = await axios.get(
        `${API_URL}/transactions`
      );

      setTransactions(response.data);
      setError("");
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Unable to load transactions."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  if (loading) {
    return (
      <div className="page-loading">
        Loading transactions...
      </div>
    );
  }

  return (
    <div className="page">

      <div className="page-heading">
        <div>
          <h1>Transactions</h1>
          <p>Manage all billing transactions</p>
        </div>

        <button
          className="refresh-button"
          onClick={loadTransactions}
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

        {transactions.length === 0 ? (
          <div className="empty-state">
            No transactions found.
          </div>
        ) : (
          <div className="responsive-table">

            <table>

              <thead>
                <tr>
                  <th>ID</th>
                  <th>Date</th>
                  <th>Subtotal</th>
                  <th>Tax</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>

                {transactions.map(
                  (transaction) => (
                    <tr key={transaction.id}>

                      <td>
                        #{transaction.id}
                      </td>

                      <td>
                        {transaction.bill_date}
                      </td>

                      <td>
                        ₹
                        {Number(
                          transaction.subtotal
                        ).toFixed(2)}
                      </td>

                      <td>
                        ₹
                        {Number(
                          transaction.tax
                        ).toFixed(2)}
                      </td>

                      <td>
                        <strong>
                          ₹
                          {Number(
                            transaction.total
                          ).toFixed(2)}
                        </strong>
                      </td>

                      <td>
                        {transaction.payment_method}
                      </td>

                      <td>
                        <span
                          className={
                            transaction.payment_status ===
                            "Paid"
                              ? "status-paid"
                              : "status-pending"
                          }
                        >
                          {
                            transaction.payment_status
                          }
                        </span>
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

export default TransactionManagement;