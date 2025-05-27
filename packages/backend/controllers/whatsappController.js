/**
 * WHATSAPP CONTROLLER
 * 
 * This controller handles all WhatsApp messaging functionality:
 * - Processing webhook requests from Twilio
 * - Sending WhatsApp messages
 * - Generating and sending daily sales summaries
 * 
 * CURRENT IMPLEMENTATION:
 * The current version uses mock responses for development and testing.
 * It's designed to be easily replaced with actual Twilio WhatsApp API integration.
 */

const { supabase } = require('../database/supabase');
const { catchAsync, AppError, handleDatabaseError } = require('../utils/errorHandler');
// PDF functionality removed to simplify the application

/**
 * @desc    Handle incoming WhatsApp messages (webhook)
 * @route   POST /api/whatsapp/webhook
 * @access  Public
 */
exports.webhookHandler = catchAsync(async (req, res) => {
  // Extract message data from request
  // In a real implementation, this would extract data from Twilio's webhook payload
  const { From, Body } = req.body;
  
  // Mock response - simulate processing the incoming message
  console.log(`Received WhatsApp message from ${From}: ${Body}`);
  
  // Process the message based on content
  let responseMessage = 'Thank you for your message. How can I help you?';
  
  // Simple keyword detection
  if (Body.toLowerCase().includes('summary')) {
    responseMessage = 'Your daily summary will be sent shortly.';
    // In a real implementation, this would trigger the daily summary generation
  } else if (Body.toLowerCase().includes('help')) {
    responseMessage = 'Available commands: "summary" - get daily sales summary, "status" - check system status';
  } else if (Body.toLowerCase().includes('status')) {
    responseMessage = 'Simple Slip system is operational. All services running normally.';
  }
  
  // Send mock response (in Twilio XML format for compatibility)
  res.set('Content-Type', 'text/xml');
  res.send(`
    <Response>
      <Message>${responseMessage}</Message>
    </Response>
  `);
});

/**
 * @desc    Send a WhatsApp message
 * @route   POST /api/whatsapp/send
 * @access  Private
 */
exports.sendMessage = catchAsync(async (req, res) => {
  const { to, message } = req.body;
  
  // Validate input
  if (!to || !message) {
    throw new AppError('Phone number and message are required', 400);
  }
  
  // Format phone number if needed
  const formattedNumber = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
  
  // MOCK IMPLEMENTATION
  // In a real implementation, this would use Twilio API to send the message
  console.log(`Would send WhatsApp message to ${formattedNumber}: ${message}`);
  
  // Simulate successful message sending
  res.json({
    success: true,
    message: 'WhatsApp message sent successfully',
    details: {
      to: formattedNumber,
      status: 'sent',
      sid: `mock-message-${Date.now()}`
    }
  });
});

/**
 * @desc    Generate and send daily sales summary
 * @route   POST /api/whatsapp/daily-summary
 * @access  Private
 */
exports.sendDailySummary = catchAsync(async (req, res) => {
  const { date = new Date().toISOString().split('T')[0], phoneNumber } = req.body;
  
  // Get all slips for the specified date
  const { data: slips, error } = await supabase
    .from('slips')
    .select('*')
    .eq('slip_date', date);
  
  if (error) {
    throw handleDatabaseError(error, 'Get slips for daily summary');
  }
  
  // Calculate summary data
  const totalSales = slips.reduce((sum, slip) => sum + slip.total, 0);
  const slipCount = slips.length;
  
  // Format the summary message
  const summaryMessage = `
📊 *Daily Sales Summary: ${date}*

Total Sales: ₹${totalSales.toFixed(2)}
Number of Slips: ${slipCount}
Average Sale: ₹${slipCount > 0 ? (totalSales / slipCount).toFixed(2) : '0.00'}

Top performing products:
• आलू: ₹1,200
• प्याज: ₹980
• टमाटर: ₹850

_This is an automated message from Simple Slip._
  `.trim();
  
  // MOCK IMPLEMENTATION
  // In a real implementation, this would use Twilio API to send the message
  console.log(`Would send daily summary to ${phoneNumber}:\n${summaryMessage}`);
  
  // Simulate successful message sending
  res.json({
    success: true,
    message: 'Daily summary sent successfully',
    details: {
      date,
      totalSales,
      slipCount,
      recipient: phoneNumber,
      status: 'sent',
      sid: `mock-summary-${Date.now()}`
    }
  });
});
