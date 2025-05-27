const express = require('express');
const { query, getClient } = require('../database/db');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Create internal stock transfer
router.post('/transfer', protect, async (req, res) => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    
    const { toShopId, items, notes } = req.body;
    const transfers = [];
    
    for (const item of items) {
      // Check if item exists
      const itemCheck = await client.query(
        'SELECT id FROM items WHERE name = $1 AND shop_id = $2',
        [item.name, req.user.shop_id]
      );
      
      let itemId;
      if (itemCheck.rows.length === 0) {
        // Create item if it doesn't exist
        const newItem = await client.query(
          'INSERT INTO items (name, name_hindi, unit, current_price, shop_id) VALUES ($1, $2, $3, $4, $5) RETURNING id',
          [item.name, item.nameHindi || item.name, item.unit, item.price || 0, req.user.shop_id]
        );
        itemId = newItem.rows[0].id;
      } else {
        itemId = itemCheck.rows[0].id;
      }
      
      // Create transfer record
      const transferResult = await client.query(
        `INSERT INTO stock_transfers (from_shop_id, to_shop_id, item_id, quantity, unit, transfer_type, notes, created_by) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [req.user.shop_id, toShopId, itemId, item.quantity, item.unit, 'internal', notes, req.user.id]
      );
      
      transfers.push(transferResult.rows[0]);
    }
    
    await client.query('COMMIT');
    
    res.status(201).json({
      success: true,
      transfers,
      message: `${transfers.length} items transferred successfully`
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Stock transfer error:', error);
    res.status(500).json({ error: 'Failed to create stock transfer' });
  } finally {
    client.release();
  }
});

// Get stock transfers for a shop
router.get('/transfers', protect, async (req, res) => {
  try {
    const { date, type = 'all', page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE (st.from_shop_id = $1 OR st.to_shop_id = $1)';
    const params = [req.user.shop_id];
    
    if (date) {
      whereClause += ' AND DATE(st.created_at) = $2';
      params.push(date);
    }
    
    if (type === 'sent') {
      whereClause += ' AND st.from_shop_id = $1';
    } else if (type === 'received') {
      whereClause += ' AND st.to_shop_id = $1';
    }
    
    const result = await query(
      `SELECT st.*, 
        i.name as item_name, 
        i.name_hindi as item_name_hindi,
        fs.name as from_shop_name,
        ts.name as to_shop_name,
        u.name as created_by_name
       FROM stock_transfers st
       JOIN items i ON st.item_id = i.id
       LEFT JOIN shops fs ON st.from_shop_id = fs.id
       LEFT JOIN shops ts ON st.to_shop_id = ts.id
       JOIN users u ON st.created_by = u.id
       ${whereClause}
       ORDER BY st.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );
    
    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM stock_transfers st ${whereClause}`,
      params
    );
    
    res.json({
      success: true,
      transfers: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(countResult.rows[0].count / limit)
      }
    });
  } catch (error) {
    console.error('Get transfers error:', error);
    res.status(500).json({ error: 'Failed to fetch transfers' });
  }
});

// Get transfer summary for dashboard
router.get('/summary', protect, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const result = await query(
      `SELECT 
        COUNT(CASE WHEN from_shop_id = $1 THEN 1 END) as sent_count,
        COUNT(CASE WHEN to_shop_id = $1 THEN 1 END) as received_count,
        SUM(CASE WHEN from_shop_id = $1 THEN quantity * COALESCE(i.current_price, 0) ELSE 0 END) as sent_value,
        SUM(CASE WHEN to_shop_id = $1 THEN quantity * COALESCE(i.current_price, 0) ELSE 0 END) as received_value
       FROM stock_transfers st
       JOIN items i ON st.item_id = i.id
       WHERE (st.from_shop_id = $1 OR st.to_shop_id = $1) 
       AND DATE(st.created_at) = $2`,
      [req.user.shop_id, today]
    );
    
    res.json({
      success: true,
      summary: {
        sentCount: parseInt(result.rows[0].sent_count) || 0,
        receivedCount: parseInt(result.rows[0].received_count) || 0,
        sentValue: parseFloat(result.rows[0].sent_value) || 0,
        receivedValue: parseFloat(result.rows[0].received_value) || 0
      }
    });
  } catch (error) {
    console.error('Get transfer summary error:', error);
    res.status(500).json({ error: 'Failed to fetch transfer summary' });
  }
});

// Get list of shops for transfer dropdown
router.get('/shops', protect, async (req, res) => {
  try {
    const result = await query(
      'SELECT id, name FROM shops WHERE id != $1 ORDER BY name',
      [req.user.shop_id]
    );
    
    res.json({
      success: true,
      shops: result.rows
    });
  } catch (error) {
    console.error('Get shops error:', error);
    res.status(500).json({ error: 'Failed to fetch shops' });
  }
});

module.exports = router;
