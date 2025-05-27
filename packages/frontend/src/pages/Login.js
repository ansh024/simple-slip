import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';

const LoginContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
  background-color: var(--secondary-color);
`;

const LoginCard = styled.div`
  width: 100%;
  max-width: 320px;
  background: var(--white);
  border-radius: 10px;
  padding: 24px;
  box-shadow: var(--shadow);
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 20px;
`;

const LogoIcon = styled.div`
  width: 21px;
  height: 13px;
  outline: 3px solid var(--primary-color);
  outline-offset: -1.5px;
`;

const LogoText = styled.div`
  color: var(--primary-color);
  font-size: 18px;
  font-family: 'Nunito', sans-serif;
  font-weight: 700;
`;

const Title = styled.h2`
  font-size: 18px;
  font-weight: 600;
  text-align: center;
  margin-bottom: 10px;
  color: var(--text-color);
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const Label = styled.label`
  font-size: 14px;
  color: var(--text-color);
  font-weight: 500;
`;

const Input = styled.input`
  padding: 10px;
  border: 1px solid var(--border-color);
  border-radius: 5px;
  font-size: 14px;
  &:focus {
    outline: 1px solid var(--primary-color);
  }
`;

const ErrorMessage = styled.div`
  color: red;
  font-size: 12px;
  margin-top: 5px;
`;

const SwitchMode = styled.div`
  font-size: 14px;
  text-align: center;
  margin-top: 10px;
  cursor: pointer;
  color: var(--primary-color);
`;

const Login = () => {
  const { login, simpleLogin, register, error } = useAuth();
  const navigate = useNavigate();
  
  const [mode, setMode] = useState('simpleLogin'); // simpleLogin, login, register
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    shopName: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (mode === 'simpleLogin') {
        await simpleLogin(formData.phone);
      } else if (mode === 'login') {
        await login({ phone: formData.phone, password: formData.password });
      } else {
        await register(formData);
      }
      navigate('/');
    } catch (err) {
      console.error('Auth error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginContainer>
      <LoginCard>
        <LogoContainer>
          <LogoIcon />
          <LogoText>Simple Slip</LogoText>
        </LogoContainer>

        <Title>
          {mode === 'simpleLogin' ? 'Quick Login' : 
           mode === 'login' ? 'Login' : 'Register'}
        </Title>

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <InputGroup>
              <Label>Full Name</Label>
              <Input 
                type="text" 
                name="name" 
                value={formData.name} 
                onChange={handleChange}
                required
              />
            </InputGroup>
          )}

          <InputGroup>
            <Label>Phone Number</Label>
            <Input 
              type="tel" 
              name="phone" 
              value={formData.phone} 
              onChange={handleChange}
              required
            />
          </InputGroup>

          {(mode === 'login' || mode === 'register') && (
            <InputGroup>
              <Label>Password</Label>
              <Input 
                type="password" 
                name="password" 
                value={formData.password} 
                onChange={handleChange}
                required
              />
            </InputGroup>
          )}

          {mode === 'register' && (
            <InputGroup>
              <Label>Shop Name</Label>
              <Input 
                type="text" 
                name="shopName" 
                value={formData.shopName} 
                onChange={handleChange}
                required
              />
            </InputGroup>
          )}

          {error && <ErrorMessage>{error}</ErrorMessage>}

          <Button 
            type="submit" 
            fullWidth 
            size="large" 
            style={{ marginTop: '20px' }}
            disabled={loading}
          >
            {loading ? 'Please wait...' : 
              mode === 'simpleLogin' ? 'Continue with Phone' : 
              mode === 'login' ? 'Login' : 'Register'}
          </Button>
        </form>

        {mode === 'simpleLogin' && (
          <>
            <SwitchMode onClick={() => setMode('login')}>
              Login with password
            </SwitchMode>
            <SwitchMode onClick={() => setMode('register')}>
              New user? Register here
            </SwitchMode>
          </>
        )}

        {mode === 'login' && (
          <>
            <SwitchMode onClick={() => setMode('simpleLogin')}>
              Quick login with phone
            </SwitchMode>
            <SwitchMode onClick={() => setMode('register')}>
              New user? Register here
            </SwitchMode>
          </>
        )}

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
