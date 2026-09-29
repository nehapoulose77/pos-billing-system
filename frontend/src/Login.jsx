import { useState } from "react";
import axios from "axios";

const API_URL = "https://pos-billing-system-backend-vuxs.onrender.com/api";

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");

    if (!email || !password) {
      setError("Please enter email and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        `${API_URL}/login`,
        {
          email,
          password,
        }
      );

      if (response.data.success) {
        onLogin(response.data.user);
      } else {
        setError(
          response.data.error ||
            "Invalid login details."
        );
      }
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Unable to connect to the server."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">

      <div className="login-brand-section">
        <div className="brand-icon">
          🛒
        </div>

        <h1>POS Billing</h1>

        <p>
          Smart Point of Sale Management System
        </p>

        <div className="brand-features">
          <div>✓ Easy Billing</div>
          <div>✓ Inventory Management</div>
          <div>✓ Sales Reports</div>
        </div>
      </div>

      <div className="login-form-section">

        <div className="login-card">

          <div className="login-title">
            <h2>Welcome Back</h2>
            <p>
              Sign in to continue to your account
            </p>
          </div>

          {error && (
            <div className="login-error">
              ⚠ {error}
            </div>
          )}

          <form onSubmit={handleLogin}>

            <div className="form-group">
              <label>Email</label>

              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
              />
            </div>

            <div className="form-group">
              <label>Password</label>

              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
              />
            </div>

            <button
              className="login-button"
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Signing in..."
                : "Sign In"}
            </button>

          </form>

          

        </div>

      </div>

    </div>
  );
}

export default Login;