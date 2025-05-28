import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { slipService, whatsappService } from '../services/api';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Button from '../components/Button';

const PageContainer = styled.div`
  min-height: 100vh;
  padding: 70px 20px 80px;
  background-color: var(--secondary-color);
`;

const Title = styled.h2`
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 20px;
  color: var(--text-color);
`;

const TabsContainer = styled.div`
  display: flex;
  margin-bottom: 20px;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid var(--border-color);
`;

const Tab = styled.div`
  flex: 1;
  padding: 10px;
  text-align: center;
  font-weight: 500;
  background: ${props => props.$active ? 'var(--primary-color)' : 'white'};
  color: ${props => props.$active ? 'white' : 'var(--text-color)'};
  cursor: pointer;
`;

const DateSelector = styled.div`
  display: flex;
  margin-bottom: 20px;
  gap: 10px;
`;

const DateInput = styled.input`
  flex: 1;
  padding: 10px;
  border: 1px solid var(--border-color);
  border-radius: 5px;
  font-size: 14px;
  &:focus {
    outline: 1px solid var(--primary-color);
  }
`;

const SummaryCard = styled.div`
  background: white;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid var(--border-color);
  margin-bottom: 20px;
  padding: 15px;
`;

const SummaryHeader = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border-color);
`;

const SummaryTitle = styled.div`
  font-weight: 600;
  font-size: 16px;
`;

const SummaryDate = styled.div`
  color: var(--text-light);
  font-size: 14px;
`;

const SummaryItem = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
`;

const SummaryLabel = styled.div`
  font-size: 14px;
`;

const SummaryValue = styled.div`
  font-size: 14px;
  font-weight: ${props => props.$bold ? '600' : '400'};
`;

const ItemsList = styled.div`
  margin-top: 15px;
`;

const ItemRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
  padding-bottom: 5px;
  border-bottom: 1px solid var(--border-light);
`;

const ItemName = styled.div`
  font-size: 14px;
`;

const ItemQuantity = styled.div`
  font-size: 14px;
  color: var(--text-light);
`;

const ActionButton = styled(Button)`
  width: 100%;
  margin-top: 10px;
`;

const EmptyMessage = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: var(--text-light);
  background: white;
  border-radius: 10px;
  border: 1px solid var(--border-color);
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 20px;
  color: var(--text-light);
`;

const Reports = () => {
  const [activeTab, setActiveTab] = useState('daily');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(
    `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
  );
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'daily') {
      fetchDailySummary();
    } else {
      fetchMonthlySummary();
    }
  }, [activeTab, selectedDate, selectedMonth]);

  const fetchDailySummary = async () => {
    try {
      setLoading(true);
      const response = await slipService.getDailySummary(selectedDate);
      if (response.data) {
        setSummary(response.data);
      }
    } catch (error) {
      console.error('Error fetching daily summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlySummary = async () => {
    // For now, we'll simulate monthly data since the backend endpoint may not exist
    // In a real implementation, you would call an API endpoint for monthly data
    try {
      setLoading(true);
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const [year, month] = selectedMonth.split('-');
      const daysInMonth = new Date(year, month, 0).getDate();
      
      // Generate simulated data
      const totalSlips = Math.floor(Math.random() * 100) + 50;
      const totalSales = Math.floor(Math.random() * 50000) + 10000;
      const totalItems = Math.floor(Math.random() * 300) + 100;
      
      // Generate random items for demonstration
      const topItems = [
        { name: 'Rice', qty: Math.floor(Math.random() * 100) + 20, unit: 'kg' },
        { name: 'Wheat Flour', qty: Math.floor(Math.random() * 80) + 10, unit: 'kg' },
        { name: 'Sugar', qty: Math.floor(Math.random() * 50) + 5, unit: 'kg' },
        { name: 'Milk', qty: Math.floor(Math.random() * 150) + 30, unit: 'L' },
        { name: 'Oil', qty: Math.floor(Math.random() * 40) + 10, unit: 'L' },
      ];
      
      setSummary({
        totalSlips,
        totalAmount: totalSales,
        totalItems,
        date: `${year}-${month}`,
        topItems,
        averageSlipValue: Math.round(totalSales / totalSlips),
        dailyAverage: Math.round(totalSales / daysInMonth)
      });
      
    } catch (error) {
      console.error('Error fetching monthly summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendWhatsAppSummary = async () => {
    try {
      setLoading(true);
      const date = activeTab === 'daily' ? selectedDate : undefined;
      await whatsappService.sendDailySummary(date);
      alert('Summary sent to WhatsApp successfully!');
    } catch (error) {
      console.error('Error sending WhatsApp summary:', error);
      alert('Failed to send summary to WhatsApp. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatMonth = (monthString) => {
    const [year, month] = monthString.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('en-IN', {
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <>
      <Header />
      <PageContainer>
        <Title>Sales Reports</Title>

        <TabsContainer>
          <Tab 
            $active={activeTab === 'daily'} 
            onClick={() => setActiveTab('daily')}
          >
            Daily
          </Tab>
          <Tab 
            $active={activeTab === 'monthly'} 
            onClick={() => setActiveTab('monthly')}
          >
            Monthly
          </Tab>
        </TabsContainer>

        <DateSelector>
          {activeTab === 'daily' ? (
            <DateInput 
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          ) : (
            <DateInput 
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            />
          )}
        </DateSelector>

        {loading ? (
          <LoadingMessage>Loading summary...</LoadingMessage>
        ) : !summary ? (
          <EmptyMessage>
            No data available for the selected {activeTab === 'daily' ? 'date' : 'month'}
          </EmptyMessage>
        ) : (
          <SummaryCard>
            <SummaryHeader>
              <SummaryTitle>
                {activeTab === 'daily' ? 'Daily Summary' : 'Monthly Summary'}
              </SummaryTitle>
              <SummaryDate>
                {activeTab === 'daily' ? formatDate(selectedDate) : formatMonth(selectedMonth)}
              </SummaryDate>
            </SummaryHeader>

            <SummaryItem>
              <SummaryLabel>Total Slips</SummaryLabel>
              <SummaryValue>{summary.totalSlips}</SummaryValue>
            </SummaryItem>

            <SummaryItem>
              <SummaryLabel>Total Sales</SummaryLabel>
              <SummaryValue $bold>₹{(summary.totalAmount ?? 0).toFixed(2)}</SummaryValue>
            </SummaryItem>

            <SummaryItem>
              <SummaryLabel>Total Items Sold</SummaryLabel>
              <SummaryValue>{summary.totalItems}</SummaryValue>
            </SummaryItem>

            {activeTab === 'monthly' && (
              <>
                <SummaryItem>
                  <SummaryLabel>Average Slip Value</SummaryLabel>
                  <SummaryValue>₹{(summary.averageSlipValue ?? 0).toFixed(2)}</SummaryValue>
                </SummaryItem>

                <SummaryItem>
                  <SummaryLabel>Daily Average Sales</SummaryLabel>
                  <SummaryValue>₹{(summary.dailyAverage ?? 0).toFixed(2)}</SummaryValue>
                </SummaryItem>
              </>
            )}

            {summary.topItems && summary.topItems.length > 0 && (
              <>
                <SummaryTitle style={{ marginTop: '20px', marginBottom: '10px' }}>
                  Top Items Sold
                </SummaryTitle>
                <ItemsList>
                  {summary.topItems.map((item, index) => (
                    <ItemRow key={index}>
                      <ItemName>{item.name}</ItemName>
                      <ItemQuantity>{item.qty} {item.unit}</ItemQuantity>
                    </ItemRow>
                  ))}
                </ItemsList>
              </>
            )}

            <ActionButton onClick={handleSendWhatsAppSummary} disabled={loading}>
              Send to WhatsApp
            </ActionButton>
          </SummaryCard>
        )}
      </PageContainer>
      <Footer />
    </>
  );
};

export default Reports;
