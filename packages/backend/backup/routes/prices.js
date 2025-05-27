const express = require('express');
const { supabase } = require('../database/supabase');
const { protect, isOwner } = require('../middleware/auth');

const router = express.Router();

// Get all products with current prices
router.get('/', protect, async (req, res) => {
  try {
    const { search } = req.query;
    
    // Get products with their latest prices
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        default_unit,
        aliases,
        price_board!inner (
          price,
          effective_date
        )
      `)
      .order('name');
    
    if (error) throw error;
    
    // Filter by search if provided
    let filteredProducts = products;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredProducts = products.filter(product => 
        product.name.toLowerCase().includes(searchLower) ||
        product.aliases?.some(alias => alias.toLowerCase().includes(searchLower))
      );
    }
    
    // Get only the latest price for each product
    const productsWithLatestPrice = filteredProducts.map(product => {
      const latestPrice = product.price_board
        .sort((a, b) => new Date(b.effective_date) - new Date(a.effective_date))[0];
      
      return {
        id: product.id,
        name: product.name,
        default_unit: product.default_unit,
        aliases: product.aliases,
        current_price: latestPrice?.price || 0,
        last_updated: latestPrice?.effective_date
      };
    });
    
    res.json({
      success: true,
      products: productsWithLatestPrice
    });
  } catch (error) {
    console.error('Get prices error:', error);
    res.status(500).json({ error: 'Failed to fetch prices', details: error.message });
  }
});

// Update product price (owner only)
router.put('/:productId', protect, isOwner, async (req, res) => {
  try {
    const { price } = req.body;
    const { productId } = req.params;
    const today = new Date().toISOString().split('T')[0];
    
    // Insert new price record
    const { error } = await supabase
      .from('price_board')
      .upsert({
        product_id: parseInt(productId),
        price: parseFloat(price),
        effective_date: today
      });
    
    if (error) throw error;
    
    res.json({
      success: true,
      message: 'Price updated successfully'
    });
  } catch (error) {
    console.error('Update price error:', error);
    res.status(500).json({ error: 'Failed to update price', details: error.message });
  }
});

// Bulk update prices (owner only)
router.put('/bulk', protect, isOwner, async (req, res) => {
  try {
    const { items } = req.body; // Array of { productId, price }
    const today = new Date().toISOString().split('T')[0];
    
    const priceUpdates = items.map(item => ({
      product_id: parseInt(item.productId),
      price: parseFloat(item.price),
      effective_date: today
    }));
    
    const { error } = await supabase
      .from('price_board')
      .upsert(priceUpdates);
    
    if (error) throw error;
    
    res.json({
      success: true,
      message: `${items.length} prices updated successfully`
    });
  } catch (error) {
    console.error('Bulk update price error:', error);
    res.status(500).json({ error: 'Failed to update prices', details: error.message });
  }
});

// Get price history for a product
router.get('/:productId/history', protect, async (req, res) => {
  try {
    const { data: history, error } = await supabase
      .from('price_board')
      .select('*')
      .eq('product_id', req.params.productId)
      .order('effective_date', { ascending: false })
      .limit(50);
    
    if (error) throw error;
    
    res.json({
      success: true,
      history
    });
  } catch (error) {
    console.error('Get price history error:', error);
    res.status(500).json({ error: 'Failed to fetch price history', details: error.message });
  }
});

// Add new product with price
router.post('/product', protect, isOwner, async (req, res) => {
  try {
    const { name, defaultUnit, aliases = [], price } = req.body;
    
    // Check if product already exists
    const { data: existing } = await supabase
      .from('products')
      .select('id')
      .eq('name', name)
      .single();
    
    if (existing) {
      return res.status(400).json({ error: 'Product already exists' });
    }
    
    // Find the next available ID
    const { data: maxId } = await supabase
      .from('products')
      .select('id')
      .order('id', { ascending: false })
      .limit(1)
      .single();
    
    const newId = (maxId?.id || 0) + 1;
    
    // Create new product
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert({
        id: newId,
        name,
        default_unit: defaultUnit,
        aliases
      })
      .select()
      .single();
    
    if (productError) throw productError;
    
    // Add initial price
    const { error: priceError } = await supabase
      .from('price_board')
      .insert({
        product_id: product.id,
        price: parseFloat(price),
        effective_date: new Date().toISOString().split('T')[0]
      });
    
    if (priceError) throw priceError;
    
    res.status(201).json({
      success: true,
      product: {
        ...product,
        current_price: price
      }
    });
  } catch (error) {
    console.error('Add product error:', error);
    res.status(500).json({ error: 'Failed to add product', details: error.message });
  }
});

// Search products by name or alias
router.get('/search', protect, async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.json({ success: true, products: [] });
    }
    
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        default_unit,
        aliases,
        price_board (
          price,
          effective_date
        )
      `)
      .or(`name.ilike.%${q}%,aliases.cs.{${q}}`);
    
    if (error) throw error;
    
    // Get only the latest price for each product
    const productsWithLatestPrice = products.map(product => {
      const latestPrice = product.price_board
        .sort((a, b) => new Date(b.effective_date) - new Date(a.effective_date))[0];
      
      return {
        id: product.id,
        name: product.name,
        default_unit: product.default_unit,
        aliases: product.aliases,
        current_price: latestPrice?.price || 0
      };
    });
    
    res.json({
      success: true,
      products: productsWithLatestPrice
    });
  } catch (error) {
    console.error('Search products error:', error);
    res.status(500).json({ error: 'Failed to search products', details: error.message });
  }
});

module.exports = router;
