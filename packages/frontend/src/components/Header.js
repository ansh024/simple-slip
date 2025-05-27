import React from 'react';
import styled from 'styled-components';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const HeaderContainer = styled.header`
  width: 100%;
  padding: 15px 20px;
  background: white;
  box-shadow: 0px 1px 5px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  height: 60px;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #333;
`;

// Removed unused LogoIcon component

const SlipInfo = styled.div`
  color: #333;
  font-size: 16px;
  font-weight: 600;
  flex: 1;
  text-align: center;
`;

const SaveButton = styled.button`
  background-color: #0051FF;
  color: white;
  border: none;
  border-radius: 5px;
  padding: 6px 15px;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: #003EC9;
  }
  
  &:active {
    background-color: #0034A8;
  }
`;

const Header = ({ slipNumber, onSave }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  
  // Determine if we're on a slip page and which type
  const isQuickSlipPage = location.pathname === '/quick-slip';
  const isSlipDetailPage = location.pathname.includes('/slip/') && location.pathname !== '/quick-slip';
  const isSlipPage = isQuickSlipPage || isSlipDetailPage;

  return (
    <HeaderContainer>
      <BackButton onClick={() => navigate('/')}>
        &#8592;
      </BackButton>
      
      {isSlipPage ? (
        <>
          <SlipInfo>
            {slipNumber === 'New' ? t('quickSlip.title') : t('slipDetail.title', { number: slipNumber || '--' })}
          </SlipInfo>
          {isQuickSlipPage && (
            <SaveButton onClick={onSave}>
              {t('header.save')}
            </SaveButton>
          )}
          {isSlipDetailPage && (
            <div style={{ width: '80px' }}></div>
          )}
        </>
      ) : (
        <>
          <SlipInfo>{t('appName')}</SlipInfo>
          <div style={{ width: '24px' }}></div>
        </>
      )}
    </HeaderContainer>
  );
};

export default Header;
