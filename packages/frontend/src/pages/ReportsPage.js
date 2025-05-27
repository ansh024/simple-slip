import React, { useEffect, useState } from 'react';
import { slipService } from '../services/api';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import './ReportsPage.css'; // We'll create this CSS file next

const ReportCard = ({ title, value, icon, isLoading }) => {
  return (
    <div className="report-card">
      <div className="report-card-icon">
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <div className="report-card-content">
        <h4>{title}</h4>
        {isLoading ? <p>Loading...</p> : <p>{value}</p>}
      </div>
    </div>
  );
};

const Reports = () => {
  const { t } = useTranslation();
  const [dailySummary, setDailySummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      setIsLoading(true);
      try {
        const response = await slipService.getDailySummary(); // Assuming today's date by default
        if (response && response.data && response.data.summary) {
          setDailySummary(response.data.summary);
        } else if (response && response._isMock) {
          // Handle mock data scenario if needed, or trust the fallback
          setDailySummary(response.data.summary);
          toast.info(t('reports.usingMockData'));
        } else {
          toast.error(t('reports.errorFetchingSummary'));
          setDailySummary(null); // Explicitly set to null on error
        }
      } catch (error) {
        // This catch is for errors not handled by safeApiCall (e.g., programming errors here)
        console.error('Error in fetchSummary:', error);
        toast.error(t('reports.errorFetchingSummaryUnexpected'));
        setDailySummary(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSummary();
  }, [t]);

  return (
    <div className="reports-page-container">
      <h2>{t('reports.title')}</h2>
      <div className="reports-grid">
        <ReportCard 
          title={t('reports.totalSalesToday')}
          value={dailySummary ? `${t('currencySymbol')}${dailySummary.totalSales?.toFixed(2) || '0.00'}` : '-'}
          icon="payments"
          isLoading={isLoading}
        />
        <ReportCard 
          title={t('reports.totalSlipsToday')}
          value={dailySummary ? dailySummary.slipCount?.toString() || '0' : '-'}
          icon="receipt_long"
          isLoading={isLoading}
        />
        <ReportCard 
          title={t('reports.avgSaleValueToday')}
          value={dailySummary && dailySummary.slipCount > 0 ? `${t('currencySymbol')}${(dailySummary.totalSales / dailySummary.slipCount).toFixed(2)}` : `${t('currencySymbol')}0.00`}
          icon="show_chart"
          isLoading={isLoading}
        />
        {/* Add more ReportCard components here for other stats as they are developed */}
      </div>
      {/* Sections for charts will go here */}
    </div>
  );
};

export default Reports;
