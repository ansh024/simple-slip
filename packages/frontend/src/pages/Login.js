import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import Footer from '../components/Footer';
import { useTranslation } from 'react-i18next';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import AddIcon from '@mui/icons-material/Add';
import micLogoSvg from '../assets/mic-logo.svg';

const LoginContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  padding: 20px 20px 80px;
  background: linear-gradient(180deg, #0051FF 0%, #FFFFFF 100%);
`;

const LoginCard = styled.div`
  width: 100%;
  max-width: 320px;
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
  align-items: center;
`;

const LogoContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: auto;
  margin-bottom: 40px;
`;

const LogoImage = styled.img`
  width: 200px;
  height: 200px;
  margin-bottom: 20px;
`;

const LogoText = styled.div`
  color: #0051FF;
  font-size: 24px;
  font-weight: 700;
  display: flex;
  align-items: center;
  margin-bottom: 5px;
`;

const LogoSubtitle = styled.div`
  color: #666;
  font-size: 14px;
  text-align: center;
`;

const LanguageSelectWrapper = styled.div`
  width: 250px;
  margin-bottom: 20px;
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

const LoginButton = styled.button`
  width: 100%;
  height: 50px;
  background-color: #0051FF;
  color: white;
  border: none;
  border-radius: 25px;
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  margin-bottom: 15px;
  box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.2);
`;

const RegisterButton = styled.button`
  width: 100%;
  height: 50px;
  background-color: white;
  color: #333;
  border: 1px solid #ddd;
  border-radius: 25px;
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.1);
`;

const AddIconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 5px;
`;

const ErrorMessage = styled.div`
  color: red;
  font-size: 12px;
  margin-top: 5px;
`;

const SwitchMode = styled.div`
  color: #0051FF;
  font-size: 14px;
  margin-top: 15px;
  cursor: pointer;
  text-decoration: underline;
  align-self: center;
`;

const Login = () => {
  const { login, simpleLogin, register, error } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  
  const [selectedLanguage, setSelectedLanguage] = useState({ value: 'english', label: 'English' });
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('login'); // Add mode state

  const handleLogin = async () => {
    setLoading(true);
    try {
      await simpleLogin('guest'); // Using default guest login for demo
      navigate('/');
    } catch (err) {
      console.error('Auth error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = () => {
    // Navigate to registration page or show registration form
    // For now, just logging for demo purposes
    console.log('Register clicked');
  };

  const handleLanguageChange = (language) => {
    setSelectedLanguage(language);
    i18n.changeLanguage(language.value);
  };

  return (
    <LoginContainer>
      <LogoContainer>
        <LogoImage src={micLogoSvg} alt="Simple Slip Logo" />
        <LogoText>
          ≡ {t('appName') || 'Simple Slip'}
        </LogoText>
        <LogoSubtitle>
          {t('subtitle') || 'Simply manage your retail business'}
        </LogoSubtitle>
      </LogoContainer>

      <LoginCard>
        <LanguageSelectWrapper>
          <LanguageSelect>
            <LanguageIcon>👤</LanguageIcon>
            <span>Language : {selectedLanguage.label}</span>
            <KeyboardArrowDownIcon />
          </LanguageSelect>
        </LanguageSelectWrapper>

        <LoginButton onClick={handleLogin} disabled={loading}>
          {loading ? 'Loading...' : 'Existing User? Login'}
        </LoginButton>

        <RegisterButton onClick={handleRegister}>
          New User? Create Account
          <AddIconWrapper>
            <AddIcon />
          </AddIconWrapper>
        </RegisterButton>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        {mode === 'register' && (
          <SwitchMode onClick={() => setMode('login')}>
            Already have an account? Login
          </SwitchMode>
        )}
      </LoginCard>
    </LoginContainer>
  );
};

export default Login;
