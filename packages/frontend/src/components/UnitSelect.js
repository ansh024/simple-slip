import React from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';

const SelectContainer = styled.div`
  position: relative;
  width: 100%;
`;

const StyledSelect = styled.select`
  width: 100%;
  padding: 8px 24px 8px 8px; /* Padding for layout and arrow space */
  border: 1px solid var(--border-color);
  border-radius: 5px;
  font-size: 12px;
  background-color: white; /* Or transparent if needed, but white is fine */
  appearance: none;
  cursor: pointer;
  color: transparent; /* Make the actual select text transparent */
  /* text-overflow, overflow, white-space are not needed here anymore for the select itself */

  &:focus {
    outline: 1px solid var(--primary-color);
  }
`;

const DisplayedValue = styled.span`
  position: absolute;
  left: 8px; /* Match select's left padding */
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px; /* Match select's font size */
  color: var(--text-primary); /* Or your desired text color */
  pointer-events: none; /* Clicks should go to the select */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: calc(100% - 32px); /* Ensure it doesn't overlap arrow (24px right padding + a bit more) */
`;

const SelectArrow = styled.div`
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  font-size: 10px;
  color: #666;
`;

// Common retail units - values only
const COMMON_UNITS = [
  'kg', 'g', 'lb', 'pc', 'dz', 'box', 'pkt', 'bag', 'btl', 'can', 'tin', 'jar', 
  'l', 'ml', 'set', 'pair', 'bundle', 'roll', 'pack', 'sheet'
];

const UnitSelect = ({ value, onChange, name }) => {
  const { t } = useTranslation();
  
  return (
    <SelectContainer>
      <DisplayedValue>{value ? t(`units_short.${value}`, value) : ''}</DisplayedValue> {/* Display short value */}
      <StyledSelect 
        name={name}
        value={value} 
        onChange={onChange}
      >
        {COMMON_UNITS.map((unit) => (
          <option key={unit} value={unit}>
            {t(`units.${unit}`)} {/* Dropdown shows full value */}
          </option>
        ))}
      </StyledSelect>
      <SelectArrow>▼</SelectArrow>
    </SelectContainer>
  );
};

export default UnitSelect;
