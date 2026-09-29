import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "http://127.0.0.1:5000/api";

const emptyForm = {
  name: "",
  phone: "",
  email: "",
  address: "",
};

function SupplierManagement() {
  const [suppliers, setSuppliers] = useState([]);
  const [form, setForm] = useState(emptyForm);

  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadSuppliers = async () => {
    try {
      setLoading(true);

      const response = await axios.get(
        `${API_URL}/suppliers`
      );

      setSuppliers(response.data);
      setError("");
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Unable to load suppliers."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setError("");
      setMessage("");

      if (editingId) {
        await axios.put(
          `${API_URL}/suppliers/${editingId}`,
          form
        );

        setMessage(
          "Supplier updated successfully."
        );
      } else {
        await axios.post(
          `${API_URL}/suppliers`,
          form
        );

        setMessage(
          "Supplier added successfully."
        );
      }

      resetForm();
      loadSuppliers();
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Unable to save supplier."
      );
    }
  };

  const editSupplier = (supplier) => {
    setForm({
      name: supplier.name || "",
      phone: supplier.phone || "",
      email: supplier.email || "",
      address: supplier.address || "",
    });

    setEditingId(supplier.id);
    setShowForm(true);
  };

  const deleteSupplier = async (id) => {
    if (
      !window.confirm(
        "Delete this supplier?"
      )
    ) {
      return;
    }

    try {
      await axios.delete(
        `${API_URL}/suppliers/${id}`
      );

      setMessage(
        "Supplier deleted successfully."
      );

      loadSuppliers();
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Unable to delete supplier."
      );
    }
  };

  if (loading) {
    return (
      <div className="page-loading">
        Loading suppliers...
      </div>
    );
  }

  return (
    <div className="page">

      <div className="page-heading">
        <div>
          <h1>Suppliers</h1>
          <p>Manage product suppliers</p>
        </div>

        <button
          className="primary-button"
          onClick={() => {
            setForm(emptyForm);
            setEditingId(null);
            setShowForm(true);
          }}
        >
          + Add Supplier
        </button>
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

      {showForm && (
        <div className="form-card">

          <div className="form-card-header">
            <h2>
              {editingId
                ? "Edit Supplier"
                : "Add Supplier"}
            </h2>

            <button
              className="close-button"
              onClick={resetForm}
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit}>

            <div className="form-grid">

              <div className="form-group">
                <label>Name</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Phone</label>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Address</label>
                <input
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                />
              </div>

            </div>

            <div className="form-actions">

              <button
                type="button"
                className="secondary-button"
                onClick={resetForm}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="primary-button"
              >
                {editingId
                  ? "Update Supplier"
                  : "Save Supplier"}
              </button>

            </div>

          </form>
        </div>
      )}

      <div className="table-card">

        <div className="table-header">
          <h2>Supplier List</h2>
          <span>
            {suppliers.length} suppliers
          </span>
        </div>

        {suppliers.length === 0 ? (
          <div className="empty-state">
            No suppliers found.
          </div>
        ) : (
          <div className="responsive-table">

            <table>

              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Address</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>

                {suppliers.map((supplier) => (
                  <tr key={supplier.id}>

                    <td>#{supplier.id}</td>

                    <td>
                      <strong>
                        {supplier.name}
                      </strong>
                    </td>

                    <td>
                      {supplier.phone || "-"}
                    </td>

                    <td>
                      {supplier.email || "-"}
                    </td>

                    <td>
                      {supplier.address || "-"}
                    </td>

                    <td>
                      <div className="action-buttons">

                        <button
                          className="edit-button"
                          onClick={() =>
                            editSupplier(supplier)
                          }
                        >
                          Edit
                        </button>

                        <button
                          className="delete-button"
                          onClick={() =>
                            deleteSupplier(
                              supplier.id
                            )
                          }
                        >
                          Delete
                        </button>

                      </div>
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

export default SupplierManagement;