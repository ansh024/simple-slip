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
  // Get all products with current prices using the product_prices view
  const { data: products, error } = await supabase
    .from('product_prices')
    .select('*')
    .order('name');
    
  if (error) {
    throw handleDatabaseError(error, 'Get all products with prices');
  }
  
  res.json({
    success: true,
    count: products.length,
    products
  });
});

/**
 * @desc    Update a single product price
 * @route   PUT /api/prices/:productId
 * @access  Private
 */
exports.updatePrice = catchAsync(async (req, res) => {
  const { productId } = req.params;
  const { minimum_price, fair_price, notes } = req.body;
  
  // Validate prices
  if (parseFloat(minimum_price) > parseFloat(fair_price)) {
    throw new AppError('Minimum price cannot be greater than fair price', 400);
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
  
  // Update current price - the trigger will handle adding to history
  const { data: updatedPrice, error: priceError } = await supabase
    .from('current_prices')
    .upsert({
      product_id: productId,
      minimum_price,
      fair_price,
      last_updated: new Date().toISOString()
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
      last_updated: updatedPrice.last_updated
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
  
  // Format data for batch upsert
  const updates = priceUpdates.map(update => ({
    product_id: update.productId,
    minimum_price: update.minimum_price,
    fair_price: update.fair_price,
    last_updated: new Date().toISOString()
  }));
  
  // Batch update current prices
  const { data: updatedPrices, error } = await supabase
    .from('current_prices')
    .upsert(updates)
    .select();
    
  if (error) {
    throw handleDatabaseError(error, 'Batch update product prices');
  }
  
  res.json({
    success: true,
    message: `Updated prices for ${updatedPrices.length} products`,
    updatedPrices
  });
});

/**
 * @desc    Get price history for a product
 * @route   GET /api/prices/:productId/history
 * @access  Private
 */
exports.getPriceHistory = catchAsync(async (req, res) => {
  const { productId } = req.params;
  const { startDate, endDate } = req.query;
  
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
    .from('price_history')
    .select('*')
    .eq('product_id', productId)
    .order('effective_from', { ascending: false });
  
  // Add date filters if provided
  if (startDate) {
    query = query.gte('effective_from', startDate);
  }
  
  if (endDate) {
    query = query.lte('effective_from', endDate);
  }
  
  const { data: priceHistory, error: historyError } = await query;
  
  if (historyError) {
    throw handleDatabaseError(historyError, 'Get product price history');
  }
  
  res.json({
    success: true,
    product,
    priceHistory
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
      .from('current_prices')
      .insert({
        product_id: nextId,
        minimum_price: min_price,
        fair_price: max_price,
        last_updated: new Date().toISOString()
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
  const { query } = req.query;
  
  if (!query) {
    throw new AppError('Search query is required', 400);
  }
  
  const normalizedQuery = query.toLowerCase().trim();
  
  // Execute search with different match types
  // 1. Exact match on name
  const { data: exactMatches, error: exactMatchError } = await supabase
    .from('product_prices')
    .select('*')
    .ilike('name', normalizedQuery);
    
  if (exactMatchError) {
    throw handleDatabaseError(exactMatchError, 'Search products - exact match');
  }
  
  // 2. Partial match on name (contains)
  const { data: partialMatches, error: partialMatchError } = await supabase
    .from('product_prices')
    .select('*')
    .ilike('name', `%${normalizedQuery}%`)
    .not('name', 'ilike', normalizedQuery); // Exclude exact matches
    
  if (partialMatchError) {
    throw handleDatabaseError(partialMatchError, 'Search products - partial match');
  }
  
  // 3. Match on aliases (requires raw SQL with Postgres array operators)
  // This is more complex and may require a custom function or procedure in Supabase
  
  // For now, we'll use a simpler approach with the existing data structure
  const { data: productsWithAliases, error: aliasesError } = await supabase
    .from('product_prices')
    .select('*');
    
  if (aliasesError) {
    throw handleDatabaseError(aliasesError, 'Search products - get all for alias check');
  }
  
  // Filter products where an alias contains the query
  const aliasMatches = productsWithAliases.filter(product => {
    if (!product.aliases || product.aliases.length === 0) return false;
    
    // Check if any alias contains the query
    return product.aliases.some(alias => 
      alias.toLowerCase().includes(normalizedQuery)
    );
  }).map(product => ({
    ...product,
    match_type: 'alias'
  }));
  
  // Combine results with match type
  const exactWithType = exactMatches.map(p => ({ ...p, match_type: 'exact' }));
  const partialWithType = partialMatches.map(p => ({ ...p, match_type: 'partial' }));
  
  // Combine all results, with exact matches first, then alias matches, then partial matches
  const allResults = [
    ...exactWithType,
    ...aliasMatches.filter(a => !exactWithType.some(e => e.id === a.id)), // Exclude duplicates
    ...partialWithType.filter(p => !exactWithType.some(e => e.id === p.id) && 
                                  !aliasMatches.some(a => a.id === p.id)) // Exclude duplicates
  ];
  
  res.json({
    success: true,
    count: allResults.length,
    products: allResults
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
 * @desc    Generate price trend report for specified period
 * @route   GET /api/prices/trends
 * @access  Private
 */
exports.getPriceTrends = catchAsync(async (req, res) => {
  const { startDate, endDate, productIds, priceType = 'both' } = req.query;
  
  if (!startDate || !endDate) {
    throw new AppError('Start date and end date are required', 400);
  }
  
  // Validate price type
  if (!['minimum', 'fair', 'both'].includes(priceType)) {
    throw new AppError('Invalid price type. Must be one of: minimum, fair, both', 400);
  }
  
  // Parse product IDs if provided
  let productIdArray = [];
  if (productIds) {
    try {
      productIdArray = JSON.parse(productIds);
    } catch (e) {
      throw new AppError('Invalid product IDs format', 400);
    }
  }
  
  // Build query for price history
  let query = supabase
    .from('price_history')
    .select('id, product_id, minimum_price, fair_price, effective_from, effective_to')
    .gte('effective_from', startDate)
    .lte('effective_from', endDate)
    .order('effective_from', { ascending: true });
  
  // Filter by product IDs if provided
  if (productIdArray.length > 0) {
    query = query.in('product_id', productIdArray);
  }
  
  const { data: priceChanges, error: historyError } = await query;
  
  if (historyError) {
    throw handleDatabaseError(historyError, 'Get price trends');
  }
  
  // Get product details
  const uniqueProductIds = [...new Set(priceChanges.map(p => p.product_id))];
  
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, name, default_unit')
    .in('id', uniqueProductIds);
    
  if (productsError) {
    throw handleDatabaseError(productsError, 'Get products for trends');
  }
  
  // Create a map for easy lookup
  const productMap = {};
  products.forEach(p => {
    productMap[p.id] = p;
  });
  
  // Format price changes with product details
  const formattedChanges = priceChanges.map(change => ({
    id: change.id,
    product_id: change.product_id,
    product_name: productMap[change.product_id]?.name || 'Unknown Product',
    unit: productMap[change.product_id]?.default_unit || 'unit',
    minimum_price: change.minimum_price,
    fair_price: change.fair_price,
    date: change.effective_from,
    end_date: change.effective_to
  }));
  
  // Group by product
  const trendsByProduct = {};
  
  formattedChanges.forEach(change => {
    if (!trendsByProduct[change.product_id]) {
      trendsByProduct[change.product_id] = {
        product_id: change.product_id,
        product_name: change.product_name,
        unit: change.unit,
        minimum_price_points: [],
        fair_price_points: []
      };
    }
    
    // Add data points based on requested price type
    if (priceType === 'both' || priceType === 'minimum') {
      trendsByProduct[change.product_id].minimum_price_points.push({
        price: change.minimum_price,
        date: change.date,
        end_date: change.end_date
      });
    }
    
    if (priceType === 'both' || priceType === 'fair') {
      trendsByProduct[change.product_id].fair_price_points.push({
        price: change.fair_price,
        date: change.date,
        end_date: change.end_date
      });
    }
  });
  
  res.json({
    success: true,
    start_date: startDate,
    end_date: endDate,
    price_type: priceType,
    products_count: Object.keys(trendsByProduct).length,
    trends: Object.values(trendsByProduct)
  });
});

module.exports = exports;
