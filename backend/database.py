
import sqlite3


# ---------------------------------------------------------
# DATABASE FILE
# ---------------------------------------------------------
DATABASE = "pos.db"


# ---------------------------------------------------------
# DATABASE CONNECTION
# ---------------------------------------------------------
def get_db_connection():
    conn = sqlite3.connect(DATABASE)

    # Allows us to access columns by name
    conn.row_factory = sqlite3.Row

    # Enable foreign key support in SQLite
    conn.execute("PRAGMA foreign_keys = ON")

    return conn


# ---------------------------------------------------------
# CREATE ALL DATABASE TABLES
# ---------------------------------------------------------
def create_tables():

    conn = get_db_connection()
    cursor = conn.cursor()

    # =====================================================
    # 1. SUPPLIERS TABLE
    # =====================================================
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS suppliers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT,
            email TEXT,
            address TEXT
        )
    """)

    # =====================================================
    # 2. PRODUCTS TABLE
    # =====================================================
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            size TEXT,
            color TEXT,
            price REAL NOT NULL,
            stock INTEGER NOT NULL DEFAULT 0,
            supplier_id INTEGER
        )
    """)

    # -----------------------------------------------------
    # Check existing columns in products table
    # -----------------------------------------------------
    columns = conn.execute("""
        PRAGMA table_info(products)
    """).fetchall()

    column_names = [column["name"] for column in columns]

    # Add size column if old database doesn't have it
    if "size" not in column_names:

        conn.execute("""
            ALTER TABLE products
            ADD COLUMN size TEXT
        """)

        print("Added 'size' column to products table.")

    # Add color column if old database doesn't have it
    if "color" not in column_names:

        conn.execute("""
            ALTER TABLE products
            ADD COLUMN color TEXT
        """)

        print("Added 'color' column to products table.")

    # Add supplier_id if old database doesn't have it
    if "supplier_id" not in column_names:

        conn.execute("""
            ALTER TABLE products
            ADD COLUMN supplier_id INTEGER
        """)

        print("Added 'supplier_id' column to products table.")

    # =====================================================
    # 3. USERS TABLE
    # =====================================================
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL
        )
    """)

    # =====================================================
    # CREATE DEFAULT ADMIN USER
    # =====================================================
    cursor.execute("""
        INSERT OR IGNORE INTO users
        (name, email, password, role)
        VALUES (?, ?, ?, ?)
    """, (
        "Admin User",
        "admin@gmail.com",
        "admin123",
        "admin"
    ))

    # =====================================================
    # 4. BILLS TABLE
    # =====================================================
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS bills (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bill_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            subtotal REAL NOT NULL,
            tax REAL DEFAULT 0,
            total REAL NOT NULL,
            payment_method TEXT DEFAULT 'Cash',
            payment_status TEXT DEFAULT 'Paid'
        )
    """)

    # -----------------------------------------------------
    # Check existing columns in bills table
    # -----------------------------------------------------
    bill_columns = conn.execute("""
        PRAGMA table_info(bills)
    """).fetchall()

    bill_column_names = [
        column["name"]
        for column in bill_columns
    ]

    # Add payment_method if old database doesn't have it
    if "payment_method" not in bill_column_names:

        conn.execute("""
            ALTER TABLE bills
            ADD COLUMN payment_method TEXT DEFAULT 'Cash'
        """)

        print(
            "Added 'payment_method' column "
            "to bills table."
        )

    # Add payment_status if old database doesn't have it
    if "payment_status" not in bill_column_names:

        conn.execute("""
            ALTER TABLE bills
            ADD COLUMN payment_status TEXT DEFAULT 'Paid'
        """)

        print(
            "Added 'payment_status' column "
            "to bills table."
        )

    # =====================================================
    # 5. BILL ITEMS TABLE
    # =====================================================
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS bill_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bill_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL,
            price REAL NOT NULL,
            subtotal REAL NOT NULL,

            FOREIGN KEY (bill_id)
                REFERENCES bills(id),

            FOREIGN KEY (product_id)
                REFERENCES products(id)
        )
    """)

    # =====================================================
    # 6. RETURNS TABLE
    # =====================================================
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS returns (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bill_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL,
            reason TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY (bill_id)
                REFERENCES bills(id),

            FOREIGN KEY (product_id)
                REFERENCES products(id)
        )
    """)

    # =====================================================
    # COMMIT CHANGES
    # =====================================================
    conn.commit()

    # Close database connection
    conn.close()


# ---------------------------------------------------------
# RUN DATABASE CREATION DIRECTLY
# ---------------------------------------------------------
if __name__ == "__main__":

    create_tables()

    print("Database and tables created successfully!")
    print("Default admin account created.")
    print("Email: admin@gmail.com")
    print("Password: admin123")
