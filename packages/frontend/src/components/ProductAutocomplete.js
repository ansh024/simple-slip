import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { priceService } from '../services/api';

const Container = styled.div`
  position: relative;
  flex: 1;
  z-index: 999; /* Increased z-index to ensure it appears above other elements */
`;

const InputField = styled.input`
  padding: 8px;
  border: 1px solid var(--border-color);
  border-radius: 5px;
  font-size: 12px;
  width: 100%;
  &:focus {
    outline: 1px solid var(--primary-color);
  }
`;

const SuggestionsContainer = styled.div`
  position: fixed;
  /* Width, left, top will be set by inline styles */
  /* Removed: width, max-width, margin-top */
  max-height: 300px; /* Increased max-height for a wider dropdown */
  overflow-y: auto;
  background: white;
  border: 1px solid var(--border-color);
  border-radius: 5px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  z-index: 1000; /* Higher z-index than container */
`;

const SuggestionItem = styled.div`
  padding: 8px 12px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover, &.active {
    background-color: #f5f8ff;
  }
  
  ${props => props.$matchType === 'exact' && `
    font-weight: bold;
  `}
  
  ${props => props.$matchType === 'alias' && `
    font-style: italic;
  `}
`;

const ProductName = styled.div`
  flex: 1;
`;

const ProductInfo = styled.div`
  display: flex;
  gap: 8px;
  color: #666;
  font-size: 11px;
`;

const NoResults = styled.div`
  padding: 8px 12px;
  color: #666;
  font-style: italic;
`;

const LoadingText = styled.div`
  padding: 8px 12px;
  color: #666;
`;

const ProductAutocomplete = ({ value, onChange, onSelectProduct, className, placeholder }) => {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null); // Ref for the input field - SINGLE DECLARATION
  const [dropdownStyle, setDropdownStyle] = useState({ display: 'none' }); // Style for the dropdown, initially hidden

  // Effect to sync inputValue with the value prop from parent
  useEffect(() => {
    setInputValue(value || '');
  }, [value]);
  
  // Debounce search to avoid too many API calls
  useEffect(() => {
    console.log('[Autocomplete] inputValue Effect. Current inputValue:', inputValue);
    const timerId = setTimeout(() => {
      const trimmedInput = inputValue.trim();
      if (trimmedInput.length >= 2) {
        console.log('[Autocomplete] inputValue Effect: Setting debouncedQuery to:', trimmedInput);
        setDebouncedQuery(trimmedInput);
      } else {
        console.log('[Autocomplete] inputValue Effect: Input too short. Current debouncedQuery:', debouncedQuery);
        if (debouncedQuery !== '') { // Only update if it's not already empty to avoid loop / unnecessary renders
          console.log('[Autocomplete] inputValue Effect: Clearing debouncedQuery.');
          setDebouncedQuery(''); 
        }
        // Clearing suggestions directly here is also good as a quick UI response
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300); // 300ms debounce
    
    return () => clearTimeout(timerId);
  }, [inputValue]); // Only inputValue as dependency
  
  // Fetch suggestions when debounced query changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      console.log(`[Autocomplete] fetchSuggestions Effect. DebouncedQuery: '${debouncedQuery}', Type: ${typeof debouncedQuery}`);

      // More robust check: ensure it's a string and meets length requirement
      if (typeof debouncedQuery !== 'string' || debouncedQuery.trim().length < 2) {
        console.log(`[Autocomplete] fetchSuggestions: DebouncedQuery is invalid or too short ('${debouncedQuery}'). Clearing suggestions, not fetching.`);
        setSuggestions([]);
        setShowSuggestions(false);
        setLoading(false); // Ensure loading is reset
        return;
      }
      
      try {
        setLoading(true);
        // The 100ms delay here might be for UX, keeping it.
        await new Promise(resolve => setTimeout(resolve, 100)); 
        
        console.log(`[Autocomplete] fetchSuggestions: Calling priceService.searchProducts with query: '${debouncedQuery}'`);
        const response = await priceService.searchProducts(debouncedQuery);
        console.log('[Autocomplete] fetchSuggestions: API Response:', response);

        // safeApiCall in api.js ensures `response` and `response.data` (even if mock) should exist.
        if (response && response.data && response.data.products) {
          setSuggestions(response.data.products);
          setShowSuggestions(response.data.products.length > 0);
        } else {
          console.warn('[Autocomplete] fetchSuggestions: No products in response or malformed data:', response ? response.data : 'No response object');
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch (error) {
        // This catch is less likely to be hit due to safeApiCall in api.js, but included for safety.
        console.error('[Autocomplete] fetchSuggestions: Unexpected error in try block:', error);
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSuggestions();
  }, [debouncedQuery]);
  
  // Handle outside clicks to close suggestions
  // Effect to calculate dropdown position and style
  useEffect(() => {
    if (showSuggestions && inputRef.current) {
      const inputRect = inputRef.current.getBoundingClientRect();
      setDropdownStyle({
        top: `${inputRect.bottom + window.scrollY + 2}px`, // 2px gap below input
        left: '10vw', // Centered: (100vw - 80vw) / 2
        width: '80vw',
        // Optional: Add a max-width for very large screens if 80vw becomes too much
        // maxWidth: '1000px',
      });
    } else {
      // Reset or hide styles when not shown
      setDropdownStyle({ display: 'none' });
    }
  }, [showSuggestions, debouncedQuery]); // Recalculate if suggestions show/hide or content driving them changes

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);
  
  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!showSuggestions) return;
    
    // Arrow down
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    }
    // Arrow up
    else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => prev > 0 ? prev - 1 : 0);
    }
    // Enter
    else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        handleSelectSuggestion(suggestions[activeIndex]);
      } else {
        // If no suggestion is selected, just use the current input value
        handleSelectSuggestion({ name: inputValue, id: null });
        setShowSuggestions(false);
      }
    }
    // Escape
    else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };
  
  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    onChange(e.target.value);
    
    if (e.target.value.length >= 2) {
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
    
    setActiveIndex(-1);
  };
  
  const handleSelectSuggestion = (suggestion) => {
    setInputValue(suggestion.name);
    setShowSuggestions(false);
    
    // Pass the selected product info to parent component
    onSelectProduct({
      id: suggestion.id,
      name: suggestion.name,
      default_unit: suggestion.default_unit || 'kg',
      current_price: suggestion.current_price || ''
    });
  };
  
  const handleInputFocus = () => {
    if (inputValue.length >= 2) {
      setShowSuggestions(true);
    }
  };
  
  // The useEffect for dropdownStyle (calculating 80vw width and centering)
  // is already correctly placed and uses the single inputRef. No changes needed here for that logic.
  // The old dropdownPosition state and its useEffect are removed as they are replaced by dropdownStyle.
  
  return (
    <Container ref={containerRef} className={className}>
      <InputField 
        ref={inputRef} // Assign ref to the input field
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={handleInputFocus}
        placeholder={placeholder || t('productAutocomplete.placeholder')}
      />
      
      {showSuggestions && (
        <SuggestionsContainer style={dropdownStyle}>
          {loading ? (
            <LoadingText>{t('messages.loading')}</LoadingText>
          ) : suggestions.length > 0 ? (
            suggestions.map((suggestion, index) => (
              <SuggestionItem
                key={suggestion.id || index} // Use suggestion.id if available, otherwise index
                onClick={() => handleSelectSuggestion(suggestion)}
                $matchType={suggestion.match_type} // Pass match_type to styled-component
                className={index === activeIndex ? 'active' : ''}
              >
                <ProductName>{suggestion.name}</ProductName>
                <ProductInfo>
                  <span>{suggestion.default_unit || t('units.unit')}</span>
                  {typeof suggestion.current_price === 'number' && (
                    <span>₹{suggestion.current_price.toFixed(2)}</span>
                  )}
                </ProductInfo>
              </SuggestionItem>
            ))
          ) : debouncedQuery ? (
            <NoResults>{t('messages.noMatch')}</NoResults>
          ) : null}
        </SuggestionsContainer>
      )}
    </Container>
  );
};

export default ProductAutocomplete;
