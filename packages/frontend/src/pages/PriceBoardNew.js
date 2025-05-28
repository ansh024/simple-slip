import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { priceService } from '../services/api';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Button from '../components/Button';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { debounce } from 'lodash';
import { FixedSizeList } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';


// Styled Components
const PageContainer = styled.div`
  min-height: 100vh;
  padding: 70px 20px 80px;
  background-color: var(--secondary-color);
  display: flex;
  flex-direction: column;
`;

const PriceBoardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const Title = styled.h1`
  font-size: 18px;
  font-weight: 600;
  color: #333;
`;

const SearchInput = styled.input`
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 20px;
  width: 100%;
  max-width: 350px;
  font-size: 14px;
  margin-bottom: 16px;
  
  &:focus {
    outline: none;
    border-color: var(--primary-color);
  }
`;

const Table = styled.div.attrs(() => ({ role: 'table' }))`
  display: table;
  width: 100%;
  table-layout: fixed;
  border-collapse: separate;
  border-radius: 8px 8px 0 0;
  overflow: hidden;
  background-color: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-top: 0;
  border-spacing: 0;
  border: 1px solid var(--border-color);
  border-bottom: none;
`;

const Thead = styled.div.attrs(() => ({ role: 'rowgroup' }))`
  background-color: var(--table-header);
  display: table-header-group;
  
  tr:first-child {
    border-top: none;
  }
`;

const Tr = styled.div.attrs(() => ({ role: 'row' }))`
  display: table-row;
`;

const Th = styled.div.attrs(() => ({ role: 'columnheader' }))`
  display: table-cell;
  padding: 12px 8px;
  text-align: left;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  white-space: nowrap;
  border-bottom: 2px solid var(--border-color);
  &:nth-child(1) { width: 40%; }
  &:nth-child(2) { width: 20%; }
  &:nth-child(3) { width: 20%; }
  &:nth-child(4) { width: 20%; }
`;

const VirtualizedRowContainer = styled.div.attrs(() => ({ role: 'row' }))`
  display: flex; /* Changed from table-row */
  align-items: center; /* Added for flex vertical alignment */
  border-bottom: 1px solid var(--border-color);
  background-color: white;

  &:nth-child(even) {
    background-color: #f9f9f9;
  }
  
  &:hover {
    background-color: #f0f7ff;
  }
`;

const VirtualizedCell = styled.div.attrs(() => ({ role: 'cell' }))`
  padding: 10px 8px;
  font-size: 14px;
  color: #333;
  box-sizing: border-box;
  /* display: table-cell; Removed */
  /* vertical-align: middle; Removed, handled by flex align-items on container */
  word-break: break-word;

  &.product-name { width: 40%; }
  &.unit { width: 20%; }
  &.min-price { width: 20%; min-width: 75px; }
  &.fair-price { width: 20%; min-width: 75px; }
`;

const PriceInput = styled.input`
  width: 100%;
  box-sizing: border-box;
  padding: ${props => props.$editing ? '6px 20px 6px 6px' : '6px 8px 6px 6px'};
  border: 1px solid transparent;
  border-radius: 4px;
  font-size: 14px;
  text-align: left;
  background-color: ${props => props.$editing ? '#fff' : 'transparent'};
  -moz-appearance: textfield;
  
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  
  &:focus {
    outline: none;
    border-color: var(--primary-color);
    background-color: white;
  }
  
  &:hover:not(:focus) {
    background-color: ${props => props.$editing ? '#fff' : '#f0f0f0'};
  }
`;

const PriceCell = styled.div`
  display: flex;
  align-items: center;
  position: relative;
  width: 100%;
  justify-content: flex-start;
`;

const UpdateIndicator = styled.div`
  position: absolute;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${props => props.$updated ? 'var(--accent-color)' : 'transparent'};
  right: 2px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 2;
`;

const ActionButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
  padding: 0 20px;
`;

const NoResults = styled.div`
  text-align: center;
  padding: 20px;
  color: #666;
  font-style: italic;
  width: 100%;
`;

const FilterToggle = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-bottom: 0;
`;

const ToggleButton = styled.button`
  background-color: ${props => props.$active ? 'var(--primary-color)' : '#f0f0f0'};
  color: ${props => props.$active ? 'white' : '#333'};
  border: none;
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 12px;
  cursor: pointer;
  margin-left: 8px;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${props => props.$active ? '#0040CC' : '#e0e0e0'};
  }
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  width: 100%;
  
  &:after {
    content: '';
    width: 30px;
    height: 30px;
    border: 2px solid #f3f3f3;
    border-top: 2px solid var(--primary-color);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const ErrorMessage = styled.div`
  background-color: #FFEBEE;
  color: #D32F2F;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 16px;
  font-size: 14px;
`;

// Row component for FixedSizeList
const Row = React.memo(({ index, style, data }) => {
  
  const product = data.items[index];
  const { callbacksAndState } = data;
  const {
    editingStates,
    updatedPrices, // Now correctly passed and destructured
    handlePriceChange,
    handleFocus,   // Changed from handlePriceFocus
    handleBlur,    // Changed from handlePriceBlur
  } = callbacksAndState;

  // Use product.id instead of product.product_id
  // Add safety check for updatedPrices before accessing its properties
  const isEditingMin = editingStates[`${product.id}-min_price`];
  const isEditingFair = editingStates[`${product.id}-fair_price`];
  const hasMinUpdate = updatedPrices && updatedPrices[`${product.id}-min_price`] !== undefined;
  const hasFairUpdate = updatedPrices && updatedPrices[`${product.id}-fair_price`] !== undefined;

  return (
    <VirtualizedRowContainer style={style}>
      <VirtualizedCell className="product-name">{product.name}</VirtualizedCell>
      {/* Use product.default_unit instead of product.unit_name */}
      <VirtualizedCell className="unit">{product.default_unit || 'N/A'}</VirtualizedCell>
      <VirtualizedCell className="min-price">
        <PriceCell>
          {hasMinUpdate && <UpdateIndicator $updated />}
          <PriceInput
            type="number"
            step="0.01"
            min="0"
            value={String(editingStates[`${product.id}-min_price`]?.value ?? product.min_price ?? '')}
            onChange={(e) => handlePriceChange(product.id, 'min_price', e.target.value)}
            onFocus={() => handleFocus(product.id, 'min_price', product.min_price)} // Use handleFocus
            onBlur={() => handleBlur(product.id, 'min_price')}                     // Use handleBlur
            $editing={!!isEditingMin}
            data-product-id={product.id} // Use product.id
            data-price-type="min_price"
          />
        </PriceCell>
      </VirtualizedCell>
      <VirtualizedCell className="fair-price">
        <PriceCell>
          {hasFairUpdate && <UpdateIndicator $updated />}
          <PriceInput
            type="number"
            step="0.01"
            min="0"
            value={String(editingStates[`${product.id}-fair_price`]?.value ?? product.fair_price ?? '')}
            onChange={(e) => handlePriceChange(product.id, 'fair_price', e.target.value)}
            onFocus={() => handleFocus(product.id, 'fair_price', product.fair_price)} // Use handleFocus
            onBlur={() => handleBlur(product.id, 'fair_price')}                     // Use handleBlur
            $editing={!!isEditingFair}
            data-product-id={product.id} // Use product.id
            data-price-type="fair_price"
          />
        </PriceCell>
      </VirtualizedCell>
    </VirtualizedRowContainer>
  );
});

const ControlsContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  margin-bottom: 10px;
  background-color: #f8f9fa; // Example style, adjust as needed
`;

const PriceBoardNew = () => {
  const { t } = useTranslation();
  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingStates, setEditingStates] = useState({}); 
  const [updatedPrices, setUpdatedPrices] = useState({}); 
  const [showUpdatedOnly, setShowUpdatedOnly] = useState(false);
  const [saveInProgress, setSaveInProgress] = useState(false); // Added missing state

  const allProductsRef = useRef(allProducts);

  useEffect(() => {
    allProductsRef.current = allProducts;
  }, [allProducts]);

  const debouncedSavePrice = useCallback(
    debounce(async (productId, priceType, value, originalValue) => {
      const currentProduct = allProductsRef.current.find(p => p.product_id === productId);
      if (!currentProduct) return;

      let minPrice = priceType === 'min_price' ? parseFloat(value) : parseFloat(currentProduct.min_price);
      let fairPrice = priceType === 'fair_price' ? parseFloat(value) : parseFloat(currentProduct.fair_price);

      if (priceType === 'min_price' && fairPrice < minPrice) {
        fairPrice = minPrice;
      }
      if (priceType === 'fair_price' && minPrice > fairPrice) {
        toast.error(t('priceBoard.messages.invalidPrices'));
        setEditingStates(prev => ({
          ...prev,
          [`${productId}-${priceType}`]: { value: originalValue, original: originalValue }
        }));
        return;
      }

      try {
        await priceService.updatePrice(productId, { min_price: minPrice, fair_price: fairPrice });
        toast.success(t('priceBoard.messages.priceUpdatedSuccess', { productName: currentProduct.name }));
        setUpdatedPrices(prev => ({ ...prev, [`${productId}-${priceType}`]: value }));
        setAllProducts(prevAll => prevAll.map(p => 
          p.product_id === productId ? { ...p, min_price: minPrice, fair_price: fairPrice, originalMinPrice: minPrice, originalFairPrice: fairPrice } : p
        ));
      } catch (err) {
        toast.error(t('priceBoard.messages.priceUpdatedError', { productName: currentProduct.name }));
        setEditingStates(prev => ({
          ...prev,
          [`${productId}-${priceType}`]: { value: originalValue, original: originalValue }
        }));
      }
    }, 800),
    [t, priceService, toast, setUpdatedPrices, setAllProducts, setEditingStates] // Add stable dependencies
  );

  const handlePriceChange = (productId, priceType, value) => {
    setEditingStates(prev => {
      const key = `${productId}-${priceType}`;
      const product = allProducts.find(p => p.product_id === productId);
      const originalVal = product ? product[priceType] : undefined;
      return {
        ...prev,
        [key]: { value: value, original: prev[key]?.original !== undefined ? prev[key].original : originalVal }
      };
    });
  };

  const handlePriceFocus = (productId, priceType, currentValue) => {
    const key = `${productId}-${priceType}`;
    setEditingStates(prev => ({
      ...prev,
      [key]: { value: String(currentValue ?? ''), original: String(prev[key]?.original !== undefined ? prev[key].original : currentValue ?? '') }
    }));
  };

  const handlePriceBlur = (productId, priceType) => {
    const key = `${productId}-${priceType}`;
    const state = editingStates[key];
    if (state && state.value !== state.original) {
      const numericValue = parseFloat(state.value);
      if (isNaN(numericValue) || numericValue < 0) {
        toast.error(t('priceBoard.messages.invalidInput'));
        setEditingStates(prev => ({ ...prev, [key]: { value: String(state.original ?? ''), original: String(state.original ?? '') } }));
      } else {
        debouncedSavePrice(productId, priceType, numericValue, state.original);
      }
    }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await priceService.getProducts();
        const rawProducts = response.data?.products;
        const productsArray = (Array.isArray(rawProducts) ? rawProducts : []).map(p => ({
          ...p,                      // Spread all original properties from API
          product_id: p.id,         // Explicitly map API 'id' to 'product_id'
          min_price: p.minimum_price,  // Use API's 'minimum_price'
          fair_price: p.fair_price,   // Use API's 'fair_price'
          originalMinPrice: p.minimum_price, // Store original from API's 'minimum_price'
          originalFairPrice: p.fair_price    // Store original from API's 'fair_price'
        }));
        setAllProducts(productsArray);
        setFilteredProducts(productsArray);
        // Initialize editingStates with original values
        const initialEditingStates = {};
        productsArray.forEach(p => {
          initialEditingStates[`${p.product_id}-min_price`] = { value: String(p.min_price ?? ''), original: String(p.min_price ?? '') };
          initialEditingStates[`${p.product_id}-fair_price`] = { value: String(p.fair_price ?? ''), original: String(p.fair_price ?? '') };
        });
        setEditingStates(initialEditingStates);

      } catch (err) {
        setError(t('priceBoard.errors.fetchError'));
        setAllProducts([]);
        setFilteredProducts([]);
        toast.error(t('priceBoard.errors.fetchFailed'));
      }
      setLoading(false);
    };
    fetchInitialData();
  }, [t]);

  useEffect(() => {
    let currentProducts = [...allProducts];
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.trim().toLowerCase();
      currentProducts = currentProducts.filter(product =>
        product.name.trim().toLowerCase().includes(lowerSearchTerm) ||
        (product.aliases && product.aliases.some(alias => alias.toLowerCase().includes(lowerSearchTerm)))
      );
    }
    if (showUpdatedOnly) {
      currentProducts = currentProducts.filter(product => 
        Object.keys(updatedPrices).some(key => key.startsWith(String(product.product_id))) // Ensure product_id is string for comparison
      );
    }
    setFilteredProducts(currentProducts);
  }, [searchTerm, allProducts, showUpdatedOnly, updatedPrices]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleToggleUpdated = () => {
    setShowUpdatedOnly(!showUpdatedOnly);
  };

  const saveAllChanges = async () => {
    setSaveInProgress(true);
    toast.info(t('priceBoard.messages.savingAll'));
    let allSucceeded = true;
    for (const key in editingStates) {
      if (editingStates.hasOwnProperty(key)) {
        const state = editingStates[key];
        if (state.value !== state.original) {
          const [productIdStr, priceType] = key.split('-');
          const productId = parseInt(productIdStr, 10); // Or String(), depending on product_id type
          const numericValue = parseFloat(state.value);
          if (!isNaN(numericValue) && numericValue >= 0) {
            try {
              // Directly call the save logic, bypassing debounce for immediate save all
              const currentProduct = allProducts.find(p => p.product_id === productId);
              if (!currentProduct) continue;

              let minPrice = priceType === 'min_price' ? numericValue : parseFloat(currentProduct.min_price);
              let fairPrice = priceType === 'fair_price' ? numericValue : parseFloat(currentProduct.fair_price);
                        
              if (priceType === 'min_price' && fairPrice < minPrice) fairPrice = minPrice;
              if (priceType === 'fair_price' && minPrice > fairPrice) {
                toast.error(`${t('priceBoard.messages.invalidPrices')} for ${currentProduct.name}`); allSucceeded = false; continue;
              }

              await priceService.updatePrice(productId, { min_price: minPrice, fair_price: fairPrice });
              setUpdatedPrices(prev => ({ ...prev, [`${productId}-${priceType}`]: numericValue }));
              setAllProducts(prevAll => prevAll.map(p => 
                p.product_id === productId ? { ...p, min_price: minPrice, fair_price: fairPrice, originalMinPrice: minPrice, originalFairPrice: fairPrice } : p
              ));
              // Update editing state to reflect saved value as new original
              setEditingStates(prev => ({...prev, [key]: {value: numericValue, original: numericValue}}));

            } catch (err) {
              allSucceeded = false;
              toast.error(t('priceBoard.messages.priceUpdatedError', { productName: allProducts.find(p=>p.product_id === productId)?.name || 'Unknown Product' }));
            }
          }
        }
      }
    }
    if(allSucceeded) toast.success(t('priceBoard.messages.saveAllSuccess'));
    else toast.warn(t('priceBoard.messages.saveAllPartialSuccess'));
    setSaveInProgress(false);
  };

  const resetChanges = () => {
    const newEditingStates = { ...editingStates };
    let changesWereMade = false;
    for (const key in newEditingStates) {
      if (newEditingStates[key].value !== newEditingStates[key].original) {
        newEditingStates[key].value = newEditingStates[key].original;
        changesWereMade = true;
      }
    }
    if (changesWereMade) {
      setEditingStates(newEditingStates);
      toast.info(t('priceBoard.messages.changesReset'));
    } else {
      // Optionally, inform the user if there's nothing to reset
      // toast.info(t('priceBoard.messages.noChangesToReset'));
    }
  };

  const handleFocus = (productId, priceType) => {
    // Placeholder: Logic for when an input gains focus
    // console.log(`Focus on product: ${productId}, type: ${priceType}`);
  };

  const handleBlur = (productId, priceType, value) => {
    // Placeholder: Logic for when an input loses focus (e.g., validation, formatting)
    // console.log(`Blur on product: ${productId}, type: ${priceType}, value: ${value}`);
    // You might want to update editingStates here or perform validation
  };

  // Data to pass to each Row item in the virtualized list
  const itemDataForList = {
    items: filteredProducts, // items are already passed via filteredProducts to FixedSizeList's itemData.items
    editingStates,
    updatedPrices, // Added updatedPrices
    handlePriceChange,
    handleFocus,
    handleBlur,
    t,
    allProducts // Assuming Row might need this for context
  };

  return (
    <PageContainer>
      <Header />
      <ControlsContainer>
        <SearchInput
          type="text"
          placeholder={t('priceBoard.searchPlaceholder')}
          value={searchTerm}
          onChange={handleSearchChange}
        />
        <ToggleButton onClick={handleToggleUpdated} $active={showUpdatedOnly}>
          {t('priceBoard.showUpdatedOnly')}
        </ToggleButton>
      </ControlsContainer>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Table>
            <Thead>
              <Tr>
                <Th>Item Name</Th>
                <Th>{t('priceBoard.headers.unit')}</Th>
                <Th>Min (Rs.)</Th>
                <Th>Fair (Rs.)</Th>
              </Tr>
            </Thead>
            {/* Table body wrapper for virtualization */}
            <div role="rowgroup" style={{ display: 'table-row-group', flex: 1, minHeight: 0 }}> {/* This div acts as the table body */}
              {console.log('filteredProducts.length:', filteredProducts.length) /* <-- ADD THIS LINE */}
              {filteredProducts.length > 0 ? (
                <AutoSizer>
                  {({ height, width }) => {
                    console.log('AutoSizer dimensions:', { height, width });
                    return (
                      <FixedSizeList
                        height={height}
                        itemCount={filteredProducts.length}
                        itemSize={75} 
                        width={width}
                        itemData={{ items: filteredProducts, callbacksAndState: itemDataForList }}
                      >
                        {Row}
                      </FixedSizeList>
                    );
                  }}
                </AutoSizer>
              ) : (
                <NoResults>
                  {searchTerm ? t('priceBoard.noResults', { searchTerm }) : t('priceBoard.noProducts')}
                </NoResults>
              )}
            </div>
          </Table>
        </div>
      )}

      {Object.values(editingStates).some(state => state.value !== state.original) && (
        <ActionButtons>
          <Button onClick={saveAllChanges} disabled={saveInProgress}>
            {saveInProgress ? t('priceBoard.saving') : t('priceBoard.saveAll')}
          </Button>
          <Button onClick={resetChanges} variant="outlined">
            {t('priceBoard.resetAll')}
          </Button>
        </ActionButtons>
      )}
      <Footer />
    </PageContainer>
  );
};

export default PriceBoardNew;
