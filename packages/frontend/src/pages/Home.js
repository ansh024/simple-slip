import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import Select from 'react-select';
import { useTranslation } from 'react-i18next';
import { slipService } from '../services/api';
import Footer from '../components/Footer';
import Button from '../components/Button';

const PageContainer = styled.div`
  min-height: 100vh;
  padding: 20px 20px 80px;
  background: linear-gradient(180deg, #0051FF 0%, #FFFFFF 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Logo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 60px;
  margin-bottom: 40px;
`;

const LogoTitle = styled.div`
  display: flex;
  align-items: center;
  color: #0051FF;
  font-size: 24px;
  font-weight: 700;
  font-family: 'Nunito', sans-serif;
  margin-bottom: 5px;
`;

const LogoIcon = styled.div`
  color: #0051FF;
  font-size: 24px;
  margin-right: 10px;
`;

const LogoSubtitle = styled.div`
  color: #666;
  font-size: 14px;
`;

const LanguageSelectWrapper = styled.div`
  width: 250px;
  margin-bottom: 20px;
`;

// Custom styles for the react-select component
const selectStyles = {
  control: (provided) => ({
    ...provided,
    background: 'white',
    borderRadius: '20px',
    boxShadow: '0px 2px 5px rgba(0, 0, 0, 0.1)',
    border: 'none',
    padding: '2px 8px',
    fontFamily: 'Inter, sans-serif',
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected ? '#0051FF' : state.isFocused ? '#E1EEFF' : 'white',
    color: state.isSelected ? 'white' : '#333',
    fontFamily: 'Inter, sans-serif',
    fontSize: '14px',
    cursor: 'pointer',
  }),
  placeholder: (provided) => ({
    ...provided,
    color: '#666',
    fontFamily: 'Inter, sans-serif',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
  }),
  singleValue: (provided) => ({
    ...provided,
    color: '#333',
    fontFamily: 'Inter, sans-serif',
    fontSize: '14px',
    fontWeight: '500',
  }),
  valueContainer: (provided) => ({
    ...provided,
    display: 'flex',
    alignItems: 'center',
  }),
  dropdownIndicator: (provided) => ({
    ...provided,
    color: '#666',
  }),
  indicatorSeparator: () => ({
    display: 'none',
  }),
};

const SummaryCard = styled.div`
  width: 100%;
  max-width: 350px;
  padding: 15px;
  background: rgba(235, 244, 255, 0.8);
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  margin-bottom: 25px;
`;

const SummaryTitle = styled.div`
  text-align: center;
  color: #666;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 15px;
`;

const SummaryContent = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 15px;
  margin-top: 5px;
`;

const SummaryItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 10px 5px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const SummaryLabel = styled.div`
  font-size: 14px;
  color: #666;
  margin-bottom: 5px;
`;

const SummaryValue = styled.div`
  font-size: 18px;
  font-weight: 700;
  color: #333;
`;

const CreateSlipButton = styled.button`
  width: 100%;
  max-width: 350px;
  height: 56px;
  background: #0051FF;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 18px;
  font-weight: 600;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
  cursor: pointer;
  box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.2);
`;

const PriceListButton = styled.button`
  width: 100%;
  max-width: 350px;
  height: 56px;
  background: white;
  color: #333;
  border: 1px solid #DDD;
  border-radius: 10px;
  font-size: 18px;
  font-weight: 600;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  cursor: pointer;
`;

const ButtonIcon = styled.span`
  font-size: 20px;
`;

const PriceIcon = styled.span`
  font-size: 20px;
`;

const Home = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  
  // Language options for the dropdown
  const languageOptions = [
    { value: 'english', label: 'English' },
    { value: 'hindi', label: 'हिन्दी (Hindi)' },
    { value: 'punjabi', label: 'ਪੰਜਾਬੀ (Punjabi)' },
    { value: 'gujarati', label: 'ગુજરાતી (Gujarati)' }
  ];
  
  // Initialize with actual values for immediate display
  const [summary, setSummary] = useState({
    totalSlips: 0,
    totalSales: 0,
    totalItems: 0
  });
  const [loading, setLoading] = useState(true);
  
  // Initialize selectedLanguage from i18n's current language
  const [selectedLanguage, setSelectedLanguage] = useState(() => {
    const currentLang = i18n.language || 'english';
    const langOption = languageOptions.find(option => option.value === currentLang) || languageOptions[0];
    return langOption;
  });

  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 3;
    let retryTimeout;
    
    // Load cached data first if available
    const loadCachedData = () => {
      try {
        const cachedSummary = localStorage.getItem('cachedSummary');
        if (cachedSummary) {
          const parsedSummary = JSON.parse(cachedSummary);
          const cacheTimestamp = localStorage.getItem('summaryTimestamp');
          
          // Only use cache if it's less than 24 hours old
          if (cacheTimestamp && (Date.now() - parseInt(cacheTimestamp)) < 24 * 60 * 60 * 1000) {
            console.log('Using cached summary data');
            setSummary(parsedSummary);
            
            // Show loading false since we have data to display
            setLoading(false);
            
            // Still try to fetch fresh data in the background
            return true;
          }
        }
        return false;
      } catch (e) {
        console.warn('Error loading cached summary:', e);
        return false;
      }
    };
    
    // Try to load cached data first
    const hasCachedData = loadCachedData();
    
    const fetchSummary = async () => {
      try {
        if (!hasCachedData) {
          setLoading(true);
        }
        
        const response = await slipService.getDailySummary();
        
        let summaryData = {};
        
        console.log('Summary response:', response.data);
        
        if (response.data && response.data.summary) {
          // Map backend response format to our frontend format
          const slipItems = response.data.summary.slips?.flatMap(slip => slip.slip_items || []) || [];
          summaryData = {
            totalSlips: response.data.summary.slipCount || 0,
            totalSales: response.data.summary.totalSales || 0,
            totalItems: response.data.summary.totalItems || slipItems.length || 0
          };
        } else if (response.data && response.data.slips) {
          // Direct slips array in response
          const slips = response.data.slips || [];
          const slipItems = slips.flatMap(slip => slip.slip_items || []);
          const totalAmount = slips.reduce((sum, slip) => sum + (parseFloat(slip.total) || 0), 0);
          
          summaryData = {
            totalSlips: slips.length || 0,
            totalSales: totalAmount || 0,
            totalItems: slipItems.length || 0
          };
        } else if (response.data) {
          // For backward compatibility
          summaryData = {
            totalSlips: response.data.totalSlips || 0,
            totalSales: response.data.totalAmount || 0,
            totalItems: response.data.totalItems || 0
          };
        } else {
          // Fallback to known values if API returns nothing useful
          summaryData = {
            totalSlips: 0,
            totalSales: 0, // Default to 0
            totalItems: 0 // Default to 0
          };
        }
        
        // Set the data in state
        setSummary(summaryData);
        
        // Cache the data for offline use
        localStorage.setItem('cachedSummary', JSON.stringify(summaryData));
        localStorage.setItem('summaryTimestamp', Date.now().toString());
        
        // Reset retry count on success
        retryCount = 0;
      } catch (error) {
        console.error('Error fetching summary:', error);
        
        // Implement retry mechanism for network errors
        if (error.code === 'ERR_NETWORK' && retryCount < maxRetries) {
          retryCount++;
          console.log(`Retrying summary fetch (${retryCount}/${maxRetries}) in 2 seconds...`);
          
          // Clear any existing timeout
          if (retryTimeout) clearTimeout(retryTimeout);
          
          // Retry after a delay
          retryTimeout = setTimeout(() => {
            fetchSummary();
          }, 2000);
          return;
        }
        
        // If we don't have cached data and all retries failed, use actual data
        if (!hasCachedData) {
          const fallbackData = {
            totalSlips: 0, // Default to 0 if API fails
            totalSales: 0,
            totalItems: 0
          };
          setSummary(fallbackData);
          
          // Even cache the fallback data so we can be consistent
          localStorage.setItem('cachedSummary', JSON.stringify(fallbackData));
          localStorage.setItem('summaryTimestamp', Date.now().toString());
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
    
    // Clean up any pending retries
    return () => {
      if (retryTimeout) clearTimeout(retryTimeout);
    };
  }, []);

  const handleCreateSlip = () => {
    navigate('/quick-slip');
  };

  // Handle language change
  const handleLanguageChange = (selectedOption) => {
    setSelectedLanguage(selectedOption);
    // Change language in i18n
    i18n.changeLanguage(selectedOption.value);
    // Save preference to localStorage
    localStorage.setItem('i18nextLng', selectedOption.value);
  };

  // Custom formatOptionLabel to show a language icon
  const formatOptionLabel = ({ label, value }) => (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <span style={{ marginRight: '8px' }}>👤</span>
      <span>{label}</span>
    </div>
  );
  
  return (
    <PageContainer>
      <Logo>
        <LogoTitle>
          <LogoIcon>≡</LogoIcon>
          {t('appName')}
        </LogoTitle>
        <LogoSubtitle>{t('subtitle')}</LogoSubtitle>
      </Logo>
      
      <LanguageSelectWrapper>
        <Select
          options={languageOptions}
          value={selectedLanguage}
          onChange={handleLanguageChange}
          styles={selectStyles}
          isSearchable={false}
          formatOptionLabel={formatOptionLabel}
          placeholder="Select Language"
          components={{
            DropdownIndicator: ({ innerProps }) => (
              <div {...innerProps} style={{ padding: '8px', cursor: 'pointer' }}>
                ▼
              </div>
            )
          }}
        />
      </LanguageSelectWrapper>

      <SummaryCard>
        <SummaryTitle>{t('todaySummary')}</SummaryTitle>
        <SummaryContent>
          <SummaryItem>
            <SummaryValue>{summary.totalSlips}</SummaryValue>
            <SummaryLabel>{t('slipsMade')}</SummaryLabel>
          </SummaryItem>
          
          <SummaryItem>
            <SummaryValue>₹{summary.totalSales}</SummaryValue>
            <SummaryLabel>{t('totalSale')}</SummaryLabel>
          </SummaryItem>
          
          <SummaryItem>
            <SummaryValue>{summary.totalItems}</SummaryValue>
            <SummaryLabel>{t('itemsSold')}</SummaryLabel>
          </SummaryItem>
          
          <SummaryItem>
            <SummaryValue>₹0</SummaryValue>
            <SummaryLabel>{t('internalTransfer')}</SummaryLabel>
          </SummaryItem>
        </SummaryContent>
      </SummaryCard>

      <CreateSlipButton onClick={handleCreateSlip}>
        <ButtonIcon>+</ButtonIcon> {t('createNewSlip')}
      </CreateSlipButton>

      <PriceListButton onClick={() => navigate('/price-list')}>
        <PriceIcon>₹</PriceIcon> {t('priceList')}
      </PriceListButton>
      
      <Footer />
    </PageContainer>
  );
};

export default Home;
