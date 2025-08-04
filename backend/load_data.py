import pandas as pd
import sqlite3

# Load users.csv
users_df = pd.read_csv("users.csv")

# Load orders.csv (with headers)
orders_df = pd.read_csv("orders.csv")
# Rename columns to match our database schema
orders_df = orders_df.rename(columns={
    'order_id': 'id',
    'user_id': 'user_id', 
    'status': 'status',
    'gender': 'gender',
    'created_at': 'created_at',
    'returned_at': 'returned_at',
    'shipped_at': 'shipped_at', 
    'delivered_at': 'delivered_at',
    'num_of_item': 'num_of_items'
})

# Connect to or create SQLite DB
conn = sqlite3.connect("ecommerce.db")
cursor = conn.cursor()

# Drop existing tables to start fresh
cursor.execute("DROP TABLE IF EXISTS orders")
cursor.execute("DROP TABLE IF EXISTS users")

# Create users table
cursor.execute("""
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    age INTEGER,
    gender TEXT,
    state TEXT,
    street_address TEXT,
    postal_code TEXT,
    city TEXT,
    country TEXT,
    latitude REAL,
    longitude REAL,
    traffic_source TEXT,
    created_at TEXT
);
""")

# Create orders table
cursor.execute("""
CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    status TEXT,
    gender TEXT,
    created_at TEXT,
    returned_at TEXT,
    shipped_at TEXT,
    delivered_at TEXT,
    num_of_items INTEGER,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
""")

# Insert data into the tables
users_df.to_sql("users", conn, if_exists="append", index=False)
orders_df.to_sql("orders", conn, if_exists="append", index=False)

conn.commit()
conn.close()

print("Data loaded successfully.")
