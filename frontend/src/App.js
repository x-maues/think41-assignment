import React, { useState, useEffect } from 'react';
import CustomerList from './components/CustomerList';
import SearchBar from './components/SearchBar';
import Header from './components/Header';

function App() {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [totalActiveCustomers, setTotalActiveCustomers] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);

  const API_BASE_URL = 'http://localhost:3000';

  // Fetch customers from API
  const fetchCustomers = async (page = 1, limit = 20) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/customers?page=${page}&limit=${limit}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setCustomers(data.data);
      setFilteredCustomers(data.data);
      setTotalPages(data.pagination.totalPages);
      setCurrentPage(page);
      setTotalCustomers(data.pagination.total);
      
      // Calculate total active customers and orders from current data
      const activeCount = data.data.filter(c => c.order_count > 0).length;
      const ordersCount = data.data.reduce((sum, c) => sum + c.order_count, 0);
      setTotalActiveCustomers(activeCount);
      setTotalOrders(ordersCount);
    } catch (err) {
      setError('Failed to fetch customers. Please check if the API server is running.');
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  // Search functionality
  const handleSearch = (term) => {
    setSearchTerm(term);
    if (!term.trim()) {
      setFilteredCustomers(customers);
    } else {
      const filtered = customers.filter(customer => 
        customer.first_name.toLowerCase().includes(term.toLowerCase()) ||
        customer.last_name.toLowerCase().includes(term.toLowerCase()) ||
        customer.email.toLowerCase().includes(term.toLowerCase())
      );
      setFilteredCustomers(filtered);
    }
  };

  // Handle pagination
  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchCustomers(page);
  };

  // Initial data fetch
  useEffect(() => {
    fetchCustomers();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="text-red-500 text-center">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h2 className="text-xl font-semibold mb-2">Connection Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={() => fetchCustomers()} 
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <SearchBar onSearch={handleSearch} searchTerm={searchTerm} />
          
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <CustomerList 
              customers={filteredCustomers}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              searchTerm={searchTerm}
              totalCustomers={totalCustomers}
              totalActiveCustomers={totalActiveCustomers}
              totalOrders={totalOrders}
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
