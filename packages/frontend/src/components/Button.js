import React from 'react';
import styled from 'styled-components';

// Using styled-components transient props (with $ prefix) to prevent DOM forwarding
const StyledButton = styled.button`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  padding: 5px 10px;
  background: ${props => props.$variant === 'primary' ? 'var(--primary-color)' : 'var(--white)'};
  color: ${props => props.$variant === 'primary' ? 'var(--white)' : 'var(--text-color)'};
  border-radius: 10px;
  font-weight: 500;
  font-size: 12px;
  box-shadow: ${props => props.$shadow ? 'var(--shadow)' : 'none'};
  border: ${props => props.$outline ? '1px solid var(--text-light)' : 'none'};
  height: ${props => props.$size === 'large' ? '50px' : '25px'};
  width: ${props => props.$fullWidth ? '100%' : 'auto'};
`;

const Button = ({ 
  children, 
  variant = 'primary', 
  onClick, 
  shadow = true, 
  outline = false,
  size = 'small',
  fullWidth = false,
  ...props 
}) => {
  return (
    <StyledButton 
      $variant={variant} 
      onClick={onClick} 
      $shadow={shadow} 
      $outline={outline}
      $size={size}
      $fullWidth={fullWidth}
      {...props}
    >
      {children}
    </StyledButton>
  );
};

export default Button;
