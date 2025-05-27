import React, { useState, useEffect, useCallback } from 'react';
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

const API_URL = process.env.REACT_APP_API_URL || '/api';

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

const Table = styled.table`
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

const Thead = styled.thead`
  background-color: var(--table-header);
  display: table-header-group;
  
  tr:first-child {
    border-top: none;
  }
`;

const Tr = styled.tr``;

const Th = styled.th`
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

const VirtualizedRowContainer = styled.div`
  display: flex;
  align-items: stretch;
  border-bottom: 1px solid var(--border-color);
  background-color: white;

  &:nth-child(even) {
    background-color: #f9f9f9;
  }
  
  &:hover {
    background-color: #f0f7ff;
  }
`;

const VirtualizedCell = styled.div`
  padding: 10px 8px;
  font-size: 14px;
  color: #333;
  box-sizing: border-box;
  display: flex;
  align-items: center;
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
  background-color: ${props => props.updated ? '#4CAF50' : 'transparent'};
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
    updatedPrices,
    handlePriceChange,
    handlePriceFocus,
    handlePriceBlur,
  } = callbacksAndState;

  const isEditingMin = editingStates[`${product.product_id}-min_price`];
  const isEditingFair = editingStates[`${product.product_id}-fair_price`];
  const hasMinUpdate = updatedPrices[`${product.product_id}-min_price`] !== undefined;
  const hasFairUpdate = updatedPrices[`${product.product_id}-fair_price`] !== undefined;

  return (
    <VirtualizedRowContainer style={style}>
      <VirtualizedCell className="product-name">{product.name}</VirtualizedCell>
      <VirtualizedCell className="unit">{product.unit_name || 'N/A'}</VirtualizedCell>
      <VirtualizedCell className="min-price">
        <PriceCell>
          {hasMinUpdate && <UpdateIndicator updated />}
          <PriceInput
            type="number"
            step="0.01"
            min="0"
            value={editingStates[`${product.product_id}-min_price`]?.value !== undefined ? editingStates[`${product.product_id}-min_price`].value : product.min_price}
            onChange={(e) => handlePriceChange(product.product_id, 'min_price', e.target.value)}
            onFocus={() => handlePriceFocus(product.product_id, 'min_price', product.min_price)}
            onBlur={() => handlePriceBlur(product.product_id, 'min_price')}
            $editing={!!isEditingMin}
            data-product-id={product.product_id}
            data-price-type="min_price"
          />
        </PriceCell>
      </VirtualizedCell>
      <VirtualizedCell className="fair-price">
        <PriceCell>
          {hasFairUpdate && <UpdateIndicator updated />}
          <PriceInput
            type="number"
            step="0.01"
            min="0"
            value={editingStates[`${product.product_id}-fair_price`]?.value !== undefined ? editingStates[`${product.product_id}-fair_price`].value : product.fair_price}
            onChange={(e) => handlePriceChange(product.product_id, 'fair_price', e.target.value)}
            onFocus={() => handlePriceFocus(product.product_id, 'fair_price', product.fair_price)}
            onBlur={() => handlePriceBlur(product.product_id, 'fair_price')}
            $editing={!!isEditingFair}
            data-product-id={product.product_id}
            data-price-type="fair_price"
          />
        </PriceCell>
      </VirtualizedCell>
    </VirtualizedRowContainer>
  );
});

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

  const debouncedSavePrice = useCallback(
    debounce(async (productId, priceType, value, originalValue) => {
      const currentProduct = allProducts.find(p => p.product_id === productId);
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
    [t, allProducts]
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
      [key]: { value: currentValue, original: prev[key]?.original !== undefined ? prev[key].original : currentValue }
    }));
  };

  const handlePriceBlur = (productId, priceType) => {
    const key = `${productId}-${priceType}`;
    const state = editingStates[key];
    if (state && state.value !== state.original) {
      const numericValue = parseFloat(state.value);
      if (isNaN(numericValue) || numericValue < 0) {
        toast.error(t('priceBoard.messages.invalidInput'));
        setEditingStates(prev => ({ ...prev, [key]: { value: state.original, original: state.original } }));
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
        const response = await priceService.getTodayPrices();
        const productsArray = (Array.isArray(response.data?.products) ? response.data.products : []).map(p => ({...p, originalMinPrice: p.min_price, originalFairPrice: p.fair_price }));
        setAllProducts(productsArray);
        setFilteredProducts(productsArray);
        // Initialize editingStates with original values
        const initialEditingStates = {};
        productsArray.forEach(p => {
          initialEditingStates[`${p.product_id}-min_price`] = { value: p.min_price, original: p.min_price };
          initialEditingStates[`${p.product_id}-fair_price`] = { value: p.fair_price, original: p.fair_price };
        });
        setEditingStates(initialEditingStates);

      } catch (err) {
        setError(t('priceBoard.errors.fetchFailed'));
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
      const lowerSearchTerm = searchTerm.toLowerCase();
      currentProducts = currentProducts.filter(product =>
        product.name.toLowerCase().includes(lowerSearchTerm) ||
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
    const resetStates = {};
    allProducts.forEach(p => {
        resetStates[`${p.product_id}-min_price`] = { value: p.originalMinPrice, original: p.originalMinPrice };
        resetStates[`${p.product_id}-fair_price`] = { value: p.originalFairPrice, original: p.originalFairPrice };
    });
    setEditingStates(resetStates);
    setUpdatedPrices({});
    toast.info(t('priceBoard.messages.changesReset'));
  };

  const itemDataForList = {
    editingStates,
    updatedPrices,
    handlePriceChange,
    handlePriceFocus,
    handlePriceBlur,
    t,
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
      <Header />
      <PageContainer>
        <PriceBoardHeader>
          <Title>{t('priceBoard.title')}</Title>
        </PriceBoardHeader>

        <div style={{ marginBottom: '20px' }}>
          <SearchInput 
            type="text"
            placeholder={t('priceBoard.searchPlaceholder')}
            value={searchTerm}
            onChange={handleSearchChange}
          />
          {error && <ErrorMessage>{error}</ErrorMessage>}
          <FilterToggle>
            <ToggleButton
              $active={showUpdatedOnly}
              onClick={handleToggleUpdated}
            >
              {showUpdatedOnly ? t('priceBoard.showAll') : t('priceBoard.showEdited')}
            </ToggleButton>
          </FilterToggle>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : (
          <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            <Table>
              <Thead>
                <Tr>
                  <Th>{t('priceBoard.headers.product')}</Th>
                  <Th>{t('priceBoard.headers.unit')}</Th>
                  <Th>{t('priceBoard.headers.minPrice')}</Th>
                  <Th>{t('priceBoard.headers.fairPrice')}</Th>
                </Tr>
              </Thead>
            </Table>
            <div style={{ flexGrow: 1, width: '100%', border: '1px solid var(--border-color)', borderTop: 'none', borderRadius: '0 0 8px 8px', overflow: 'hidden', background: 'white' }}>
              {filteredProducts.length > 0 ? (
                <AutoSizer>
                  {({ height, width }) => (
                    <FixedSizeList
                      height={height}
                      itemCount={filteredProducts.length}
                      itemSize={75} 
                      width={width}
                      itemData={{ items: filteredProducts, callbacksAndState: itemDataForList }}
                    >
                      {Row}
                    </FixedSizeList>
                  )}
                </AutoSizer>
              ) : (
                <NoResults>
                  {searchTerm ? t('priceBoard.noResults', { searchTerm }) : t('priceBoard.noProducts')}
                </NoResults>
              )}
            </div>
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
      </PageContainer>
      <Footer />
    </>
  );
};

export default PriceBoardNew;
