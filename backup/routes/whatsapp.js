const express = require('express');
const { supabase } = require('../database/supabase');

const router = express.Router();

// Webhook for incoming WhatsApp messages
router.post('/webhook', async (req, res) => {
  try {
    const { Body, From, To } = req.body;
    
    console.log('WhatsApp message received:', {
      from: From,
      to: To,
      body: Body
    });
    
    // TODO: Process WhatsApp messages
    // For now, just acknowledge receipt
    res.status(200).send('Message received');
  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

// Send WhatsApp message
router.post('/send', async (req, res) => {
  try {
    const { to, message } = req.body;
    
    // TODO: Integrate with Twilio WhatsApp API
    // For now, return a mock response
    res.json({
      success: true,
      messageId: 'mock-message-id',
      status: 'queued'
    });
  } catch (error) {
    console.error('Send WhatsApp error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Send daily summary
router.post('/daily-summary', async (req, res) => {
  try {
    const { shopId = 1, date = new Date().toISOString().split('T')[0] } = req.body;
    
    // Get today's slips
    const { data: slips, error } = await supabase
      .from('slips')
      .select('total')
      .eq('shop_id', shopId)
      .eq('slip_date', date);
    
    if (error) throw error;
    
    const totalSales = slips.reduce((sum, slip) => sum + (slip.total || 0), 0);
    const slipCount = slips.length;
    
    const summaryMessage = `📊 Daily Summary - ${date}\n\n` +
      `Total Slips: ${slipCount}\n` +
      `Total Sales: ₹${totalSales}\n\n` +
      `Thank you for using Simple Slip! 🙏`;
    
    // TODO: Send actual WhatsApp message
    res.json({
      success: true,
      summary: {
        date,
        slipCount,
        totalSales,
        message: summaryMessage
      }
    });
  } catch (error) {
    console.error('Daily summary error:', error);
    res.status(500).json({ error: 'Failed to generate summary' });
  }
});

module.exports = router;
