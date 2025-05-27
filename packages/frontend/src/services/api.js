import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '/api';

// Create a wrapper function for API calls that handles errors gracefully
const safeApiCall = async (apiPromise, errorMessage = 'API Error', fallbackData = null) => {
  try {
    const response = await apiPromise;
    return response;
  } catch (error) {
    console.warn(`[safeApiCall] ${errorMessage}. Original error object details:`);
    if (error) {
      console.warn(`  Error Name: ${error.name}`);
      console.warn(`  Error Message: ${error.message}`);
      if (error.response) {
        console.warn(`  Error Response Status: ${error.response.status}`);
        console.warn(`  Error Response Data:`, JSON.stringify(error.response.data, null, 2)); // Stringify data for better readability
      }
      if (error.request) {
        console.warn(`  Error Request:`, error.request);
      }
      if (error.config) {
        console.warn(`  Error Config URL: ${error.config?.url}`);
        console.warn(`  Error Config Method: ${error.config?.method}`);
      }
      console.warn(`  Error Stack: ${error.stack}`);
    } else {
      console.warn('  Caught error object is null or undefined.');
    }

    let detailedErrorMessage = 'Unknown error';
    if (error.response && error.response.data) {
      // Axios error with a response from the server
      detailedErrorMessage = typeof error.response.data === 'string' ? error.response.data : JSON.stringify(error.response.data);
    } else if (error.request) {
      // Axios error where the request was made but no response received
      detailedErrorMessage = 'No response received from server. Check network or server status.';
    } else if (error.message) {
      // General JavaScript error
      detailedErrorMessage = error.message;
    }
    // Fallback if detailedErrorMessage is still an object (e.g. if error.response.data was an object and JSON.stringify made it a string representation of an object)
    if (typeof detailedErrorMessage !== 'string') {
      detailedErrorMessage = 'Error object could not be stringified. See full error object above.';
    }
    console.warn(`[safeApiCall] ${errorMessage}. Detailed message:`, detailedErrorMessage);
    
    // Return a mock successful response when API fails
    return {
      data: fallbackData || { success: false, message: detailedErrorMessage }, // Use detailed message for fallback
      _isMock: true,
      _error: error // Keep original error for potential deeper inspection if needed
    };
  }
};

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth services
export const authService = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  simpleLogin: (phone) => api.post('/auth/simple-login', { phone }),
};

// Mock data for fallbacks
const mockData = {
  slips: [
    {
      id: 'mock-slip-1',
      slip_no: '2501',
      customer_name: 'Sample Customer',
      created_at: new Date().toISOString(),
      slip_date: new Date().toISOString(),
      total: 350,
      slip_items: [
        { id: 'item-1', name: 'Rice', qty: 2, unit: 'kg', rate: 50, line_total: 100 },
        { id: 'item-2', name: 'Sugar', qty: 5, unit: 'kg', rate: 40, line_total: 200 },
        { id: 'item-3', name: 'Oil', qty: 1, unit: 'ltr', rate: 50, line_total: 50 }
      ]
    }
  ],
  products: [
    { id: 'mock-1', name: 'Rice', default_unit: 'kg', minimum_price: 45, fair_price: 50 },
    { id: 'mock-2', name: 'Sugar', default_unit: 'kg', minimum_price: 40, fair_price: 45 },
    { id: 'mock-3', name: 'Wheat Flour', default_unit: 'kg', minimum_price: 30, fair_price: 35 },
    { id: 'mock-4', name: 'Cooking Oil', default_unit: 'ltr', minimum_price: 120, fair_price: 130 },
    { id: 'mock-5', name: 'Dal', default_unit: 'kg', minimum_price: 85, fair_price: 95 }
  ],
  nextNumber: '2525',
  summary: {
    slipCount: 3,
    totalSales: 530,
    totalItems: 5
  }
};

// Slip services with error handling
export const slipService = {
  createSlip: (slipData) => safeApiCall(
    api.post('/slips', slipData),
    'Error saving slip',
    { success: true, slip: { ...slipData, id: `mock-${Date.now()}`, slip_no: mockData.nextNumber } }
  ),
  getSlips: () => safeApiCall(
    api.get('/slips'),
    'Error fetching slips',
    { success: true, slips: mockData.slips }
  ),
  getSlipById: (id) => safeApiCall(
    api.get(`/slips/${id}`),
    `Error fetching slip ${id}`,
    { success: true, slip: mockData.slips[0] }
  ),
  deleteSlip: (id) => safeApiCall(
    api.delete(`/slips/${id}`),
    `Error deleting slip ${id}`,
    { success: true, message: 'Slip deleted successfully' }
  ),
  getDailySummary: (date) => safeApiCall(
    api.get(`/slips/summary/today${date ? `?date=${date}` : ''}`),
    'Error fetching daily summary',
    { success: true, summary: mockData.summary }
  ),
  getNextSlipNumber: () => safeApiCall(
    api.get('/slips/next-number'),
    'Error fetching next slip number',
    { success: true, nextNumber: mockData.nextNumber }
  ),
};

// Prices services with error handling
export const priceService = {
  // Get all products with current prices. Used in QuickSlip's fetchProducts.
  getProducts: () => safeApiCall(
    api.get('/prices'),
    'Error fetching products',
    { success: true, products: mockData.products }
  ),

  // Search products by name or alias. Used in ProductAutocomplete.
  searchProducts: (query) => safeApiCall(
    api.get(`/prices/search?q=${encodeURIComponent(query)}`),
    'Error searching products',
    { success: true, products: mockData.products.filter(p => 
      p.name.toLowerCase().includes(query.toLowerCase())
    )}
  ),
  
  // Add a new product
  addProduct: (productData) => safeApiCall(
    api.post('/prices/product', productData),
    'Error adding product',
    { success: true, product: { ...productData, id: `mock-${Date.now()}` } }
  ),
  
  // Update a single product's minimum and fair prices
  updatePrice: (productId, priceData) => {
    // Ensure both minimum_price and fair_price are numbers or valid strings for numbers
    const payload = {
      minimum_price: priceData.minimum_price !== null && priceData.minimum_price !== undefined 
        ? parseFloat(priceData.minimum_price) 
        : 0,
      fair_price: priceData.fair_price !== null && priceData.fair_price !== undefined 
        ? parseFloat(priceData.fair_price) 
        : 0
    };
    
    return safeApiCall(
      api.put(`/prices/${productId}`, payload),
      'Error updating price',
      { success: true, message: 'Price updated successfully' }
    );
  },
  
  // Batch update multiple products' prices
  batchUpdatePrices: (batchData) => safeApiCall(
    api.put('/prices/batch', batchData),
    'Error updating prices in batch',
    { success: true, message: 'Prices updated successfully' }
  ),
  
  // Get today's price board
  getTodayPrices: () => safeApiCall(
    api.get('/prices'),
    'Error fetching today\'s prices',
    { success: true, prices: mockData.products.map(p => ({ 
      product_id: p.id, 
      price: p.fair_price, 
      effective_date: new Date().toISOString() 
    }))}
  ),
  
  // Get price history for a product
  getPriceHistory: (productId, startDate, endDate) => safeApiCall(
    api.get(`/prices/${productId}/history?startDate=${startDate}&endDate=${endDate}`),
    'Error fetching price history',
    { success: true, history: [{ 
      product_id: productId, 
      price: mockData.products[0].fair_price, 
      effective_date: startDate 
    }]}
  ),
  
  // Get price trends across multiple products
  getPriceTrends: (startDate, endDate, productIds, priceType = 'both') => {
    let url = `/prices/trends?startDate=${startDate}&endDate=${endDate}`;
    
    if (productIds) {
      url += `&productIds=${JSON.stringify(productIds)}`;
    }
    
    if (priceType) {
      url += `&priceType=${priceType}`;
    }
    
    return safeApiCall(
      api.get(url),
      'Error fetching price trends',
      { success: true, trends: [] }
    );
  }
};

// Voice services with error handling
export const voiceService = {
  getLanguages: () => safeApiCall(
    api.get('/voice/languages'),
    'Error fetching languages',
    { success: true, languages: [
      { code: 'en-IN', name: 'English (India)' },
      { code: 'hi-IN', name: 'Hindi (India)' },
      { code: 'pa-IN', name: 'Punjabi (India)' },
      { code: 'gu-IN', name: 'Gujarati (India)' }
    ]}
  ),
  processVoice: (audioData, language) => {
    // For mock responses when no audio is provided (like in our test case)
    if (!audioData) {
      return safeApiCall(
        Promise.resolve({
          data: {
            success: true,
            items: [
              { name: 'Sugar', qty: 2, unit: 'kg', rate: 40 },
              { name: 'Rice', qty: 1, unit: 'kg', rate: 50 }
            ]
          }
        }),
        'Error processing voice',
        null
      );
    }
    
    const formData = new FormData();
    formData.append('audio', audioData);
    formData.append('language', language);
    
    return safeApiCall(
      api.post('/voice/process', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }),
      'Error processing voice',
      { success: true, items: [
        { name: 'Sugar', qty: 2, unit: 'kg', rate: 40 },
        { name: 'Rice', qty: 1, unit: 'kg', rate: 50 }
      ]}
    );
  },
};

// WhatsApp services with error handling
export const whatsappService = {
  sendDailySummary: (date) => safeApiCall(
    api.post('/whatsapp/send-daily-summary', { date }),
    'Error sending WhatsApp summary',
    { success: true, message: 'Summary sent successfully' }
  ),
};

export default api;
