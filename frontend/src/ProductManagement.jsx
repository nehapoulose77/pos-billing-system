import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "http://127.0.0.1:5000/api";

const emptyForm = {
  name: "",
  category: "",
  size: "",
  color: "",
  price: "",
  stock: "",
  supplier_id: "",
};

function ProductManagement() {
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // =========================================================
  // LOAD PRODUCTS + SUPPLIERS
  // =========================================================

  const loadData = async () => {
    try {
      setLoading(true);

      const [productsResponse, suppliersResponse] =
        await Promise.all([
          axios.get(`${API_URL}/products`),
          axios.get(`${API_URL}/suppliers`),
        ]);

      setProducts(productsResponse.data);
      setSuppliers(suppliersResponse.data);

      setError("");
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Unable to load products."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // =========================================================
  // FORM HANDLING
  // =========================================================

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

  // =========================================================
  // ADD / UPDATE PRODUCT
  // =========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setError("");
      setMessage("");

      if (editingId) {
        await axios.put(
          `${API_URL}/products/${editingId}`,
          form
        );

        setMessage("Product updated successfully.");
      } else {
        await axios.post(
          `${API_URL}/products`,
          form
        );

        setMessage("Product added successfully.");
      }

      resetForm();
      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Unable to save product."
      );
    }
  };

  // =========================================================
  // EDIT PRODUCT
  // =========================================================

  const editProduct = (product) => {
    setForm({
      name: product.name || "",
      category: product.category || "",
      size: product.size || "",
      color: product.color || "",
      price: product.price || "",
      stock: product.stock || "",
      supplier_id: product.supplier_id || "",
    });

    setEditingId(product.id);
    setShowForm(true);

    // Scroll to form
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =========================================================
  // DELETE PRODUCT
  // =========================================================

  const deleteProduct = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this product?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setMessage("");

      await axios.delete(
        `${API_URL}/products/${id}`
      );

      setMessage(
        "Product deleted successfully."
      );

      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Unable to delete product."
      );
    }
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="page-loading">
        Loading products...
      </div>
    );
  }

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div className="page">

      {/* =====================================================
          PAGE HEADER
          ===================================================== */}

      <div className="page-heading">

        <div>
          <h1>Products</h1>
          <p>Manage your product inventory</p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={() => {
            setForm(emptyForm);
            setEditingId(null);
            setShowForm(true);
            setMessage("");
            setError("");

            window.scrollTo({
              top: 0,
              behavior: "smooth",
            });
          }}
        >
          + Add Product
        </button>

      </div>


      {/* =====================================================
          SUCCESS MESSAGE
          ===================================================== */}

      {message && (
        <div className="success-box">
          {message}
        </div>
      )}


      {/* =====================================================
          ERROR MESSAGE
          ===================================================== */}

      {error && (
        <div className="error-box">
          {error}
        </div>
      )}


      {/* =====================================================
          ADD / EDIT FORM
          ===================================================== */}

      {showForm && (
        <div className="form-card">

          <div className="form-card-header">

            <h2>
              {editingId
                ? "Edit Product"
                : "Add Product"}
            </h2>

            <button
              type="button"
              className="close-button"
              onClick={resetForm}
              aria-label="Close form"
            >
              ×
            </button>

          </div>


          <form onSubmit={handleSubmit}>

            <div className="form-grid">

              {/* PRODUCT NAME */}

              <div className="form-group">
                <label>
                  Product Name
                </label>

                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter product name"
                  required
                />
              </div>


              {/* CATEGORY */}

              <div className="form-group">
                <label>
                  Category
                </label>

                <input
                  type="text"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  placeholder="Enter category"
                  required
                />
              </div>


              {/* SIZE */}

              <div className="form-group">
                <label>
                  Size
                </label>

                <input
                  type="text"
                  name="size"
                  value={form.size}
                  onChange={handleChange}
                  placeholder="S / M / L / XL"
                />
              </div>


              {/* COLOR */}

              <div className="form-group">
                <label>
                  Color
                </label>

                <input
                  type="text"
                  name="color"
                  value={form.color}
                  onChange={handleChange}
                  placeholder="Enter color"
                />
              </div>


              {/* PRICE */}

              <div className="form-group">
                <label>
                  Price
                </label>

                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="price"
                  value={form.price}
                  onChange={handleChange}
                  placeholder="0.00"
                  required
                />
              </div>


              {/* STOCK */}

              <div className="form-group">
                <label>
                  Stock
                </label>

                <input
                  type="number"
                  min="0"
                  name="stock"
                  value={form.stock}
                  onChange={handleChange}
                  placeholder="0"
                  required
                />
              </div>


              {/* SUPPLIER */}

              <div className="form-group">

                <label>
                  Supplier
                </label>

                <select
                  name="supplier_id"
                  value={form.supplier_id}
                  onChange={handleChange}
                >

                  <option value="">
                    No Supplier
                  </option>

                  {suppliers.map((supplier) => (
                    <option
                      key={supplier.id}
                      value={supplier.id}
                    >
                      {supplier.name}
                    </option>
                  ))}

                </select>

              </div>

            </div>


            {/* FORM BUTTONS */}

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
                  ? "Update Product"
                  : "Save Product"}
              </button>

            </div>

          </form>

        </div>
      )}


      {/* =====================================================
          PRODUCT TABLE
          ===================================================== */}

      <div className="table-card">

        {/* TABLE HEADER */}

        <div className="table-header">

          <h2>
            Product List
          </h2>

          <span>
            {products.length}{" "}
            {products.length === 1
              ? "product"
              : "products"}
          </span>

        </div>


        {/* EMPTY STATE */}

        {products.length === 0 ? (

          <div className="empty-state">
            No products found.
          </div>

        ) : (

          <div className="responsive-table">

            <table>

              {/* TABLE HEAD */}

              <thead>
                <tr>

                  <th>ID</th>

                  <th>Product</th>

                  <th>Category</th>

                  <th>Size</th>

                  <th>Color</th>

                  <th>Price</th>

                  <th>Stock</th>

                  <th>Supplier</th>

                  <th>Actions</th>

                </tr>
              </thead>


              {/* TABLE BODY */}

              <tbody>

                {products.map((product) => (

                  <tr key={product.id}>

                    {/* ID */}

                    <td>
                      #{product.id}
                    </td>


                    {/* PRODUCT */}

                    <td>
                      <strong>
                        {product.name}
                      </strong>
                    </td>


                    {/* CATEGORY */}

                    <td>
                      {product.category}
                    </td>


                    {/* SIZE */}

                    <td>
                      {product.size || "-"}
                    </td>


                    {/* COLOR */}

                    <td>
                      {product.color || "-"}
                    </td>


                    {/* PRICE */}

                    <td>
                      ₹
                      {Number(
                        product.price
                      ).toFixed(2)}
                    </td>


                    {/* STOCK */}

                    <td>

                      <span
                        className={
                          Number(product.stock) <= 5
                            ? "stock-low"
                            : "stock-ok"
                        }
                      >
                        {product.stock}
                      </span>

                    </td>


                    {/* SUPPLIER */}

                    <td>
                      {product.supplier_name || "-"}
                    </td>


                    {/* ACTIONS */}

                    <td className="action-buttons">

                      <button
                        type="button"
                        className="btn-action btn-action-edit"
                        onClick={() =>
                          editProduct(product)
                        }
                      >
                        ✏️ Edit
                      </button>


                      <button
                        type="button"
                        className="btn-action btn-action-delete"
                        onClick={() =>
                          deleteProduct(product.id)
                        }
                      >
                        🗑️ Delete
                      </button>

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

export default ProductManagement;