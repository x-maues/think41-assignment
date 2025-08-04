import sqlite3
import pandas as pd

def verify_data():
    """Verify that the data was loaded correctly into the database."""
    
    # Connect to the database
    conn = sqlite3.connect("ecommerce.db")
    
    print("=== DATABASE VERIFICATION ===")
    print()
    
    # Check users table
    print("USERS TABLE:")
    users_count = pd.read_sql_query("SELECT COUNT(*) as count FROM users", conn)
    print(f"Total users: {users_count['count'].iloc[0]:,}")
    
    print("\nSample users:")
    sample_users = pd.read_sql_query("""
        SELECT id, first_name, last_name, email, age, gender, city, country 
        FROM users LIMIT 5
    """, conn)
    print(sample_users.to_string(index=False))
    
    print("\n" + "="*50 + "\n")
    
    # Check orders table
    print("ORDERS TABLE:")
    orders_count = pd.read_sql_query("SELECT COUNT(*) as count FROM orders", conn)
    print(f"Total orders: {orders_count['count'].iloc[0]:,}")
    
    print("\nSample orders:")
    sample_orders = pd.read_sql_query("""
        SELECT id, user_id, status, gender, created_at, num_of_items 
        FROM orders LIMIT 5
    """, conn)
    print(sample_orders.to_string(index=False))
    
    print("\n" + "="*50 + "\n")
    
    # Check data relationships
    print("DATA RELATIONSHIPS:")
    users_with_orders = pd.read_sql_query("""
        SELECT COUNT(DISTINCT user_id) as users_with_orders 
        FROM orders
    """, conn)
    print(f"Users who have placed orders: {users_with_orders['users_with_orders'].iloc[0]:,}")
    
    order_status_distribution = pd.read_sql_query("""
        SELECT status, COUNT(*) as count 
        FROM orders 
        GROUP BY status 
        ORDER BY count DESC
    """, conn)
    print("\nOrder status distribution:")
    print(order_status_distribution.to_string(index=False))
    
    conn.close()
    print("\n✅ Data verification completed successfully!")

if __name__ == "__main__":
    verify_data() 