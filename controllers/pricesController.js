/**
 * PRICES CONTROLLER
 * 
 * This controller handles all operations related to products and pricing:
 * - Getting all products with current prices
 * - Updating product prices (single and batch updates)
 * - Getting price history for products
 * - Adding new products
 * - Searching for products
 * 
 * It uses the enhanced price management system with current_prices and price_history tables.
 */

const { supabase } = require('../database/supabase');
const { catchAsync, AppError, handleDatabaseError } = require('../utils/errorHandler');

/**
 * @desc    Get all products with current prices
 * @route   GET /api/prices
 * @access  Private
 */
exports.getAllProducts = catchAsync(async (req, res) => {
  // Get all products
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('*')
    .order('name');
    
  if (productsError) {
    throw handleDatabaseError(productsError, 'Get all products');
  }
  
  // Get latest prices for each product
  const productIds = products.map(product => product.id);
  
  const { data: priceData, error: pricesError } = await supabase
    .from('price_board')
    .select('*')
    .in('product_id', productIds)
    .order('effective_date', { ascending: false });
    
  if (pricesError) {
    throw handleDatabaseError(pricesError, 'Get product prices');
  }
  
  // Map prices to products - use the current price as both minimum and fair price
  const productsWithPrices = products.map(product => {
    // Find the most recent price for this product
    const latestPrice = priceData
      .filter(p => p.product_id === product.id)
      .sort((a, b) => new Date(b.effective_date) - new Date(a.effective_date))[0];
      
    return {
      ...product,
      minimum_price: latestPrice ? latestPrice.price : null,
      fair_price: latestPrice ? latestPrice.price : null,
      last_updated: latestPrice ? latestPrice.effective_date : null
    };
  });
  
  res.json({
    success: true,
    count: productsWithPrices.length,
    products: productsWithPrices
  });
});

/**
 * @desc    Update a single product price
 * @route   PUT /api/prices/:productId
 * @access  Private
 */
exports.updatePrice = catchAsync(async (req, res) => {
  const { productId } = req.params;
  let { minimum_price, fair_price, notes } = req.body;
  
  // Convert to numbers and ensure they're not null/undefined
  minimum_price = minimum_price !== null && minimum_price !== undefined 
    ? parseFloat(minimum_price) 
    : 0;
  fair_price = fair_price !== null && fair_price !== undefined 
    ? parseFloat(fair_price) 
    : minimum_price; // Default to minimum_price if not provided
  
  // Validate prices
  if (minimum_price > fair_price) {
    throw new AppError('Minimum price cannot be greater than fair price', 400);
  }
  
  // For now, we'll use the fair_price as the single price value for price_board table
  // In a production scenario, we would perform a proper migration to new tables
  const price = fair_price;
  
  // Verify product exists
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single();
    
  if (productError) {
    throw handleDatabaseError(productError, 'Verify product exists');
  }
  
  if (!product) {
    throw new AppError('Product not found', 404);
  }
  
  // Insert a new price record in price_board
  const { data: updatedPrice, error: priceError } = await supabase
    .from('price_board')
    .insert({
      product_id: productId,
      price,
      effective_date: new Date().toISOString()
    })
    .select()
    .single();
    
  if (priceError) {
    throw handleDatabaseError(priceError, 'Update product price');
  }
  
  res.json({
    success: true,
    message: `Prices updated for ${product.name}`,
    product: {
      ...product,
      minimum_price,
      fair_price,
      last_updated: updatedPrice.effective_date
    }
  });
});

/**
 * @desc    Batch update multiple product prices
 * @route   PUT /api/prices/batch
 * @access  Private
 */
exports.batchUpdatePrices = catchAsync(async (req, res) => {
  const { priceUpdates } = req.body;
  
  if (!priceUpdates || !Array.isArray(priceUpdates) || priceUpdates.length === 0) {
    throw new AppError('No price updates provided', 400);
  }
  
  // Validate all prices
  for (const update of priceUpdates) {
    if (parseFloat(update.minimum_price) > parseFloat(update.fair_price)) {
      throw new AppError(`Invalid prices for product ID ${update.productId}: Minimum price cannot be greater than fair price`, 400);
    }
  }
  
  // For each price update, insert a new record into price_board
  // Using the fair_price as the single price value
  const effectiveDate = new Date().toISOString();
  const batchInserts = priceUpdates.map(update => ({
    product_id: update.productId,
    price: update.fair_price,
    effective_date: effectiveDate
  }));
  
  // Batch insert new price records
  const { data: updatedPrices, error } = await supabase
    .from('price_board')
    .insert(batchInserts)
    .select();
    
  if (error) {
    throw handleDatabaseError(error, 'Batch update product prices');
  }
  
  // Format the response to include both minimum_price and fair_price
  const formattedUpdates = updatedPrices.map((update, index) => ({
    ...update,
    minimum_price: priceUpdates[index].minimum_price,
    fair_price: priceUpdates[index].fair_price
  }));
  
  res.json({
    success: true,
    message: `Updated prices for ${updatedPrices.length} products`,
    updatedPrices: formattedUpdates
  });
});

/**
 * @desc    Get price history for a product
 * @route   GET /api/prices/:productId/history
 * @access  Private
 */
exports.getPriceHistory = catchAsync(async (req, res) => {
  const { productId } = req.params;
  let { startDate, endDate } = req.query;
  
  // Set default dates if not provided
  if (!startDate) {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    startDate = threeMonthsAgo.toISOString().split('T')[0];
  }
  
  if (!endDate) {
    endDate = new Date().toISOString().split('T')[0];
  }
  
  // Verify product exists
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single();
    
  if (productError) {
    throw handleDatabaseError(productError, 'Verify product exists');
  }
  
  if (!product) {
    throw new AppError('Product not found', 404);
  }
  
  // Build query for price history
  let query = supabase
    .from('price_board')
    .select('*')
    .eq('product_id', productId)
    .order('effective_date', { ascending: false });
  
  // Apply date filters if provided
  if (startDate) {
    query = query.gte('effective_date', startDate);
  }
  
  if (endDate) {
    query = query.lte('effective_date', new Date(new Date(endDate).getTime() + 24 * 60 * 60 * 1000).toISOString());
  }
  
  const { data: priceHistory, error: historyError } = await query;
  
  if (historyError) {
    throw handleDatabaseError(historyError, 'Get product price history');
  }
  
  // Format price history with single price mapped to both min and fair
  const formattedHistory = priceHistory.map(history => ({
    date: history.effective_date,
    minimum_price: history.price,
    fair_price: history.price,
    duration: 'From ' + new Date(history.effective_date).toLocaleDateString()
  }));
  
  res.json({
    success: true,
    product,
    priceHistory: formattedHistory
  });
});

/**
 * @desc    Add a new product
 * @route   POST /api/prices/product
 * @access  Private
 */
exports.addProduct = catchAsync(async (req, res) => {
  const { name, default_unit = 'kg', aliases = [], minimum_price, fair_price } = req.body;
  
  // Validate prices if both are provided
  if (minimum_price && fair_price && parseFloat(minimum_price) > parseFloat(fair_price)) {
    throw new AppError('Minimum price cannot be greater than fair price', 400);
  }
  
  // If only one price is provided, use it for both
  const min_price = minimum_price || fair_price;
  const max_price = fair_price || minimum_price;
  
  // Check if product already exists
  const { data: existingProducts, error: checkError } = await supabase
    .from('products')
    .select('*')
    .ilike('name', name);
    
  if (checkError) {
    throw handleDatabaseError(checkError, 'Check existing product');
  }
  
  // Check if any products with the same name already exist
  if (existingProducts && existingProducts.length > 0) {
    throw new AppError('Product with this name already exists', 400);
  }
  
  // Get the next available ID (max ID + 1)
  const { data: maxIdResult, error: maxIdError } = await supabase
    .from('products')
    .select('id')
    .order('id', { ascending: false })
    .limit(1);
    
  if (maxIdError) {
    throw handleDatabaseError(maxIdError, 'Get max product ID');
  }
  
  const nextId = maxIdResult && maxIdResult.length > 0 ? maxIdResult[0].id + 1 : 1;
  
  // Start a transaction for adding product and price
  // Since Supabase doesn't support transactions directly in the JS client,
  // we'll do this as separate operations but handle errors properly
  
  // Step 1: Insert the product
  const { data: newProduct, error: productError } = await supabase
    .from('products')
    .insert({
      id: nextId,
      name,
      default_unit,
      aliases
    })
    .select()
    .single();
    
  if (productError) {
    throw handleDatabaseError(productError, 'Create new product');
  }
  
  // Step 2: Insert the prices if provided
  if (min_price && max_price) {
    const { error: priceError } = await supabase
      .from('price_board')
      .insert({
        product_id: nextId,
        price: max_price,
        effective_date: new Date().toISOString()
      });
      
    if (priceError) {
      // If price insert fails, attempt to clean up the product
      await supabase.from('products').delete().eq('id', nextId);
      throw handleDatabaseError(priceError, 'Add prices for new product');
    }
  }
  
  res.status(201).json({
    success: true,
    message: 'Product added successfully',
    product: {
      ...newProduct,
      minimum_price: min_price || null,
      fair_price: max_price || null
    }
  });
});

/**
 * @desc    Search for products with smart matching for names and aliases
 * @route   GET /api/prices/search
 * @access  Private
 */
exports.searchProducts = catchAsync(async (req, res) => {
  const query = req.query.q; // Correctly get 'q' from query parameters
  // const { q: query } = req.query; // Alternative way to do the same
  console.log(`[searchProducts] Received query parameter 'q': "${query}"`);

  if (!query) {
    console.log('[searchProducts] Query is missing, sending 400.');
    throw new AppError('Search query is required', 400);
  }
  
  const normalizedQuery = query.toLowerCase().trim();
  console.log(`[searchProducts] Value of 'query' variable after potential normalization: "${normalizedQuery}"`);

  // Search for products in the 'products' table
  const { data: foundProducts, error: productSearchError } = await supabase
    .from('products')
    .select('*')
    .ilike('name', `%${normalizedQuery}%`); // Case-insensitive contains search
    
  if (productSearchError) {
    console.error('[searchProducts] Error during product search:', productSearchError);
    throw handleDatabaseError(productSearchError, 'Search products');
  }

  console.log(`[searchProducts] Found ${foundProducts ? foundProducts.length : 0} products initially.`);

  if (!foundProducts || foundProducts.length === 0) {
    console.log('[searchProducts] No products found, sending empty array.');
    return res.json({
      success: true,
      count: 0,
      products: []
    });
  }
  
  // Get latest prices for the found products from 'price_board'
  const productIds = foundProducts.map(product => product.id);
  console.log(`[searchProducts] Fetching prices for product IDs:`, productIds);
  
  const { data: priceData, error: pricesError } = await supabase
    .from('price_board')
    .select('*')
    .in('product_id', productIds)
    .order('effective_date', { ascending: false });
    
  if (pricesError) {
    console.error('[searchProducts] Error fetching prices for search results:', pricesError);
    // Continue, products will have null prices. priceData will be undefined if an error occurred.
  } else {
    console.log(`[searchProducts] Fetched ${priceData ? priceData.length : 0} price entries.`);
  }
  
  // Map prices to products
  const productsWithPrices = foundProducts.map(product => {
    const latestPriceEntry = priceData // priceData could be undefined if pricesError occurred
      ? priceData
          .filter(p => p.product_id === product.id)
          .sort((a, b) => new Date(b.effective_date) - new Date(a.effective_date))[0]
      : null;
      
    return {
      ...product,
      minimum_price: latestPriceEntry ? latestPriceEntry.price : null,
      fair_price: latestPriceEntry ? latestPriceEntry.price : null, 
      last_updated: latestPriceEntry ? latestPriceEntry.effective_date : null,
      match_type: 'name_match' 
    };
  });
  
  console.log(`[searchProducts] Sending ${productsWithPrices.length} products with prices. First product (if any):`, productsWithPrices[0]);
  res.json({
    success: true,
    count: productsWithPrices.length,
    products: productsWithPrices
  });
});

/**
 * @desc    Get today's price board (all products with current prices)
 * @route   GET /api/prices/today
 * @access  Private
 */
exports.getTodayPrices = catchAsync(async (req, res) => {
  // Get all products with current prices using the product_prices view
  const { data: products, error } = await supabase
    .from('product_prices')
    .select('*')
    .order('name');
    
  if (error) {
    throw handleDatabaseError(error, 'Get today\'s price board');
  }
  
  // Format for display
  const formattedProducts = products.map(product => ({
    id: product.id,
    name: product.name,
    default_unit: product.default_unit,
    minimum_price: product.minimum_price || null,
    fair_price: product.fair_price || null,
    last_updated: product.last_updated
  }));
  
  res.json({
    success: true,
    count: formattedProducts.length,
    date: new Date().toISOString().split('T')[0],
    products: formattedProducts
  });
});

/**
 * @desc    Get price trends for multiple products
 * @route   GET /api/prices/trends
 * @access  Private
 */
exports.getPriceTrends = catchAsync(async (req, res) => {
  const { startDate, endDate, productIds } = req.query;
  
  // Default dates if not provided
  const defaultStartDate = new Date();
  defaultStartDate.setMonth(defaultStartDate.getMonth() - 3);
  const defaultEndDate = new Date();
  
  const effectiveStartDate = startDate || defaultStartDate.toISOString().split('T')[0];
  const effectiveEndDate = endDate || defaultEndDate.toISOString().split('T')[0];
  
  let productQuery = [];
  
  // Parse productIds if provided
  if (productIds) {
    try {
      productQuery = JSON.parse(productIds);
      if (!Array.isArray(productQuery)) {
        productQuery = [productQuery];
      }
    } catch (error) {
      throw new AppError('Invalid product IDs format. Must be a JSON array', 400);
    }
  }
  
  // Get products information
  let products;
  
  if (productQuery.length > 0) {
    const { data, error } = await supabase
      .from('products')
      .select('id, name')
      .in('id', productQuery);
      
    if (error) {
      throw handleDatabaseError(error, 'Get products for trends');
    }
    
    products = data;
  } else {
    // If no products specified, get the top 5 products
    const { data, error } = await supabase
      .from('products')
      .select('id, name')
      .limit(5);
      
    if (error) {
      throw handleDatabaseError(error, 'Get products for trends');
    }
    
    products = data;
  }
  
  // Get price history for all relevant products
  const productTrends = [];
  
  for (const product of products) {
    const { data: history, error } = await supabase
      .from('price_board')
      .select('*')
      .eq('product_id', product.id)
      .gte('effective_date', effectiveStartDate)
      .lte('effective_date', new Date(new Date(effectiveEndDate).getTime() + 24 * 60 * 60 * 1000).toISOString())
      .order('effective_date', { ascending: true });
      
    if (error) {
      throw handleDatabaseError(error, `Get price history for product ${product.id}`);
    }
    
    // Map the single price to both minimum and fair price for trend data
    const priceTrends = history.map(h => ({
      date: h.effective_date,
      price: h.price
    }));
    
    productTrends.push({
      productId: product.id,
      productName: product.name,
      trends: {
        minimum_price: priceTrends,
        fair_price: priceTrends
      }
    });
  }
  
  // Determine interval based on date range
  const startDateTime = new Date(effectiveStartDate);
  const endDateTime = new Date(effectiveEndDate);
  const dayDiff = Math.round((endDateTime - startDateTime) / (1000 * 60 * 60 * 24));
  
  let interval;
  if (dayDiff <= 30) {
    interval = 'day';
  } else if (dayDiff <= 90) {
    interval = 'week';
  } else {
    interval = 'month';
  }
  
  res.json({
    success: true,
    interval,
    startDate: effectiveStartDate,
    endDate: effectiveEndDate,
    productTrends
  });
});

module.exports = exports;
