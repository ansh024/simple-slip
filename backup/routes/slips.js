const express = require('express');
const { supabase } = require('../database/supabase');
const { protect } = require('../middleware/auth');
const { generateSlipPDF } = require('../services/pdfService');

const router = express.Router();

// Create new slip
router.post('/', protect, async (req, res) => {
  try {
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
        total
      })
      .select()
      .single();
    
    if (slipError) throw slipError;
    
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
    
    if (itemsError) throw itemsError;
    
    // Return complete slip data
    const { data: completeSlip } = await supabase
      .from('slips')
      .select(`
        *,
        slip_items (
          id,
          product_id,
          qty,
          unit,
          rate,
          line_total,
          products (
            name,
            default_unit
          )
        )
      `)
      .eq('id', slip.id)
      .single();
    
    res.status(201).json({
      success: true,
      slip: completeSlip
    });
  } catch (error) {
    console.error('Create slip error:', error);
    res.status(500).json({ error: 'Failed to create slip', details: error.message });
  }
});

// Get all slips
router.get('/', protect, async (req, res) => {
  try {
    const { date, page = 1, limit = 20, shopId = 1 } = req.query;
    const offset = (page - 1) * limit;
    
    let query = supabase
      .from('slips')
      .select(`
        *,
        slip_items (
          id,
          product_id,
          qty,
          unit,
          rate,
          line_total,
          products (
            name,
            default_unit
          )
        )
      `, { count: 'exact' })
      .eq('shop_id', shopId)
      .order('slip_date', { ascending: false })
      .order('slip_no', { ascending: false });
    
    if (date) {
      query = query.eq('slip_date', date);
    }
    
    const { data: slips, error, count } = await query
      .range(offset, offset + limit - 1);
    
    if (error) throw error;
    
    res.json({
      success: true,
      slips,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get slips error:', error);
    res.status(500).json({ error: 'Failed to fetch slips', details: error.message });
  }
});

// Get single slip
router.get('/:id', protect, async (req, res) => {
  try {
    const { data: slip, error } = await supabase
      .from('slips')
      .select(`
        *,
        slip_items (
          id,
          product_id,
          qty,
          unit,
          rate,
          line_total,
          products (
            name,
            default_unit
          )
        )
      `)
      .eq('id', req.params.id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Slip not found' });
      }
      throw error;
    }
    
    res.json({
      success: true,
      slip
    });
  } catch (error) {
    console.error('Get slip error:', error);
    res.status(500).json({ error: 'Failed to fetch slip', details: error.message });
  }
});

// Get today's summary
router.get('/summary/today', protect, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { shopId = 1 } = req.query;
    
    const { data: slips, error } = await supabase
      .from('slips')
      .select('total')
      .eq('shop_id', shopId)
      .eq('slip_date', today);
    
    if (error) throw error;
    
    const totalSales = slips.reduce((sum, slip) => sum + (slip.total || 0), 0);
    const slipCount = slips.length;
    
    res.json({
      success: true,
      summary: {
        date: today,
        slipCount,
        totalSales,
        shopId
      }
    });
  } catch (error) {
    console.error('Get summary error:', error);
    res.status(500).json({ error: 'Failed to fetch summary', details: error.message });
  }
});

// Download slip as PDF
router.get('/:id/pdf', protect, async (req, res) => {
  try {
    const { data: slip, error } = await supabase
      .from('slips')
      .select(`
        *,
        slip_items (
          id,
          product_id,
          qty,
          unit,
          rate,
          line_total,
          products (
            name,
            default_unit
          )
        )
      `)
      .eq('id', req.params.id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Slip not found' });
      }
      throw error;
    }
    
    const pdfBuffer = await generateSlipPDF(slip);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=slip-${slip.slip_no}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Generate PDF error:', error);
    res.status(500).json({ error: 'Failed to generate PDF', details: error.message });
  }
});

module.exports = router;
