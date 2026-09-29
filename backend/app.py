from flask import Flask, jsonify, request, g
from flask_cors import CORS
from database import get_db_connection, create_tables
from functools import wraps
import sqlite3


# =====================================================
# FLASK APPLICATION
# =====================================================

app = Flask(__name__)

# Allow React frontend to communicate with Flask
CORS(
    app,
    resources={r"/api/*": {"origins": "*"}},
    allow_headers=["Content-Type", "X-User-ID"],
    methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"]
)

# Create database tables if they do not already exist
create_tables()


# =====================================================
# AUTHENTICATION / AUTHORIZATION
# =====================================================

def get_current_user():
    """
    Get the logged-in user from the X-User-ID header.
    """

    user_id = request.headers.get("X-User-ID")

    if not user_id:
        return None

    conn = get_db_connection()

    try:
        user = conn.execute(
            """
            SELECT
                id,
                name,
                email,
                role
            FROM users
            WHERE id = ?
            """,
            (user_id,)
        ).fetchone()

        return user

    finally:
        conn.close()


def login_required(function):
    """
    Allows only logged-in users.
    """

    @wraps(function)
    def wrapper(*args, **kwargs):

        user = get_current_user()

        if user is None:
            return jsonify({
                "error": "Authentication required"
            }), 401

        g.current_user = user

        return function(*args, **kwargs)

    return wrapper


def admin_required(function):
    """
    Allows only Admin users.
    """

    @wraps(function)
    def wrapper(*args, **kwargs):

        user = get_current_user()

        if user is None:
            return jsonify({
                "error": "Authentication required"
            }), 401

        if user["role"] != "admin":
            return jsonify({
                "error": "Admin access required"
            }), 403

        g.current_user = user

        return function(*args, **kwargs)

    return wrapper


# =====================================================
# HOME
# =====================================================

@app.route("/", methods=["GET"])
def home():

    return jsonify({
        "message": "POS Billing Backend is running!"
    })


# =====================================================
# LOGIN
# =====================================================

@app.route("/api/login", methods=["POST"])
def login():

    data = request.get_json(silent=True) or {}

    email = data.get("email", "").strip()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({
            "success": False,
            "error": "Email and password are required"
        }), 400

    conn = get_db_connection()

    try:

        user = conn.execute(
            """
            SELECT
                id,
                name,
                email,
                password,
                role
            FROM users
            WHERE email = ?
            AND password = ?
            """,
            (email, password)
        ).fetchone()

    finally:
        conn.close()

    if user is None:
        return jsonify({
            "success": False,
            "error": "Invalid email or password"
        }), 401

    return jsonify({
        "success": True,
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "role": user["role"]
        }
    })


# =====================================================
# PRODUCT MANAGEMENT
# =====================================================

# Get all products
# Staff and Admin can view products
@app.route("/api/products", methods=["GET"])
@login_required
def get_products():

    conn = get_db_connection()

    try:

        products = conn.execute(
            """
            SELECT
                products.id,
                products.name,
                products.category,
                products.size,
                products.color,
                products.price,
                products.stock,
                products.supplier_id,
                suppliers.name AS supplier_name
            FROM products
            LEFT JOIN suppliers
                ON products.supplier_id = suppliers.id
            ORDER BY products.id DESC
            """
        ).fetchall()

        return jsonify([
            dict(product)
            for product in products
        ])

    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500

    finally:
        conn.close()


# Add product - ADMIN ONLY
@app.route("/api/products", methods=["POST"])
@admin_required
def add_product():

    data = request.get_json(silent=True) or {}

    name = str(data.get("name", "")).strip()
    category = str(data.get("category", "")).strip()
    size = str(data.get("size", "")).strip()
    color = str(data.get("color", "")).strip()
    supplier_id = data.get("supplier_id")

    if not name:
        return jsonify({
            "error": "Product name is required"
        }), 400

    if not category:
        return jsonify({
            "error": "Category is required"
        }), 400

    try:

        price = float(data.get("price"))
        stock = int(data.get("stock", 0))

        if price < 0 or stock < 0:
            raise ValueError

        if supplier_id in ("", None):
            supplier_id = None

        else:
            supplier_id = int(supplier_id)

            if supplier_id <= 0:
                raise ValueError

    except (TypeError, ValueError):

        return jsonify({
            "error": "Enter valid price, stock, or supplier details"
        }), 400

    conn = get_db_connection()

    try:

        if supplier_id is not None:

            supplier = conn.execute(
                """
                SELECT id
                FROM suppliers
                WHERE id = ?
                """,
                (supplier_id,)
            ).fetchone()

            if supplier is None:
                return jsonify({
                    "error": "Selected supplier does not exist"
                }), 400

        cursor = conn.execute(
            """
            INSERT INTO products
                (
                    name,
                    category,
                    size,
                    color,
                    price,
                    stock,
                    supplier_id
                )
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                name,
                category,
                size,
                color,
                price,
                stock,
                supplier_id
            )
        )

        conn.commit()

        return jsonify({
            "message": "Product added successfully!",
            "id": cursor.lastrowid
        }), 201

    except Exception as e:

        conn.rollback()

        return jsonify({
            "error": str(e)
        }), 400

    finally:
        conn.close()


# Update product - ADMIN ONLY
@app.route("/api/products/<int:product_id>", methods=["PUT"])
@admin_required
def update_product(product_id):

    data = request.get_json(silent=True) or {}

    name = str(data.get("name", "")).strip()
    category = str(data.get("category", "")).strip()
    size = str(data.get("size", "")).strip()
    color = str(data.get("color", "")).strip()
    supplier_id = data.get("supplier_id")

    if not name:
        return jsonify({
            "error": "Product name is required"
        }), 400

    if not category:
        return jsonify({
            "error": "Category is required"
        }), 400

    try:

        price = float(data.get("price"))
        stock = int(data.get("stock"))

        if price < 0 or stock < 0:
            raise ValueError

        if supplier_id in ("", None):
            supplier_id = None

        else:
            supplier_id = int(supplier_id)

            if supplier_id <= 0:
                raise ValueError

    except (TypeError, ValueError):

        return jsonify({
            "error": "Invalid price, stock, or supplier details"
        }), 400

    conn = get_db_connection()

    try:

        product = conn.execute(
            """
            SELECT id
            FROM products
            WHERE id = ?
            """,
            (product_id,)
        ).fetchone()

        if product is None:
            return jsonify({
                "error": "Product not found"
            }), 404

        if supplier_id is not None:

            supplier = conn.execute(
                """
                SELECT id
                FROM suppliers
                WHERE id = ?
                """,
                (supplier_id,)
            ).fetchone()

            if supplier is None:
                return jsonify({
                    "error": "Selected supplier does not exist"
                }), 400

        conn.execute(
            """
            UPDATE products
            SET
                name = ?,
                category = ?,
                size = ?,
                color = ?,
                price = ?,
                stock = ?,
                supplier_id = ?
            WHERE id = ?
            """,
            (
                name,
                category,
                size,
                color,
                price,
                stock,
                supplier_id,
                product_id
            )
        )

        conn.commit()

        return jsonify({
            "message": "Product updated successfully!"
        })

    except Exception as e:

        conn.rollback()

        return jsonify({
            "error": str(e)
        }), 400

    finally:
        conn.close()


# Delete product - ADMIN ONLY
@app.route("/api/products/<int:product_id>", methods=["DELETE"])
@admin_required
def delete_product(product_id):

    conn = get_db_connection()

    try:

        cursor = conn.execute(
            """
            DELETE FROM products
            WHERE id = ?
            """,
            (product_id,)
        )

        deleted = cursor.rowcount

        conn.commit()

        if deleted == 0:
            return jsonify({
                "error": "Product not found"
            }), 404

        return jsonify({
            "message": "Product deleted successfully!"
        })

    finally:
        conn.close()


# =====================================================
# SUPPLIER MANAGEMENT
# =====================================================

@app.route("/api/suppliers", methods=["GET"])
@admin_required
def get_suppliers():

    conn = get_db_connection()

    try:

        suppliers = conn.execute(
            """
            SELECT
                id,
                name,
                phone,
                email,
                address
            FROM suppliers
            ORDER BY id DESC
            """
        ).fetchall()

        return jsonify([
            dict(supplier)
            for supplier in suppliers
        ])

    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500

    finally:
        conn.close()


@app.route("/api/suppliers", methods=["POST"])
@admin_required
def add_supplier():

    data = request.get_json(silent=True) or {}

    name = str(data.get("name", "")).strip()

    if not name:
        return jsonify({
            "error": "Supplier name is required"
        }), 400

    conn = get_db_connection()

    try:

        cursor = conn.execute(
            """
            INSERT INTO suppliers
                (
                    name,
                    phone,
                    email,
                    address
                )
            VALUES (?, ?, ?, ?)
            """,
            (
                name,
                data.get("phone", ""),
                data.get("email", ""),
                data.get("address", "")
            )
        )

        conn.commit()

        return jsonify({
            "message": "Supplier added successfully",
            "id": cursor.lastrowid
        }), 201

    except Exception as e:

        conn.rollback()

        return jsonify({
            "error": str(e)
        }), 400

    finally:
        conn.close()


@app.route("/api/suppliers/<int:supplier_id>", methods=["PUT"])
@admin_required
def update_supplier(supplier_id):

    data = request.get_json(silent=True) or {}

    name = str(data.get("name", "")).strip()

    if not name:
        return jsonify({
            "error": "Supplier name is required"
        }), 400

    conn = get_db_connection()

    try:

        result = conn.execute(
            """
            UPDATE suppliers
            SET
                name = ?,
                phone = ?,
                email = ?,
                address = ?
            WHERE id = ?
            """,
            (
                name,
                data.get("phone", ""),
                data.get("email", ""),
                data.get("address", ""),
                supplier_id
            )
        )

        conn.commit()

        if result.rowcount == 0:
            return jsonify({
                "error": "Supplier not found"
            }), 404

        return jsonify({
            "message": "Supplier updated successfully"
        })

    except Exception as e:

        conn.rollback()

        return jsonify({
            "error": str(e)
        }), 400

    finally:
        conn.close()


@app.route("/api/suppliers/<int:supplier_id>", methods=["DELETE"])
@admin_required
def delete_supplier(supplier_id):

    conn = get_db_connection()

    try:

        product_count = conn.execute(
            """
            SELECT COUNT(*)
            FROM products
            WHERE supplier_id = ?
            """,
            (supplier_id,)
        ).fetchone()[0]

        if product_count > 0:

            return jsonify({
                "error": (
                    "Cannot delete this supplier because "
                    f"{product_count} product(s) are linked to it."
                )
            }), 400

        result = conn.execute(
            """
            DELETE FROM suppliers
            WHERE id = ?
            """,
            (supplier_id,)
        )

        conn.commit()

        if result.rowcount == 0:
            return jsonify({
                "error": "Supplier not found"
            }), 404

        return jsonify({
            "message": "Supplier deleted successfully"
        })

    finally:
        conn.close()


# =====================================================
# BILLING
# =====================================================

@app.route("/api/bills", methods=["POST"])
@login_required
def create_bill():

    data = request.get_json(silent=True) or {}

    items = data.get("items", [])

    payment_method = str(
        data.get("payment_method", "Cash")
    ).strip()

    payment_status = str(
        data.get("payment_status", "Paid")
    ).strip()

    allowed_payment_methods = [
        "Cash",
        "UPI",
        "Card"
    ]

    if payment_method not in allowed_payment_methods:
        return jsonify({
            "error": (
                "Invalid payment method. "
                "Choose Cash, UPI, or Card."
            )
        }), 400

    allowed_payment_statuses = [
        "Paid",
        "Pending"
    ]

    if payment_status not in allowed_payment_statuses:
        return jsonify({
            "error": (
                "Invalid payment status. "
                "Choose Paid or Pending."
            )
        }), 400

    try:

        tax = float(data.get("tax", 0))

        if tax < 0:
            return jsonify({
                "error": "Tax cannot be negative"
            }), 400

        if not isinstance(items, list) or not items:
            return jsonify({
                "error": "Cart is empty"
            }), 400

    except (TypeError, ValueError):

        return jsonify({
            "error": "Invalid billing data"
        }), 400

    conn = get_db_connection()

    try:

        cursor = conn.cursor()

        subtotal = 0
        bill_items = []

        for item in items:

            try:

                product_id = int(item["product_id"])
                quantity = int(item["quantity"])

            except (KeyError, TypeError, ValueError):

                return jsonify({
                    "error": "Invalid cart item"
                }), 400

            if quantity <= 0:

                return jsonify({
                    "error": "Quantity must be greater than zero"
                }), 400

            product = cursor.execute(
                """
                SELECT
                    id,
                    name,
                    price,
                    stock
                FROM products
                WHERE id = ?
                """,
                (product_id,)
            ).fetchone()

            if product is None:

                return jsonify({
                    "error": f"Product {product_id} not found"
                }), 404

            if product["stock"] < quantity:

                return jsonify({
                    "error": (
                        f"Insufficient stock for "
                        f"{product['name']}"
                    )
                }), 400

            price = float(product["price"])

            item_subtotal = price * quantity

            subtotal += item_subtotal

            bill_items.append({
                "product_id": product_id,
                "quantity": quantity,
                "price": price,
                "subtotal": item_subtotal
            })

        total = subtotal + tax

        cursor.execute(
            """
            INSERT INTO bills
                (
                    subtotal,
                    tax,
                    total,
                    payment_method,
                    payment_status
                )
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                subtotal,
                tax,
                total,
                payment_method,
                payment_status
            )
        )

        bill_id = cursor.lastrowid

        for item in bill_items:

            cursor.execute(
                """
                INSERT INTO bill_items
                    (
                        bill_id,
                        product_id,
                        quantity,
                        price,
                        subtotal
                    )
                VALUES (?, ?, ?, ?, ?)
                """,
                (
                    bill_id,
                    item["product_id"],
                    item["quantity"],
                    item["price"],
                    item["subtotal"]
                )
            )

            cursor.execute(
                """
                UPDATE products
                SET stock = stock - ?
                WHERE id = ?
                """,
                (
                    item["quantity"],
                    item["product_id"]
                )
            )

        conn.commit()

        return jsonify({
            "message": "Bill generated successfully",
            "bill_id": bill_id,
            "subtotal": subtotal,
            "tax": tax,
            "total": total,
            "payment_method": payment_method,
            "payment_status": payment_status
        }), 201

    except (ValueError, KeyError, TypeError):

        conn.rollback()

        return jsonify({
            "error": "Invalid billing data"
        }), 400

    except Exception as e:

        conn.rollback()

        return jsonify({
            "error": str(e)
        }), 500

    finally:
        conn.close()


# =====================================================
# BILL ITEMS
# =====================================================

@app.route("/api/bills/<int:bill_id>/items", methods=["GET"])
@login_required
def get_bill_items(bill_id):

    conn = get_db_connection()

    try:

        items = conn.execute(
            """
            SELECT
                bi.id,
                bi.bill_id,
                bi.product_id,
                p.name AS product_name,
                bi.quantity,
                bi.price,
                bi.subtotal
            FROM bill_items bi
            JOIN products p
                ON bi.product_id = p.id
            WHERE bi.bill_id = ?
            """,
            (bill_id,)
        ).fetchall()

        return jsonify([
            dict(item)
            for item in items
        ])

    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500

    finally:
        conn.close()


# =====================================================
# RETURNS MANAGEMENT
# =====================================================

@app.route("/api/returns", methods=["GET"])
@admin_required
def get_returns():

    conn = get_db_connection()

    try:

        returns = conn.execute(
            """
            SELECT
                r.id,
                r.bill_id,
                r.product_id,
                p.name AS product_name,
                r.quantity,
                r.reason,
                r.created_at
            FROM returns r
            LEFT JOIN products p
                ON r.product_id = p.id
            ORDER BY r.created_at DESC
            """
        ).fetchall()

        return jsonify([
            dict(return_item)
            for return_item in returns
        ])

    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500

    finally:
        conn.close()


@app.route("/api/returns", methods=["POST"])
@admin_required
def create_return():

    data = request.get_json(silent=True) or {}

    bill_id = data.get("bill_id")
    product_id = data.get("product_id")
    quantity = data.get("quantity")
    reason = str(data.get("reason", "")).strip()

    if not bill_id or not product_id or not quantity:

        return jsonify({
            "error": (
                "Bill ID, product ID and "
                "quantity are required"
            )
        }), 400

    try:

        bill_id = int(bill_id)
        product_id = int(product_id)
        quantity = int(quantity)

        if (
            bill_id <= 0
            or product_id <= 0
            or quantity <= 0
        ):
            raise ValueError

    except (TypeError, ValueError):

        return jsonify({
            "error": (
                "Bill ID, product ID and "
                "quantity must be valid"
            )
        }), 400

    conn = get_db_connection()

    try:

        bill = conn.execute(
            """
            SELECT id
            FROM bills
            WHERE id = ?
            """,
            (bill_id,)
        ).fetchone()

        if bill is None:

            return jsonify({
                "error": "Bill not found"
            }), 404

        product = conn.execute(
            """
            SELECT
                id,
                name,
                stock
            FROM products
            WHERE id = ?
            """,
            (product_id,)
        ).fetchone()

        if product is None:

            return jsonify({
                "error": "Product not found"
            }), 404

        bill_item = conn.execute(
            """
            SELECT
                quantity
            FROM bill_items
            WHERE bill_id = ?
            AND product_id = ?
            """,
            (
                bill_id,
                product_id
            )
        ).fetchone()

        if bill_item is None:

            return jsonify({
                "error": (
                    "This product is not part "
                    "of the selected bill"
                )
            }), 400

        previous_return = conn.execute(
            """
            SELECT
                COALESCE(SUM(quantity), 0)
                AS returned_quantity
            FROM returns
            WHERE bill_id = ?
            AND product_id = ?
            """,
            (
                bill_id,
                product_id
            )
        ).fetchone()

        already_returned = previous_return[
            "returned_quantity"
        ]

        if (
            already_returned + quantity
            > bill_item["quantity"]
        ):

            return jsonify({
                "error": (
                    "Return quantity exceeds "
                    "the purchased quantity"
                )
            }), 400

        conn.execute(
            """
            INSERT INTO returns
                (
                    bill_id,
                    product_id,
                    quantity,
                    reason
                )
            VALUES (?, ?, ?, ?)
            """,
            (
                bill_id,
                product_id,
                quantity,
                reason
            )
        )

        conn.execute(
            """
            UPDATE products
            SET stock = stock + ?
            WHERE id = ?
            """,
            (
                quantity,
                product_id
            )
        )

        conn.commit()

        return jsonify({
            "success": True,
            "message": "Product returned successfully"
        }), 201

    except Exception as e:

        conn.rollback()

        return jsonify({
            "error": str(e)
        }), 500

    finally:
        conn.close()


# =====================================================
# SALES HISTORY / TRANSACTIONS
# =====================================================

@app.route("/api/bills", methods=["GET"])
@login_required
def get_bills():

    conn = get_db_connection()

    try:

        bills = conn.execute(
            """
            SELECT
                id,
                bill_date,
                subtotal,
                tax,
                total,
                payment_method,
                payment_status
            FROM bills
            ORDER BY id DESC
            """
        ).fetchall()

        return jsonify([
            dict(bill)
            for bill in bills
        ])

    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500

    finally:
        conn.close()


# =====================================================
# TRANSACTIONS
# =====================================================

@app.route("/api/transactions", methods=["GET"])
@admin_required
def get_transactions():

    conn = get_db_connection()

    try:

        transactions = conn.execute(
            """
            SELECT
                id,
                bill_date,
                subtotal,
                tax,
                total,
                payment_method,
                payment_status
            FROM bills
            ORDER BY bill_date DESC, id DESC
            """
        ).fetchall()

        return jsonify([
            dict(transaction)
            for transaction in transactions
        ])

    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500

    finally:
        conn.close()


# =====================================================
# LEDGER
# =====================================================

@app.route("/api/ledger", methods=["GET"])
@admin_required
def get_ledger():

    conn = get_db_connection()

    try:

        ledger = conn.execute(
            """
            SELECT
                payment_method,
                COUNT(*) AS transaction_count,
                COALESCE(SUM(total), 0) AS total_amount
            FROM bills
            WHERE payment_status = 'Paid'
            GROUP BY payment_method
            ORDER BY payment_method
            """
        ).fetchall()

        overall = conn.execute(
            """
            SELECT
                COUNT(*) AS total_transactions,
                COALESCE(SUM(total), 0) AS total_amount
            FROM bills
            WHERE payment_status = 'Paid'
            """
        ).fetchone()

        return jsonify({
            "summary": [
                dict(item)
                for item in ledger
            ],
            "overall": dict(overall)
        })

    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500

    finally:
        conn.close()


# =====================================================
# REPORTS
# =====================================================

@app.route("/api/reports", methods=["GET"])
@admin_required
def get_reports():

    conn = get_db_connection()

    try:

        # -------------------------------------------------
        # TODAY'S SALES
        # -------------------------------------------------

        today = conn.execute(
            """
            SELECT
                COUNT(*) AS transaction_count,
                COALESCE(SUM(total), 0) AS total_sales
            FROM bills
            WHERE DATE(bill_date)
                = DATE('now', 'localtime')
            AND payment_status = 'Paid'
            """
        ).fetchone()

        # -------------------------------------------------
        # CURRENT MONTH'S SALES
        # -------------------------------------------------

        monthly = conn.execute(
            """
            SELECT
                COUNT(*) AS transaction_count,
                COALESCE(SUM(total), 0) AS total_sales
            FROM bills
            WHERE strftime('%Y-%m', bill_date)
                = strftime('%Y-%m', 'now', 'localtime')
            AND payment_status = 'Paid'
            """
        ).fetchone()

        # -------------------------------------------------
        # PAYMENT METHOD SUMMARY
        # -------------------------------------------------

        payment_summary = conn.execute(
            """
            SELECT
                payment_method,
                COUNT(*) AS transaction_count,
                COALESCE(SUM(total), 0) AS total_amount
            FROM bills
            WHERE payment_status = 'Paid'
            GROUP BY payment_method
            ORDER BY total_amount DESC
            """
        ).fetchall()

        # -------------------------------------------------
        # DAILY SALES - LAST 30 DAYS
        # -------------------------------------------------

        daily_sales = conn.execute(
            """
            SELECT
                DATE(bill_date) AS sale_date,
                COUNT(*) AS transaction_count,
                COALESCE(SUM(total), 0) AS total_sales
            FROM bills
            WHERE payment_status = 'Paid'
            GROUP BY DATE(bill_date)
            ORDER BY sale_date DESC
            LIMIT 30
            """
        ).fetchall()

        # -------------------------------------------------
        # MONTHLY SALES - LAST 12 MONTHS
        # -------------------------------------------------

        monthly_sales = conn.execute(
            """
            SELECT
                strftime('%Y-%m', bill_date)
                    AS sale_month,
                COUNT(*) AS transaction_count,
                COALESCE(SUM(total), 0) AS total_sales
            FROM bills
            WHERE payment_status = 'Paid'
            GROUP BY strftime('%Y-%m', bill_date)
            ORDER BY sale_month DESC
            LIMIT 12
            """
        ).fetchall()

        # -------------------------------------------------
        # OVERALL REVENUE
        # -------------------------------------------------

        overall = conn.execute(
            """
            SELECT
                COUNT(*) AS total_transactions,
                COALESCE(SUM(total), 0) AS total_revenue
            FROM bills
            WHERE payment_status = 'Paid'
            """
        ).fetchone()

        return jsonify({

            "today": {
                "transaction_count":
                    today["transaction_count"],
                "total_sales":
                    today["total_sales"]
            },

            "monthly": {
                "transaction_count":
                    monthly["transaction_count"],
                "total_sales":
                    monthly["total_sales"]
            },

            "payment_summary": [
                {
                    "payment_method":
                        row["payment_method"],
                    "transaction_count":
                        row["transaction_count"],
                    "total_amount":
                        row["total_amount"]
                }
                for row in payment_summary
            ],

            "daily_sales": [
                {
                    "sale_date":
                        row["sale_date"],
                    "transaction_count":
                        row["transaction_count"],
                    "total_sales":
                        row["total_sales"]
                }
                for row in daily_sales
            ],

            "monthly_sales": [
                {
                    "sale_month":
                        row["sale_month"],
                    "transaction_count":
                        row["transaction_count"],
                    "total_sales":
                        row["total_sales"]
                }
                for row in monthly_sales
            ],

            "overall": {
                "total_transactions":
                    overall["total_transactions"],
                "total_revenue":
                    overall["total_revenue"]
            }

        })

    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500

    finally:
        conn.close()


# =====================================================
# DASHBOARD
# =====================================================

@app.route("/api/dashboard", methods=["GET"])
@admin_required
def get_dashboard():

    conn = get_db_connection()

    try:

        total_sales = conn.execute(
            """
            SELECT COALESCE(SUM(total), 0)
            FROM bills
            """
        ).fetchone()[0]

        total_bills = conn.execute(
            """
            SELECT COUNT(*)
            FROM bills
            """
        ).fetchone()[0]

        total_products = conn.execute(
            """
            SELECT COUNT(*)
            FROM products
            """
        ).fetchone()[0]

        low_stock = conn.execute(
            """
            SELECT COUNT(*)
            FROM products
            WHERE stock <= 5
            """
        ).fetchone()[0]

        return jsonify({
            "total_sales": total_sales,
            "total_bills": total_bills,
            "total_products": total_products,
            "low_stock": low_stock
        })

    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500

    finally:
        conn.close()


# =====================================================
# STAFF MANAGEMENT
# =====================================================

@app.route("/api/staff", methods=["GET"])
@admin_required
def get_staff():

    conn = get_db_connection()

    try:

        staff = conn.execute(
            """
            SELECT
                id,
                name,
                email,
                role
            FROM users
            WHERE role = 'staff'
            ORDER BY id DESC
            """
        ).fetchall()

        return jsonify([
            dict(user)
            for user in staff
        ])

    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500

    finally:
        conn.close()


@app.route("/api/staff", methods=["POST"])
@admin_required
def add_staff():

    data = request.get_json(silent=True) or {}

    name = str(data.get("name", "")).strip()
    email = str(data.get("email", "")).strip()
    password = str(data.get("password", ""))

    if not name or not email or not password:

        return jsonify({
            "error": (
                "Name, email and "
                "password are required"
            )
        }), 400

    conn = get_db_connection()

    try:

        conn.execute(
            """
            INSERT INTO users
                (
                    name,
                    email,
                    password,
                    role
                )
            VALUES (?, ?, ?, ?)
            """,
            (
                name,
                email,
                password,
                "staff"
            )
        )

        conn.commit()

        return jsonify({
            "success": True,
            "message": "Staff added successfully"
        }), 201

    except sqlite3.IntegrityError:

        return jsonify({
            "error": "Email already exists"
        }), 400

    finally:
        conn.close()


@app.route("/api/staff/<int:staff_id>", methods=["PUT"])
@admin_required
def update_staff(staff_id):

    data = request.get_json(silent=True) or {}

    name = str(data.get("name", "")).strip()
    email = str(data.get("email", "")).strip()

    if not name or not email:

        return jsonify({
            "error": "Name and email are required"
        }), 400

    conn = get_db_connection()

    try:

        result = conn.execute(
            """
            UPDATE users
            SET
                name = ?,
                email = ?
            WHERE id = ?
            AND role = 'staff'
            """,
            (
                name,
                email,
                staff_id
            )
        )

        conn.commit()

        if result.rowcount == 0:

            return jsonify({
                "error": "Staff member not found"
            }), 404

        return jsonify({
            "success": True,
            "message": "Staff updated successfully"
        })

    except sqlite3.IntegrityError:

        return jsonify({
            "error": "Email already exists"
        }), 400

    finally:
        conn.close()


@app.route("/api/staff/<int:staff_id>", methods=["DELETE"])
@admin_required
def delete_staff(staff_id):

    conn = get_db_connection()

    try:

        result = conn.execute(
            """
            DELETE FROM users
            WHERE id = ?
            AND role = 'staff'
            """,
            (staff_id,)
        )

        conn.commit()

        if result.rowcount == 0:

            return jsonify({
                "error": "Staff member not found"
            }), 404

        return jsonify({
            "success": True,
            "message": "Staff deleted successfully"
        })

    finally:
        conn.close()


# =====================================================
# RUN APPLICATION
# =====================================================

if __name__ == "__main__":

    app.run(
        debug=True,
        port=5000
    )