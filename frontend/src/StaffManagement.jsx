import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "https://pos-billing-system-backend-vuxs.onrender.com/api";

function StaffManagement() {
  const [staff, setStaff] = useState([]);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // =========================
  // LOAD STAFF
  // =========================

  const loadStaff = async () => {
    try {
      setLoading(true);

      const response = await axios.get(`${API_URL}/staff`);

      setStaff(response.data);
      setError("");
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Unable to load staff."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  // =========================
  // FORM CHANGE
  // =========================

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // =========================
  // RESET FORM
  // =========================

  const resetForm = () => {
    setForm({
      name: "",
      email: "",
      password: "",
    });

    setEditingId(null);
    setShowForm(false);
  };

  // =========================
  // ADD / UPDATE STAFF
  // =========================

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setError("");
      setMessage("");

      if (editingId) {
        await axios.put(
          `${API_URL}/staff/${editingId}`,
          {
            name: form.name,
            email: form.email,
          }
        );

        setMessage(
          "Staff updated successfully."
        );
      } else {
        await axios.post(
          `${API_URL}/staff`,
          form
        );

        setMessage(
          "Staff added successfully."
        );
      }

      resetForm();
      loadStaff();
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Unable to save staff."
      );
    }
  };

  // =========================
  // EDIT STAFF
  // =========================

  const editStaff = (member) => {
    setForm({
      name: member.name,
      email: member.email,
      password: "",
    });

    setEditingId(member.id);
    setShowForm(true);

    setMessage("");
    setError("");
  };

  // =========================
  // DELETE STAFF
  // =========================

  const deleteStaff = async (id) => {
    if (
      !window.confirm(
        "Delete this staff member?"
      )
    ) {
      return;
    }

    try {
      setError("");
      setMessage("");

      await axios.delete(
        `${API_URL}/staff/${id}`
      );

      setMessage(
        "Staff deleted successfully."
      );

      loadStaff();
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Unable to delete staff."
      );
    }
  };

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <div className="page-loading">
        Loading staff...
      </div>
    );
  }

  // =========================
  // UI
  // =========================

  return (
    <div className="page">

      {/* PAGE HEADER */}

      <div className="page-heading">

        <div>
          <h1>Staff Management</h1>

          <p>
            Manage billing staff accounts
          </p>
        </div>

        <button
          className="add-staff-btn"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          + Add Staff
        </button>

      </div>


      {/* SUCCESS MESSAGE */}

      {message && (
        <div className="success-box">
          {message}
        </div>
      )}


      {/* ERROR MESSAGE */}

      {error && (
        <div className="error-box">
          {error}
        </div>
      )}


      {/* ADD / EDIT FORM */}

      {showForm && (
        <div className="form-card">

          <div className="form-card-header">

            <h2>
              {editingId
                ? "Edit Staff"
                : "Add Staff"}
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

              {/* NAME */}

              <div className="form-group">

                <label>
                  Name
                </label>

                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter staff name"
                  required
                />

              </div>


              {/* EMAIL */}

              <div className="form-group">

                <label>
                  Email
                </label>

                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Enter email address"
                  required
                />

              </div>


              {/* PASSWORD */}

              {!editingId && (
                <div className="form-group">

                  <label>
                    Password
                  </label>

                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Enter password"
                    required
                  />

                </div>
              )}

            </div>


            {/* FORM ACTIONS */}

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
                  ? "Update Staff"
                  : "Create Staff"}
              </button>

            </div>

          </form>

        </div>
      )}


      {/* STAFF TABLE */}

      <div className="table-card">

        <div className="table-header">

          <h2>
            Staff List
          </h2>

          <span>
            {staff.length} staff
          </span>

        </div>


        {staff.length === 0 ? (

          <div className="empty-state">
            No staff members found.
          </div>

        ) : (

          <div className="responsive-table">

            <table>

              <thead>

                <tr>

                  <th>ID</th>

                  <th>NAME</th>

                  <th>EMAIL</th>

                  <th>ROLE</th>

                  <th>ACTIONS</th>

                </tr>

              </thead>


              <tbody>

                {staff.map((member) => (

                  <tr key={member.id}>

                    <td>
                      #{member.id}
                    </td>


                    <td>
                      <strong>
                        {member.name}
                      </strong>
                    </td>


                    <td>
                      {member.email}
                    </td>


                    <td>

                      <span className="role-badge">
                        {member.role}
                      </span>

                    </td>


                    <td>

                      <div className="action-buttons">

                        <button
                          className="edit-button"
                          onClick={() =>
                            editStaff(member)
                          }
                        >
                          ✏ Edit
                        </button>


                        <button
                          className="delete-button"
                          onClick={() =>
                            deleteStaff(
                              member.id
                            )
                          }
                        >
                          🗑 Delete
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

export default StaffManagement;