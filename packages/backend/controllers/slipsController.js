/**
 * SLIPS CONTROLLER
 * 
 * This controller handles all operations related to sales slips:
 * - Creating new slips
 * - Retrieving single slip or all slips
 * - Getting daily summary
 * 
 * It uses Supabase for database operations.
 */

const { supabase } = require('../database/supabase');
const { catchAsync, AppError, handleDatabaseError } = require('../utils/errorHandler');

/**
 * @desc    Create a new slip
 * @route   POST /api/slips
 * @access  Private
 */
exports.createSlip = catchAsync(async (req, res) => {
  const { customerName, items, discount = 0, gstRequired = false, shopId = 1 } = req.body;
  
  // Calculate totals
  let subtotal = 0;
  const slipItems = items.map(item => {
    const lineTotal = item.qty * item.rate;
    subtotal += lineTotal;
    return {
      ...item,
      line_total: lineTotal
    };
  });
  
  const total = subtotal - discount;
  
  // Create slip
  const { data: slip, error: slipError } = await supabase
    .from('slips')
    .insert({
      shop_id: shopId,
      customer_name: customerName,
      gst_required: gstRequired,
      subtotal,
      discount,
      total,
      slip_date: new Date().toISOString().split('T')[0] // Current date in YYYY-MM-DD format
    })
    .select()
    .single();
  
  if (slipError) {
    throw handleDatabaseError(slipError, 'Create slip');
  }
  
  // Add items to slip
  const slipItemsData = slipItems.map(item => ({
    slip_id: slip.id,
    product_id: item.product_id,
    qty: item.qty,
    unit: item.unit,
    rate: item.rate,
    line_total: item.line_total
  }));
  
  const { error: itemsError } = await supabase
    .from('slip_items')
    .insert(slipItemsData);
  
  if (itemsError) {
    throw handleDatabaseError(itemsError, 'Add slip items');
  }
  
  // Get full product details for items
  const productIds = items.map(item => item.product_id);
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('*')
    .in('id', productIds);
  
  if (productsError) {
    throw handleDatabaseError(productsError, 'Get products for slip');
  }
  
  // Map product details to slip items
  const slipItemsWithProducts = slipItems.map(item => {
    const product = products.find(p => p.id === item.product_id);
    return {
      ...item,
      product_name: product ? product.name : 'Unknown Product',
      default_unit: product ? product.default_unit : 'unit'
    };
  });
  
  res.status(201).json({
    success: true,
    slip: {
      ...slip,
      items: slipItemsWithProducts
    }
  });
});

/**
 * @desc    Get all slips with pagination
 * @route   GET /api/slips
 * @access  Private
 */
exports.getAllSlips = catchAsync(async (req, res) => {
  const { page = 1, limit = 10, date, customer } = req.query;
  const offset = (page - 1) * limit;
  
  // Build query
  let query = supabase
    .from('slips')
    .select('*, slip_items(*)');
  
  // Add filters if provided
  if (date) {
    query = query.eq('slip_date', date);
  }
  
  if (customer) {
    query = query.ilike('customer_name', `%${customer}%`);
  }
  
  // Execute query with pagination
  const { data: slips, error, count } = await query
    .order('slip_timestamp', { ascending: false })
    .range(offset, offset + limit - 1)
    .limit(limit);
  
  if (error) {
    throw handleDatabaseError(error, 'Get all slips');
  }
  
  // Get total count for pagination
  const { count: totalCount, error: countError } = await supabase
    .from('slips')
    .select('*', { count: 'exact' });
  
  if (countError) {
    throw handleDatabaseError(countError, 'Count slips');
  }
  
  res.json({
    success: true,
    count: totalCount,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(totalCount / limit),
    slips
  });
});

/**
 * @desc    Get a single slip by ID
 * @route   GET /api/slips/:id
 * @access  Private
 */
exports.getSlipById = catchAsync(async (req, res) => {
  const { id } = req.params;
  
  // Get slip with items
  const { data: slip, error } = await supabase
    .from('slips')
    .select(`
      *,
      slip_items(
        *,
        products:product_id(name, default_unit)
      )
    `)
    .eq('id', id)
    .single();
  
  if (error) {
    throw handleDatabaseError(error, 'Get slip by ID');
  }
  
  if (!slip) {
    throw new AppError('Slip not found', 404);
  }
  
  res.json({
    success: true,
    slip
  });
});

/**
 * @desc    Delete a slip by ID
 * @route   DELETE /api/slips/:id
 * @access  Private
 */
exports.deleteSlip = catchAsync(async (req, res) => {
  const { id } = req.params;
  
  // First check if slip exists
  const { data: slip, error: checkError } = await supabase
    .from('slips')
    .select('id')
    .eq('id', id)
    .single();
  
  if (checkError || !slip) {
    throw new AppError('Slip not found', 404);
  }
  
  // Delete associated slip items first
  const { error: itemsDeleteError } = await supabase
    .from('slip_items')
    .delete()
    .eq('slip_id', id);
  
  if (itemsDeleteError) {
    throw handleDatabaseError(itemsDeleteError, 'Delete slip items');
  }
  
  // Then delete the slip itself
  const { error: slipDeleteError } = await supabase
    .from('slips')
    .delete()
    .eq('id', id);
  
  if (slipDeleteError) {
    throw handleDatabaseError(slipDeleteError, 'Delete slip');
  }
  
  res.json({
    success: true,
    message: 'Slip deleted successfully'
  });
});

/**
 * @desc    Get today's sales summary
 * @route   GET /api/slips/summary/today
 * @access  Private
 */
exports.getTodaySummary = catchAsync(async (req, res) => {
  try {
    // Get date from query params or use today
    const requestedDate = req.query.date;
    const today = requestedDate || new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
    
    // Get all slips for the requested date with their items
    const { data: slips, error } = await supabase
      .from('slips')
      .select('*, slip_items(*)')
      .eq('slip_date', today);
    
    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Database error when fetching slips',
        details: error.message
      });
    }
    
    // Calculate totals with safeguards
    const totalSales = slips.reduce((sum, slip) => sum + (slip.total || 0), 0);
    const slipCount = slips.length;
    let totalItems = 0;
    
    // Count total items with null checks
    slips.forEach(slip => {
      if (slip.slip_items && Array.isArray(slip.slip_items)) {
        totalItems += slip.slip_items.length;
      }
    });
    
    res.json({
      success: true,
      summary: {
        date: today,
        slipCount,
        totalSales,
        totalItems,
        slips
      }
    });
  } catch (error) {
    console.error('Error in getTodaySummary:', error);
    res.status(500).json({
      success: false,
      error: 'Server error when generating summary',
      message: error.message
    });
  }
});

// PDF functionality removed to simplify the application

/**
 * @desc    Get the next available slip number
 * @route   GET /api/slips/next-number
 * @access  Private
 */
exports.getNextSlipNumber = catchAsync(async (req, res) => {
  // Get the highest slip number from the database
  const { data, error } = await supabase
    .from('slips')
    .select('slip_no')
    .order('slip_no', { ascending: false })
    .limit(1);

  if (error) {
    return handleDatabaseError(error);
  }

  let nextNumber;

  if (data && data.length > 0 && data[0].slip_no) {
    // If there are existing slips, get the highest slip number and increment it
    const highestNumber = parseInt(data[0].slip_no);
    nextNumber = (highestNumber + 1).toString();
  } else {
    // If no slips exist yet, start with a new number format: YYMM0001
    const now = new Date();
    const year = now.getFullYear().toString().slice(2); // Get last 2 digits of year
    const month = (now.getMonth() + 1).toString().padStart(2, '0'); // Month (1-12), zero-padded
    nextNumber = `${year}${month}0001`; // Format: YYMM0001
  }

  res.status(200).json({
    status: 'success',
    nextNumber
  });
});
