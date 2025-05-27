import React from 'react';
import styled from 'styled-components';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const FooterContainer = styled.footer`
  width: 100%;
  padding: 10px 20px;
  background: white;
  box-shadow: 0px -2px 10px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-around;
  align-items: center;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  height: 60px;
`;

const NavItem = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: ${props => props.$active ? '#0051FF' : '#8C8C8C'};
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  min-width: 60px;
`;

const NavIcon = styled.div`
  font-size: 20px;
  margin-bottom: 4px;
`;

const Footer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  
  const isActive = (path) => location.pathname === path;

  return (
    <FooterContainer>
      <NavItem $active={isActive('/')} onClick={() => navigate('/')}>
        <NavIcon>🏠</NavIcon>
        {t('home')}
      </NavItem>
      
      {/* Drafts tab removed as requested */}
      
      <NavItem $active={isActive('/history')} onClick={() => navigate('/history')}>
        <NavIcon>📚</NavIcon>
        Books
      </NavItem>
      
      <NavItem $active={isActive('/reports')} onClick={() => navigate('/reports')}>
        <NavIcon>📊</NavIcon>
        {t('reports')}
      </NavItem>
      
      <NavItem $active={isActive('/price-board')} onClick={() => navigate('/price-board')}>
        <NavIcon>💰</NavIcon>
        {t('priceBoard.title')}
      </NavItem>
    </FooterContainer>
  );
};

export default Footer;
