const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// Database connection
const db = new sqlite3.Database('./ecommerce.db', (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Helper function to run database queries
function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// Helper function to run single row queries
function runQuerySingle(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

// GET /customers - List all customers with pagination
app.get('/customers', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return res.status(400).json({
        error: 'Invalid pagination parameters. Page must be >= 1, limit must be between 1 and 100.'
      });
    }

    // Get total count for pagination
    const countResult = await runQuerySingle('SELECT COUNT(*) as total FROM users');
    const total = countResult.total;

    // Get customers with order count
    const customers = await runQuery(`
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.age,
        u.gender,
        u.city,
        u.country,
        COUNT(o.id) as order_count
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      GROUP BY u.id
      ORDER BY u.id
      LIMIT ? OFFSET ?
    `, [limit, offset]);

    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    res.json({
      data: customers,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev
      }
    });

  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch customers'
    });
  }
});

// GET /customers/:id - Get specific customer details
app.get('/customers/:id', async (req, res) => {
  try {
    const customerId = parseInt(req.params.id);

    // Validate customer ID
    if (!customerId || customerId < 1) {
      return res.status(400).json({
        error: 'Invalid customer ID. Must be a positive integer.'
      });
    }

    // Get customer details with order statistics
    const customer = await runQuerySingle(`
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.age,
        u.gender,
        u.state,
        u.street_address,
        u.postal_code,
        u.city,
        u.country,
        u.latitude,
        u.longitude,
        u.traffic_source,
        u.created_at,
        COUNT(o.id) as total_orders,
        SUM(CASE WHEN o.status = 'Complete' THEN 1 ELSE 0 END) as completed_orders,
        SUM(CASE WHEN o.status = 'Cancelled' THEN 1 ELSE 0 END) as cancelled_orders,
        SUM(CASE WHEN o.status = 'Shipped' THEN 1 ELSE 0 END) as shipped_orders,
        SUM(CASE WHEN o.status = 'Processing' THEN 1 ELSE 0 END) as processing_orders,
        SUM(CASE WHEN o.status = 'Returned' THEN 1 ELSE 0 END) as returned_orders,
        SUM(o.num_of_items) as total_items_ordered
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      WHERE u.id = ?
      GROUP BY u.id
    `, [customerId]);

    if (!customer) {
      return res.status(404).json({
        error: 'Customer not found',
        message: `No customer found with ID ${customerId}`
      });
    }

    // Get recent orders for this customer
    const recentOrders = await runQuery(`
      SELECT 
        id,
        status,
        created_at,
        shipped_at,
        delivered_at,
        num_of_items
      FROM orders 
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 5
    `, [customerId]);

    res.json({
      data: {
        ...customer,
        recent_orders: recentOrders
      }
    });

  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch customer details'
    });
  }
});

// GET /customers/:id/orders - Get all orders for a specific customer (with pagination)
app.get('/customers/:id/orders', async (req, res) => {
  try {
    const customerId = parseInt(req.params.id);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    if (!customerId || customerId < 1) {
      return res.status(400).json({ error: 'Invalid customer ID. Must be a positive integer.' });
    }

    // Check if customer exists
    const customer = await runQuerySingle('SELECT id FROM users WHERE id = ?', [customerId]);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found', message: `No customer found with ID ${customerId}` });
    }

    // Get total order count for pagination
    const countResult = await runQuerySingle('SELECT COUNT(*) as total FROM orders WHERE user_id = ?', [customerId]);
    const total = countResult.total;
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    // Get orders for this customer
    const orders = await runQuery(
      `SELECT id, status, created_at, shipped_at, delivered_at, num_of_items FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [customerId, limit, offset]
    );

    res.json({
      data: orders,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev
      }
    });
  } catch (error) {
    console.error('Error fetching customer orders:', error);
    res.status(500).json({ error: 'Internal server error', message: 'Failed to fetch customer orders' });
  }
});

// GET /orders/:orderId - Get specific order details
app.get('/orders/:orderId', async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId);
    if (!orderId || orderId < 1) {
      return res.status(400).json({ error: 'Invalid order ID. Must be a positive integer.' });
    }

    // Get order details and join with customer
    const order = await runQuerySingle(
      `SELECT o.*, u.first_name, u.last_name, u.email, u.city, u.country FROM orders o LEFT JOIN users u ON o.user_id = u.id WHERE o.id = ?`,
      [orderId]
    );
    if (!order) {
      return res.status(404).json({ error: 'Order not found', message: `No order found with ID ${orderId}` });
    }

    res.json({ data: order });
  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({ error: 'Internal server error', message: 'Failed to fetch order details' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.originalUrl} not found`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: 'Something went wrong'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Customer API server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`👥 Customers: http://localhost:${PORT}/customers`);
  console.log(`👤 Customer details: http://localhost:${PORT}/customers/:id`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed.');
    }
    process.exit(0);
  });
}); 