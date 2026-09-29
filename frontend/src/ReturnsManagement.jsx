import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "http://127.0.0.1:5000/api";

function ReturnsManagement() {
  const [returns, setReturns] = useState([]);

  const [form, setForm] = useState({
    bill_id: "",
    product_id: "",
    quantity: "",
    reason: "",
  });

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadReturns = async () => {
    try {
      setLoading(true);

      const response = await axios.get(
        `${API_URL}/returns`
      );

      setReturns(response.data);
      setError("");
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Unable to load returns."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReturns();
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const submitReturn = async (e) => {
    e.preventDefault();

    try {
      setError("");
      setMessage("");

      const response = await axios.post(
        `${API_URL}/returns`,
        {
          bill_id: Number(form.bill_id),
          product_id: Number(form.product_id),
          quantity: Number(form.quantity),
          reason: form.reason,
        }
      );

      setMessage(
        response.data.message ||
          "Product returned successfully."
      );

      setForm({
        bill_id: "",
        product_id: "",
        quantity: "",
        reason: "",
      });

      loadReturns();
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Unable to process return."
      );
    }
  };

  if (loading) {
    return (
      <div className="page-loading">
        Loading returns...
      </div>
    );
  }

  return (
    <div className="page">

      <div className="page-heading">
        <div>
          <h1>Returns</h1>
          <p>Process and manage product returns</p>
        </div>
      </div>

      {message && (
        <div className="success-box">
          {message}
        </div>
      )}

      {error && (
        <div className="error-box">
          {error}
        </div>
      )}

      <div className="form-card">

        <div className="form-card-header">
          <h2>Process Return</h2>
        </div>

        <form onSubmit={submitReturn}>

          <div className="form-grid">

            <div className="form-group">
              <label>Bill ID</label>

              <input
                type="number"
                min="1"
                name="bill_id"
                value={form.bill_id}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Product ID</label>

              <input
                type="number"
                min="1"
                name="product_id"
                value={form.product_id}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Quantity</label>

              <input
                type="number"
                min="1"
                name="quantity"
                value={form.quantity}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Reason</label>

              <input
                name="reason"
                value={form.reason}
                onChange={handleChange}
                placeholder="Reason for return"
              />
            </div>

          </div>

          <div className="form-actions">

            <button
              type="submit"
              className="primary-button"
            >
              Process Return
            </button>

          </div>

        </form>

      </div>

      <div className="table-card">

        <div className="table-header">
          <h2>Return History</h2>
        </div>

        {returns.length === 0 ? (
          <div className="empty-state">
            No returns found.
          </div>
        ) : (
          <div className="responsive-table">

            <table>

              <thead>
                <tr>
                  <th>ID</th>
                  <th>Bill ID</th>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Reason</th>
                  <th>Date</th>
                </tr>
              </thead>

              <tbody>

                {returns.map((item) => (
                  <tr key={item.id}>

                    <td>#{item.id}</td>

                    <td>
                      #{item.bill_id}
                    </td>

                    <td>
                      {item.product_name ||
                        item.product_id}
                    </td>

                    <td>
                      {item.quantity}
                    </td>

                    <td>
                      {item.reason || "-"}
                    </td>

                    <td>
                      {item.created_at}
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

export default ReturnsManagement;