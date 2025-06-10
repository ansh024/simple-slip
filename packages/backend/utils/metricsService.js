/**
 * METRICS SERVICE
 * 
 * Service for tracking and analyzing voice recognition accuracy metrics.
 * This helps measure how well the voice input feature is performing and
 * identify areas for improvement.
 */

const { pool } = require('../database/db');

/**
 * Records detailed metrics about a voice processing attempt
 * 
 * @param {Object} metrics - The metrics data to record
 * @param {Object} metrics.audio - Audio file details
 * @param {Object} metrics.transcript - Transcript information
 * @param {Object} metrics.extraction - Item extraction details
 * @param {Object} metrics.matching - Product matching details
 * @param {Object} metrics.context - Session context (shop, user, etc)
 * @param {Object} metrics.performance - Performance metrics
 * @param {Object} metrics.error - Any errors that occurred
 * @param {Object} metrics.outcome - Final outcome details
 * @returns {Promise<Object>} The created metrics record
 */
async function recordVoiceMetrics(metrics) {
  const {
    audio = {},
    transcript = {},
    extraction = {},
    matching = {},
    context = {},
    performance = {},
    error = {},
    outcome = {}
  } = metrics;

  console.log('Recording voice metrics:', { 
    audioSize: audio.fileSize,
    transcriptLength: transcript.text?.length || 0,
    itemsIdentified: extraction.itemsIdentified || 0,
    success: outcome.success
  });

  try {
    const result = await pool.query(`
      INSERT INTO voice_metrics (
        audio_file_size, audio_duration_ms, audio_format, language_code,
        raw_transcript, transcript_chars, transcript_words,
        attempted_extractions, successful_extractions,
        items_identified, items_matched_to_products, items_added_to_slip,
        error_type, error_message,
        slip_id, shop_id, created_by,
        success, confidence_score, processing_time_ms,
        recognized_text, unrecognized_text, product_matching_results
      ) VALUES (
        $1, $2, $3, $4,
        $5, $6, $7,
        $8, $9,
        $10, $11, $12,
        $13, $14,
        $15, $16, $17,
        $18, $19, $20,
        $21, $22, $23
      ) RETURNING *
    `, [
      audio.fileSize || 0,
      audio.durationMs || 0,
      audio.format || 'unknown',
      transcript.languageCode || 'unknown',
      
      transcript.text || '',
      transcript.text?.length || 0,
      transcript.text?.split(/\s+/).length || 0,
      
      extraction.attemptedCount || 0,
      extraction.successfulCount || 0,
      
      matching.itemsIdentified || 0,
      matching.itemsMatchedToProducts || 0,
      matching.itemsAddedToSlip || 0,
      
      error.type || null,
      error.message || null,
      
      context.slipId || null,
      context.shopId || null,
      context.userId || null,
      
      outcome.success || false,
      outcome.confidenceScore || 0,
      performance.processingTimeMs || 0,
      
      JSON.stringify(extraction.recognizedItems || {}),
      extraction.unrecognizedText || null,
      JSON.stringify(matching.results || {})
    ]);
    
    console.log('Voice metrics recorded successfully, ID:', result.rows[0].id);
    return result.rows[0];
  } catch (err) {
    console.error('Error recording voice metrics:', err);
    // Don't throw the error, as metrics recording shouldn't interrupt the main flow
    return null;
  }
}

/**
 * Get aggregated metrics for voice recognition performance
 * @param {Object} filters - Optional filters like shop_id, date range
 * @returns {Promise<Object>} Analytics data
 */
async function getVoiceAnalytics(filters = {}) {
  const { shopId, startDate, endDate } = filters;
  
  const whereClause = [];
  const params = [];
  
  if (shopId) {
    params.push(shopId);
    whereClause.push(`shop_id = $${params.length}`);
  }
  
  if (startDate) {
    params.push(startDate);
    whereClause.push(`timestamp >= $${params.length}`);
  }
  
  if (endDate) {
    params.push(endDate);
    whereClause.push(`timestamp <= $${params.length}`);
  }
  
  const whereSQL = whereClause.length > 0 ? `WHERE ${whereClause.join(' AND ')}` : '';
  
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) as total_attempts,
        SUM(CASE WHEN success = true THEN 1 ELSE 0 END) as successful_attempts,
        ROUND(AVG(confidence_score), 2) as avg_confidence,
        ROUND(AVG(processing_time_ms)/1000, 2) as avg_processing_seconds,
        SUM(items_identified) as total_items_identified,
        SUM(items_matched_to_products) as total_items_matched,
        SUM(items_added_to_slip) as total_items_added,
        ROUND((SUM(items_matched_to_products)::numeric / NULLIF(SUM(items_identified), 0)) * 100, 2) as product_match_rate,
        ROUND((SUM(items_added_to_slip)::numeric / NULLIF(SUM(items_identified), 0)) * 100, 2) as slip_addition_rate,
        COUNT(DISTINCT error_type) as unique_error_types
      FROM voice_metrics
      ${whereSQL}
    `, params);
    
    // Get error breakdown
    const errorResult = await pool.query(`
      SELECT 
        error_type, 
        COUNT(*) as count,
        ROUND((COUNT(*)::numeric / (SELECT COUNT(*) FROM voice_metrics ${whereSQL})) * 100, 2) as percentage
      FROM voice_metrics 
      ${whereSQL} 
      AND error_type IS NOT NULL
      GROUP BY error_type
      ORDER BY count DESC
    `, params);
    
    return {
      summary: result.rows[0],
      errors: errorResult.rows,
      timeframe: {
        from: startDate || 'all time',
        to: endDate || 'present'
      }
    };
  } catch (err) {
    console.error('Error getting voice analytics:', err);
    throw err;
  }
}

module.exports = {
  recordVoiceMetrics,
  getVoiceAnalytics
};
