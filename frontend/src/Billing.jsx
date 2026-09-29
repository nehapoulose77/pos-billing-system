import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "https://pos-billing-system-backend-vuxs.onrender.com/api";

function Billing() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [paymentStatus, setPaymentStatus] = useState("Paid");
  const [tax, setTax] = useState(0);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [lastBill, setLastBill] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/products`);
      setProducts(response.data);
      setError("");
    } catch (err) {
      setError(
        err.response?.data?.error || "Unable to load products."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const addToCart = (product) => {
    if (product.stock <= 0) {
      setError("This product is out of stock.");
      return;
    }

    const existing = cart.find((item) => item.product_id === product.id);

    if (existing) {
      if (existing.quantity >= product.stock) {
        setError("Not enough stock available.");
        return;
      }

      setCart(
        cart.map((item) =>
          item.product_id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          product_id: product.id,
          name: product.name,
          price: Number(product.price),
          quantity: 1,
          stock: product.stock,
        },
      ]);
    }

    setError("");
  };

  const updateQuantity = (productId, quantity) => {
    const product = products.find((item) => item.id === productId);
    if (!product) return;

    const newQuantity = Number(quantity);

    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    if (newQuantity > product.stock) {
      setError("Quantity exceeds available stock.");
      return;
    }

    setCart(
      cart.map((item) =>
        item.product_id === productId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter((item) => item.product_id !== productId));
  };

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const total = subtotal + Number(tax || 0);

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.category.toLowerCase().includes(search.toLowerCase())
  );

  const generateBill = async () => {
    if (cart.length === 0) {
      setError("Please add products to the bill.");
      return;
    }

    try {
      setError("");
      setMessage("");

      // Preserve full cart details so the complete invoice view can show item names
      const currentCartItems = [...cart];

      const response = await axios.post(`${API_URL}/bills`, {
        items: cart.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
        })),
        tax: Number(tax || 0),
        payment_method: paymentMethod,
        payment_status: paymentStatus,
      });

      const fullBillData = {
        ...response.data,
        items_detail: currentCartItems,
      };

      setLastBill(fullBillData);
      setShowInvoiceModal(true);
      setMessage(`Bill #${response.data.bill_id} generated successfully.`);
      setCart([]);
      setTax(0);
      await loadProducts();
    } catch (err) {
      setError(
        err.response?.data?.error || "Unable to generate bill."
      );
    }
  };

  const printBill = () => {
    if (!lastBill) return;

    const printWindow = window.open("", "_blank", "width=600,height=750");

    if (!printWindow) {
      alert("Please allow pop-ups to print the bill.");
      return;
    }

    const itemsHtml = lastBill.items_detail
      ? lastBill.items_detail
          .map(
            (item) => `
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${item.name}</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right;">₹${Number(item.price).toFixed(2)}</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right;">₹${(item.price * item.quantity).toFixed(2)}</td>
          </tr>`
          )
          .join("")
      : "";

    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice #${lastBill.bill_id}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #333; }
            .header { text-align: center; margin-bottom: 20px; }
            .header h1 { margin: 0; font-size: 24px; color: #1e293b; }
            .info { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px; }
            th { text-align: left; padding-bottom: 8px; border-bottom: 2px solid #333; }
            .totals { width: 100%; text-align: right; font-size: 14px; margin-top: 10px; }
            .totals div { margin-bottom: 5px; }
            .grand-total { font-size: 18px; font-weight: bold; border-top: 1px solid #333; padding-top: 5px; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>POS BILLING RECEIPT</h1>
            <p>Official Invoice</p>
          </div>
          <div class="info">
            <div>
              <strong>Invoice No:</strong> #${lastBill.bill_id}<br/>
              <strong>Date:</strong> ${new Date().toLocaleDateString()}
            </div>
            <div style="text-align: right;">
              <strong>Payment:</strong> ${lastBill.payment_method}<br/>
              <strong>Status:</strong> ${lastBill.payment_status}
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Price</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          <div class="totals">
            <div>Subtotal: ₹${Number(lastBill.subtotal).toFixed(2)}</div>
            <div>Tax: ₹${Number(lastBill.tax).toFixed(2)}</div>
            <div class="grand-total">Total Amount: ₹${Number(lastBill.total).toFixed(2)}</div>
          </div>
          <div class="footer">
            <p>Thank you for shopping with us!</p>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  if (loading) {
    return <div className="page-loading">Loading billing...</div>;
  }

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <h1>Billing</h1>
          <p>Create a new customer bill</p>
        </div>
      </div>

      {message && <div className="success-box">{message}</div>}
      {error && <div className="error-box">{error}</div>}

      <div className="billing-layout">
        {/* LEFT COLUMN: PRODUCTS */}
        <div>
          <div className="card" style={{ marginBottom: "20px" }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <input
                className="form-control"
                placeholder="Search products by name or category..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="product-grid">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="product-card"
                style={{
                  cursor: product.stock > 0 ? "pointer" : "not-allowed",
                  opacity: product.stock > 0 ? 1 : 0.6,
                }}
                onClick={() => addToCart(product)}
              >
                <div className="product-image">📦</div>
                <div className="product-name">{product.name}</div>
                <p style={{ color: "var(--muted)", fontSize: "12px", margin: "4px 0" }}>
                  {product.category}
                </p>
                <div className="product-price">
                  ₹{Number(product.price).toFixed(2)}
                </div>
                <small style={{ color: "var(--muted)" }}>
                  Stock: {product.stock}
                </small>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: CURRENT CART */}
        <div>
          <div className="cart-card">
            <div className="card-header">
              <h2>Current Bill</h2>
              <span className="badge badge-info">{cart.length} items</span>
            </div>

            {cart.length === 0 ? (
              <div className="empty-state">
                <div>
                  <div style={{ fontSize: "32px", marginBottom: "8px" }}>🛒</div>
                  <p>No products added yet.</p>
                </div>
              </div>
            ) : (
              <div style={{ maxHeight: "280px", overflowY: "auto" }}>
                {cart.map((item) => (
                  <div className="cart-item" key={item.product_id}>
                    <div>
                      <strong style={{ display: "block" }}>{item.name}</strong>
                      <small style={{ color: "var(--muted)" }}>
                        ₹{item.price.toFixed(2)} × {item.quantity}
                      </small>
                    </div>

                    <div className="quantity-control" style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                      <input
                        type="number"
                        min="1"
                        max={item.stock}
                        value={item.quantity}
                        className="form-control"
                        style={{ width: "55px", height: "32px", textAlign: "center", padding: "2px" }}
                        onChange={(e) =>
                          updateQuantity(item.product_id, e.target.value)
                        }
                      />
                      <button
                        className="btn btn-sm btn-danger"
                        style={{ padding: "2px 8px" }}
                        onClick={() => removeFromCart(item.product_id)}
                      >
                        ×
                      </button>
                    </div>

                    <strong>
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </strong>
                  </div>
                ))}
              </div>
            )}

            <div className="total-section" style={{ marginTop: "15px", paddingTop: "15px", borderTop: "1px solid #e2e8f0" }}>
              <div className="total-row" style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span>Subtotal</span>
                <strong>₹{subtotal.toFixed(2)}</strong>
              </div>

              <div className="total-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span>Tax</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="form-control"
                  style={{ width: "90px", height: "32px", textAlign: "right" }}
                  value={tax}
                  onChange={(e) => setTax(e.target.value)}
                />
              </div>

              <div className="total-row grand-total" style={{ display: "flex", justifyContent: "space-between", fontSize: "18px", fontWeight: "bold", marginTop: "10px", paddingTop: "10px", borderTop: "2px solid #e2e8f0" }}>
                <span>Total</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
            </div>

            <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ display: "block", marginBottom: "4px", fontSize: "13px" }}>Payment Method</label>
                <select
                  className="form-control"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Card">Card</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ display: "block", marginBottom: "4px", fontSize: "13px" }}>Payment Status</label>
                <select
                  className="form-control"
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                >
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>

              <button
                className="btn btn-primary"
                style={{ width: "100%", height: "44px", marginTop: "8px", fontWeight: "600" }}
                onClick={generateBill}
                disabled={cart.length === 0}
              >
                Generate Bill
              </button>

              {lastBill && (
                <button
                  className="btn btn-secondary"
                  style={{ width: "100%", height: "40px" }}
                  onClick={() => setShowInvoiceModal(true)}
                >
                  📄 View Last Generated Invoice
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* GENERATED INVOICE MODAL DISPLAY */}
      {showInvoiceModal && lastBill && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            className="card"
            style={{
              width: "100%",
              maxWidth: "520px",
              backgroundColor: "#fff",
              borderRadius: "8px",
              padding: "24px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px", marginBottom: "16px" }}>
              <h2 style={{ margin: 0, fontSize: "20px" }}>Invoice #{lastBill.bill_id}</h2>
              <button
                style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer" }}
                onClick={() => setShowInvoiceModal(false)}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", color: "#64748b", marginBottom: "16px" }}>
              <div>
                <strong>Payment Method:</strong> {lastBill.payment_method}<br />
                <strong>Status:</strong> {lastBill.payment_status}
              </div>
              <div style={{ textAlign: "right" }}>
                <strong>Date:</strong> {new Date().toLocaleDateString()}
              </div>
            </div>

            {/* ITEM DETAILS TABLE */}
            {lastBill.items_detail && lastBill.items_detail.length > 0 && (
              <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "16px", fontSize: "14px" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #e2e8f0", textTransform: "uppercase", fontSize: "12px", color: "#64748b" }}>
                    <th style={{ textAlign: "left", padding: "8px 0" }}>Item</th>
                    <th style={{ textAlign: "center", padding: "8px 0" }}>Qty</th>
                    <th style={{ textAlign: "right", padding: "8px 0" }}>Price</th>
                    <th style={{ textAlign: "right", padding: "8px 0" }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {lastBill.items_detail.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "8px 0" }}>{item.name}</td>
                      <td style={{ textAlign: "center", padding: "8px 0" }}>{item.quantity}</td>
                      <td style={{ textAlign: "right", padding: "8px 0" }}>₹{Number(item.price).toFixed(2)}</td>
                      <td style={{ textAlign: "right", padding: "8px 0" }}>₹{(item.price * item.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* BILL SUMMARY */}
            <div style={{ borderTop: "2px solid #e2e8f0", paddingTop: "12px", fontSize: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span>Subtotal:</span>
                <span>₹{Number(lastBill.subtotal).toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span>Tax:</span>
                <span>₹{Number(lastBill.tax).toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "18px", fontWeight: "bold", marginTop: "8px", paddingTop: "8px", borderTop: "1px solid #e2e8f0" }}>
                <span>Total Amount:</span>
                <span>₹{Number(lastBill.total).toFixed(2)}</span>
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={printBill}
              >
                🖨 Print Invoice
              </button>
              <button
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => setShowInvoiceModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Billing;