const http = require('http');

const BASE_URL = 'http://localhost:3000';

// Helper function to make HTTP requests
function makeRequest(path, method = 'GET') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            data: jsonData
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            data: data
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

// Test functions
async function testHealthEndpoint() {
  console.log('\n🏥 Testing Health Endpoint...');
  try {
    const response = await makeRequest('/health');
    console.log(`Status: ${response.statusCode}`);
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function testCustomersEndpoint() {
  console.log('\n👥 Testing Customers List Endpoint...');
  try {
    const response = await makeRequest('/customers?page=1&limit=5');
    console.log(`Status: ${response.statusCode}`);
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function testCustomerDetailsEndpoint() {
  console.log('\n👤 Testing Customer Details Endpoint...');
  try {
    const response = await makeRequest('/customers/1');
    console.log(`Status: ${response.statusCode}`);
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function testCustomerNotFound() {
  console.log('\n❌ Testing Customer Not Found...');
  try {
    const response = await makeRequest('/customers/999999');
    console.log(`Status: ${response.statusCode}`);
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function testInvalidCustomerId() {
  console.log('\n⚠️ Testing Invalid Customer ID...');
  try {
    const response = await makeRequest('/customers/abc');
    console.log(`Status: ${response.statusCode}`);
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function testPagination() {
  console.log('\n📄 Testing Pagination...');
  try {
    const response = await makeRequest('/customers?page=2&limit=3');
    console.log(`Status: ${response.statusCode}`);
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function testCustomerOrdersEndpoint() {
  console.log('\n📦 Testing Customer Orders Endpoint...');
  try {
    const response = await makeRequest('/customers/1/orders?page=1&limit=3');
    console.log(`Status: ${response.statusCode}`);
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function testCustomerOrdersNotFound() {
  console.log('\n❌ Testing Customer Orders Not Found...');
  try {
    const response = await makeRequest('/customers/999999/orders');
    console.log(`Status: ${response.statusCode}`);
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function testCustomerOrdersInvalidId() {
  console.log('\n⚠️ Testing Customer Orders Invalid ID...');
  try {
    const response = await makeRequest('/customers/abc/orders');
    console.log(`Status: ${response.statusCode}`);
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function testOrderDetailsEndpoint() {
  console.log('\n📄 Testing Order Details Endpoint...');
  try {
    // Try to get the first order for customer 1
    const ordersResp = await makeRequest('/customers/1/orders?limit=1');
    let orderId = 1;
    if (ordersResp.statusCode === 200 && Array.isArray(ordersResp.data)) {
      if (ordersResp.data.length > 0) {
        orderId = ordersResp.data[0].id;
      }
    } else if (ordersResp.statusCode === 200 && ordersResp.data.data && ordersResp.data.data.length > 0) {
      orderId = ordersResp.data.data[0].id;
    }
    const response = await makeRequest(`/orders/${orderId}`);
    console.log(`Status: ${response.statusCode}`);
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function testOrderDetailsNotFound() {
  console.log('\n❌ Testing Order Details Not Found...');
  try {
    const response = await makeRequest('/orders/999999');
    console.log(`Status: ${response.statusCode}`);
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function testOrderDetailsInvalidId() {
  console.log('\n⚠️ Testing Order Details Invalid ID...');
  try {
    const response = await makeRequest('/orders/abc');
    console.log(`Status: ${response.statusCode}`);
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run all tests
async function runTests() {
  console.log('🚀 Starting API Tests...');
  
  await testHealthEndpoint();
  await testCustomersEndpoint();
  await testCustomerDetailsEndpoint();
  await testCustomerNotFound();
  await testInvalidCustomerId();
  await testPagination();

  // Milestone 3 tests
  await testCustomerOrdersEndpoint();
  await testCustomerOrdersNotFound();
  await testCustomerOrdersInvalidId();
  await testOrderDetailsEndpoint();
  await testOrderDetailsNotFound();
  await testOrderDetailsInvalidId();
  
  console.log('\n✅ All tests completed!');
}

// Check if server is running first
async function checkServer() {
  try {
    await makeRequest('/health');
    console.log('✅ Server is running!');
    await runTests();
  } catch (error) {
    console.error('❌ Server is not running. Please start the server with: node server.js');
    console.error('Error:', error.message);
  }
}

checkServer(); 