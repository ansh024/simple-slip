import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import Select from 'react-select';
import { useTranslation } from 'react-i18next';
import { slipService } from '../services/api';
import Footer from '../components/Footer';
import Button from '../components/Button';
import MenuIcon from '@mui/icons-material/Menu';
import AddIcon from '@mui/icons-material/Add';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import PersonIcon from '@mui/icons-material/Person';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import MicIcon from '@mui/icons-material/Mic';

const PageContainer = styled.div`
  min-height: 100vh;
  padding: 20px 20px 80px;
  background: linear-gradient(180deg, #0051FF 0%, #FFFFFF 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
`;

const Logo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 40px;
  margin-bottom: 30px;
`;

const LogoTitle = styled.div`
  display: flex;
  align-items: center;
  color: #333;
  font-size: 18px;
  font-weight: 700;
  font-family: 'Nunito', sans-serif;
  margin-bottom: 5px;
  margin-top: 15px;
`;

const LogoImage = styled.img`
  height: 200px;
  object-fit: contain;
`;

const LogoSubtitle = styled.div`
  color: #666;
  font-size: 14px;
  text-align: center;
`;

const LanguageSelectWrapper = styled.div`
  width: 180px;
  margin: 0 auto 20px;
  position: relative;
`;

const LanguageSelect = styled.div`
  width: 100%;
  height: 40px;
  border-radius: 20px;
  background-color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 15px;
  box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.1);
  cursor: pointer;
`;

const LanguageIcon = styled.div`
  display: flex;
  align-items: center;
  color: #ff6b00;
  font-size: 20px;
`;

const customSelectStyles = {
  control: (provided) => ({
    ...provided,
    backgroundColor: 'white',
    border: 'none',
    boxShadow: 'var(--shadow)',
    borderRadius: '20px',
    padding: '2px 8px',
    minHeight: '40px',
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected ? 'var(--primary-color)' : 'white',
    color: state.isSelected ? 'white' : 'var(--text-color)',
    '&:hover': {
      backgroundColor: 'var(--secondary-color)',
      color: 'var(--text-color)',
    },
  }),
  placeholder: (provided) => ({
    ...provided,
    color: 'var(--text-color)',
    fontSize: '14px',
    fontWeight: '400',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  }),
  singleValue: (provided) => ({
    ...provided,
    color: 'var(--text-color)',
    fontSize: '14px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
  }),
  valueContainer: (provided) => ({
    ...provided,
    padding: '0',
    gap: '8px',
  }),
  dropdownIndicator: (provided) => ({
    ...provided,
    color: 'var(--text-color)',
  }),
  indicatorSeparator: () => ({
    display: 'none'
  }),
};

const SummaryCard = styled.div`
  width: 100%;
  max-width: 350px;
  background: white;
  border-radius: 20px;
  box-shadow: 0px 4px 15px rgba(0, 0, 0, 0.08);
  padding: 20px;
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
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const SummaryRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 5px;
  border-bottom: 1px solid #f0f0f0;
  &:last-child {
    border-bottom: none;
  }
`;

const SummaryLabel = styled.span`
  font-size: 15px;
  color: #555;
  font-weight: 500;
`;

const SummaryValue = styled.div`
  font-size: 18px;
  font-weight: 700;
  color: #333;
`;

const HomeButton = styled.div`
  width: 100%;
  max-width: 350px;
  background: white;
  border-radius: 20px;
  box-shadow: 0px 4px 15px rgba(0, 0, 0, 0.08);
  padding: 18px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0px 8px 20px rgba(0, 0, 0, 0.12);
  }
  
  &:active {
    transform: translateY(0);
    box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.05);
  }
`;

const ButtonContent = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
`;

const ButtonIcon = styled.span`
  display: flex;
  align-items: center;
`;

const ButtonText = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-left: 10px;
`;

const ButtonTitle = styled.span`
  font-size: 18px;
  font-weight: 600;
  color: #333;
`;

const ButtonSubtitle = styled.span`
  font-size: 14px;
  color: #666;
`;

const PriceIcon = styled.div`
  background: #0051FF;
  color: white;
  width: 35px;
  height: 35px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  border-radius: 50%;
  margin-right: 10px;
  box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);
`;

const DropdownMenu = styled.div`
  position: absolute;
  top: 45px;
  left: 0;
  width: 100%;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0px 3px 6px rgba(0, 0, 0, 0.1);
  z-index: 10;
  overflow: hidden;
`;

const DropdownItem = styled.div`
  padding: 12px 15px;
  cursor: pointer;
  transition: background-color 0.2s;
  background-color: ${props => props.isSelected ? '#f0f7ff' : 'white'};
  color: ${props => props.isSelected ? '#0051FF' : '#333'};
  &:hover {
    background-color: #f5f5f5;
  }
`;

const MicrophoneOverlay = styled.div`
  position: absolute;
  top: 25px;
  left: 0;
  right: 0;
  width: 100%;
  height: 220px;
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: ${props => props.visible ? 0.7 : 0};
  transition: opacity 0.3s ease-in-out;
  z-index: 1;
`;

const SoundWave = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 90%;
  height: 80px;
`;

const SoundBar = styled.div`
  width: 5px;
  background: rgba(0, 81, 255, 0.5);
  border-radius: 5px;
  animation: sound-wave 1.2s infinite ease-in-out;
  animation-delay: ${props => props.delay || '0s'};
  height: ${props => props.height || '20px'};
  
  @keyframes sound-wave {
    0%, 100% {
      transform: scaleY(0.5);
    }
    50% {
      transform: scaleY(1);
    }
  }
`;

const Home = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  
  // Language options for the dropdown
  const languageOptions = [
    { value: 'english', label: 'English' },
    { value: 'hindi', label: 'हिन्दी (Hindi)' },
  ];
  
  // Initialize with actual values for immediate display
  const [summary, setSummary] = useState({
    totalSlips: 0,
    totalSales: 0,
    totalItems: 0
  });
  const [loading, setLoading] = useState(true);
  const [languageDropdownOpen, setLanguageDropdownOpen] = useState(false);
  const [micActive, setMicActive] = useState(false);
  
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

  const logoUrl = process.env.PUBLIC_URL + '/Logo.svg';
  
  return (
    <PageContainer>
      <Logo>
        <LogoImage src={logoUrl} alt="Simple Slip Logo" />
        <LogoTitle>{t('appName')}</LogoTitle>
        <LogoSubtitle>{t('subtitle')}</LogoSubtitle>
      </Logo>
      
      <LanguageSelectWrapper>
        <LanguageSelect onClick={() => setLanguageDropdownOpen(!languageDropdownOpen)}>
          <LanguageIcon>👤</LanguageIcon>
          <span>Language: {selectedLanguage.label}</span>
          <KeyboardArrowDownIcon />
        </LanguageSelect>
        {languageDropdownOpen && (
          <DropdownMenu>
            {languageOptions.map(option => (
              <DropdownItem 
                key={option.value} 
                onClick={() => {
                  handleLanguageChange(option);
                  setLanguageDropdownOpen(false);
                }}
                isSelected={selectedLanguage.value === option.value}
              >
                {option.label}
              </DropdownItem>
            ))}
          </DropdownMenu>
        )}  
      </LanguageSelectWrapper>
      
      <MicrophoneOverlay visible={micActive}>
        <SoundWave>
          {Array(20).fill(0).map((_, i) => (
            <SoundBar 
              key={i} 
              height={`${20 + Math.floor(Math.random() * 60)}px`}
              delay={`${Math.random() * 0.5}s`}
            />
          ))}
        </SoundWave>
      </MicrophoneOverlay>

      <SummaryCard>
        <SummaryTitle>{t('todaySummary')}</SummaryTitle>
        <SummaryContent>
          <SummaryRow>
            <SummaryLabel>{t('totalSlips')}</SummaryLabel>
            <SummaryValue>{loading ? '-' : summary.totalSlips}</SummaryValue>
          </SummaryRow>
          <SummaryRow>
            <SummaryLabel>{t('totalSales')}</SummaryLabel>
            <SummaryValue>
              ₹ {loading ? '-' : summary.totalSales.toLocaleString('en-IN')}
            </SummaryValue>
          </SummaryRow>
          <SummaryRow>
            <SummaryLabel>{t('totalItems')}</SummaryLabel>
            <SummaryValue>{loading ? '-' : summary.totalItems}</SummaryValue>
          </SummaryRow>
        </SummaryContent>
      </SummaryCard>

      <HomeButton onClick={handleCreateSlip}>
        <ButtonContent>
          <ButtonIcon>
            <AddIcon style={{ fontSize: '22px' }} />
          </ButtonIcon>
          <ButtonText>
            <ButtonTitle>{t('createNewSlip')}</ButtonTitle>
            <ButtonSubtitle>{t('quickSlipDescription')}</ButtonSubtitle>
          </ButtonText>
        </ButtonContent>
      </HomeButton>
      
      <HomeButton onClick={() => navigate('/price-board')}>
        <ButtonContent>
          <PriceIcon>
            <CurrencyRupeeIcon style={{ fontSize: '22px' }} />
          </PriceIcon>
          <ButtonText>
            <ButtonTitle>{t('priceBoard')}</ButtonTitle>
            <ButtonSubtitle>{t('priceBoardDescription')}</ButtonSubtitle>
          </ButtonText>
        </ButtonContent>
      </HomeButton>
      
      <Footer />
    </PageContainer>
  );
};

export default Home;
