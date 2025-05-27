import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { slipService, priceService, voiceService } from '../services/api';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Button from '../components/Button';
import ProductAutocomplete from '../components/ProductAutocomplete';
import UnitSelect from '../components/UnitSelect';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const PageContainer = styled.div`
  min-height: 100vh;
  padding: 70px 20px 80px;
  background-color: var(--secondary-color);
  display: flex;
  flex-direction: column;
`;

const SlipTable = styled.div`
  width: 100%;
  border-radius: 10px;
  border: 1px solid var(--border-color);
  overflow: hidden;
  margin-bottom: 20px;
`;

const TableHeader = styled.div`
  display: flex;
  background: var(--table-header);
  border-bottom: 1px solid var(--border-color);
`;

const TableCell = styled.div`
  padding: 6px 8px;
  font-size: 10px;
  font-weight: 500;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 28px;
  ${props => props.$border && `border-right: 1px solid var(--border-dark);`}
  width: ${props => props.width || 'auto'};
  flex: ${props => props.flex || 'none'};
  text-align: center;
  overflow: ${props => props.$ellipsis ? 'hidden' : 'visible'};
  text-overflow: ${props => props.$ellipsis ? 'ellipsis' : 'clip'};
  white-space: ${props => props.$ellipsis ? 'nowrap' : 'normal'};
`;

const TableRow = styled.div`
  display: flex;
  background: white;
  border-bottom: 1px solid var(--border-color);
`;

const AddItemRow = styled.div`
  display: flex;
  background: var(--white);
  padding: 10px;
  /* gap: 5px; // We'll use margins or flex-grow on a spacer for more control */
  align-items: center;
  width: 100%;
  justify-content: space-between; /* Distribute space if total width < 100% */

  /* Target specific children for width control */
  /* Assuming ProductAutocomplete, Input (qty), UnitSelect, Input (price), Button order */
  
  > .product-autocomplete-wrapper { /* Wrapper for ProductAutocomplete */
    flex-basis: 40%;
    margin-right: 2%; /* Spacing */
  }
  
  > .qty-input-wrapper { /* Wrapper for Qty Input */
    flex-basis: 15%;
    margin-right: 2%; /* Spacing */
  }

  > .unit-select-wrapper { /* Wrapper for UnitSelect */
    flex-basis: 15%;
    margin-right: 2%; /* Spacing */
  }

  > .price-input-wrapper { /* Wrapper for Price Input */
    flex-basis: 20%;
    margin-right: 2%; /* Spacing, if add button is not taking remaining space */
  }

  /* The add button can take the remaining space or have a fixed width */
  > button {
    flex-basis: auto; /* Or a fixed width like 40px */
    flex-grow: 0;
    flex-shrink: 0;
    padding: 8px; /* Adjust padding for the button if needed */
    min-width: 40px; /* Ensure button has a minimum width */
  }
`;

const Input = styled.input`
  padding: 8px;
  border: 1px solid var(--border-color);
  border-radius: 5px;
  font-size: 12px;
  /* flex: 1; // Remove default flex: 1 so flex-basis can take effect */
  width: 100%; /* Make input take full width of its wrapper */
  box-sizing: border-box; /* Include padding and border in the element's total width and height */
  &:focus {
    outline: 1px solid var(--primary-color);
  }
  &.input-full-width {
    /* This class is just a marker, actual width is controlled by wrapper */
  }
`;

// Ensure ProductAutocomplete and UnitSelect also take full width of their wrappers
// This might require adding a style prop or ensuring their root element does this by default.
// For styled-components, they usually accept className.
// We'll add specific classes to them and ensure their internal styling allows width: 100%.

const StyledProductAutocomplete = styled(ProductAutocomplete)`
  width: 100%;
`;

const StyledUnitSelect = styled(UnitSelect)`
  width: 100%;
`;

const ActionRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
  padding: 0 10px;
`;

const BottomRow = styled.div`
  display: flex;
  align-items: center;
  margin-top: auto;
  padding: 10px;
`;

const TotalSection = styled.div`
  flex: 1;
  padding: 10px;
  background: var(--white);
  border-radius: 10px;
  border: 1px solid var(--border-color);
`;

const TotalRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
`;

const TotalLabel = styled.div`
  font-size: 14px;
  font-weight: 500;
`;

const TotalValue = styled.div`
  font-size: 14px;
  font-weight: 600;
`;

const VoiceButton = styled(Button)`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.2);
  margin-left: 15px;
  background-color: #F68822;
`;

// Removed unused AddButton component

const CustomerInfo = styled.div`
  margin-bottom: 15px;
`;

const QuickSlip = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState({
    name: '',
    qty: '',
    unit: 'kg',
    rate: '',
    product_id: null // New field to store product ID if selected from suggestions
  });
  const [customerName, setCustomerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [products, setProducts] = useState([]);
  const [slipNumber, setSlipNumber] = useState('New');
  const [fetchingSlipNumber, setFetchingSlipNumber] = useState(true);

  useEffect(() => {
    // Fetch products for auto-suggestion
    const fetchProducts = async () => {
      try {
        const response = await priceService.getProducts();
        if (response.data && response.data.products) {
          setProducts(response.data.products);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };

    fetchProducts();
  }, []);

  const fetchAndSetNextSlipNumber = async () => {
    try {
      setFetchingSlipNumber(true);
      const response = await slipService.getNextSlipNumber();
      if (response.data && response.data.nextNumber) {
        setSlipNumber(response.data.nextNumber);
      }
    } catch (error) {
      console.error('Error fetching next slip number:', error);
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      setSlipNumber(`${new Date().getFullYear().toString().substring(2)}${randomSuffix}`);
    } finally {
      setFetchingSlipNumber(false);
    }
  };

  // Fetch the next slip number on initial load
  useEffect(() => {
    fetchAndSetNextSlipNumber();
  }, []);

  const calculateTotal = () => {
    return items.reduce((total, item) => {
      return total + (item.qty * item.rate);
    }, 0);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewItem(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // New handler for product selection from autocomplete
  const handleProductSelect = (product) => {
    setNewItem(prev => ({
      ...prev,
      name: product.name,
      product_id: product.id,
      unit: product.default_unit || prev.unit,
      rate: product.current_price || prev.rate
    }));
  };

  const handleAddItem = () => {
    if (!newItem.name || !newItem.qty || !newItem.unit || !newItem.rate) {
      alert('Please fill in all item details');
      return;
    }

    const updatedItems = [...items, {
      ...newItem,
      qty: parseFloat(newItem.qty),
      rate: parseFloat(newItem.rate),
      line_total: parseFloat(newItem.qty) * parseFloat(newItem.rate),
      // Include product_id if we selected from suggestions
      product_id: newItem.product_id
    }];

    setItems(updatedItems);
    setNewItem({
      name: '',
      qty: '',
      unit: 'kg',
      rate: '',
      product_id: null
    });
  };
  
  // Add keyboard event listener for Enter key
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Enter') {
        // Only trigger if not in customer name field (which should submit on its own)
        if (document.activeElement.placeholder !== 'Customer Name (Optional)') {
          handleAddItem();
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    // Clean up event listener on component unmount
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleAddItem]); // Include handleAddItem in the dependency array

  const handleRemoveItem = (index) => {
    const updatedItems = [...items];
    updatedItems.splice(index, 1);
    setItems(updatedItems);
  };

  const handleVoiceInput = async () => {
    setRecording(true);
    // In a real app, we would start recording here
    // For now, we'll simulate with a timeout
    
    setTimeout(async () => {
      try {
        // Simulate sending audio to backend
        // In a real app, we would send the actual audio data
        const response = await voiceService.processVoice(null, 'hi-IN');
        
        if (response.data && response.data.items) {
          const voiceItems = response.data.items.map(item => ({
            name: item.name,
            qty: parseFloat(item.qty),
            unit: item.unit,
            rate: parseFloat(item.rate),
            line_total: parseFloat(item.qty) * parseFloat(item.rate)
          }));
          
          setItems([...items, ...voiceItems]);
        }
      } catch (error) {
        console.error('Error processing voice:', error);
        alert(t('messages.voiceError'));
      } finally {
        setRecording(false);
      }
    }, 2000);
  };

  const resetSlipForm = () => {
    setItems([]);
    setNewItem({ name: '', qty: '', unit: 'kg', rate: '', product_id: null });
    setCustomerName('');
    fetchAndSetNextSlipNumber();
    // Consider scrolling to the top or a specific input field for better UX
    // window.scrollTo(0, 0);
  };

  const handleSaveSlip = async () => {
    if (items.length === 0) {
      toast.warning(t('messages.addItems') || 'Please add at least one item');
      return;
    }

    setLoading(true);
    try {
      // Create slip data with required format
      const slipData = {
        customerName: customerName || 'Walk-in Customer',
        items: items.map(item => ({
          name: item.name,
          qty: item.qty,
          unit: item.unit,
          rate: item.rate,
          product_id: item.product_id || null
        })),
        discount: 0,
        gstRequired: false
      };

      console.log('Sending slip data:', JSON.stringify(slipData));
      
      // Try saving as a draft first in case the server is having issues
      try {
        // Save as draft in localStorage for backup
        const draftSlips = JSON.parse(localStorage.getItem('draftSlips') || '[]');
        const draftId = `draft-${Date.now()}`;
        const draftSlip = {
          ...slipData,
          id: draftId,
          draftId: draftId,
          created_at: new Date().toISOString(),
          slip_date: new Date().toISOString()
        };
        draftSlips.push(draftSlip);
        localStorage.setItem('draftSlips', JSON.stringify(draftSlips));
      } catch (draftError) {
        console.warn('Could not save draft backup:', draftError);
      }
      
      // Try sending to server
      const response = await slipService.createSlip(slipData);
      if (response.data && response.data.slip) {
        toast.success(t('messages.success') || 'Slip saved successfully!');
        resetSlipForm(); // Reset form for new entry
      } else {
        // Handle unexpected response format - user stays on page with data
        toast.warning('Slip may have been saved, but the response was unexpected. Please check Books or try saving again if necessary.');
        // No navigation, no form reset here, user can see their data
      }
    } catch (error) {
      console.error('Error saving slip:', error);
      
      // Handle different error types
      if (error.code === 'ERR_BAD_RESPONSE' || error.response?.status === 500) {
        toast.warning('The server returned an error but your slip may have been saved. Redirecting to Books...');
        // Redirect to slip history instead of drafts since the slip might have been saved
        setTimeout(() => navigate('/history'), 2000); 
      } else if (error.code === 'ERR_NETWORK') {
        toast.error('Network error. Slip saved as draft. Please check your connection.');
        setTimeout(() => navigate('/drafts'), 2000);
      } else {
        toast.error('Error: ' + (error.response?.data?.message || error.message));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header slipNumber={slipNumber} onSave={handleSaveSlip} />
      <PageContainer>
        <CustomerInfo>
          <Input 
            type="text" 
            placeholder={t('quickSlip.customerName')}
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />
        </CustomerInfo>

        <SlipTable>
          <TableHeader>
            <TableCell flex="10%" $border>{t('quickSlip.tableHeaders.srNo')}</TableCell>
            <TableCell flex="40%" $border $ellipsis>{t('quickSlip.tableHeaders.itemName')}</TableCell>
            <TableCell flex="10%" $border>{t('quickSlip.tableHeaders.qty')}</TableCell>
            <TableCell flex="10%" $border>{t('quickSlip.tableHeaders.unit')}</TableCell>
            <TableCell flex="15%" $border>{t('quickSlip.tableHeaders.price')}</TableCell>
            <TableCell flex="15%">{t('quickSlip.tableHeaders.total')}</TableCell>
          </TableHeader>

          {items.map((item, index) => (
            <TableRow key={index}>
              <TableCell flex="10%" $border>{index + 1}</TableCell>
              <TableCell flex="40%" $border $ellipsis>{item.name}</TableCell>
              <TableCell flex="10%" $border>{item.qty}</TableCell>
              <TableCell flex="10%" $border>{item.unit}</TableCell>
              <TableCell flex="15%" $border>{item.rate}</TableCell>
              <TableCell flex="15%">
                {(item.qty * item.rate).toFixed(2)}
                <button 
                  onClick={() => handleRemoveItem(index)}
                  style={{ 
                    marginLeft: '5px', 
                    background: 'none', 
                    border: 'none', 
                    cursor: 'pointer',
                    color: 'red' 
                  }}
                >
                  ×
                </button>
              </TableCell>
            </TableRow>
          ))}

          <AddItemRow>
            <div className="product-autocomplete-wrapper">
              <StyledProductAutocomplete 
                value={newItem.name}
                onChange={(value) => setNewItem(prev => ({ ...prev, name: value }))}
                onSelectProduct={handleProductSelect}
                placeholder={t('quickslip.itemNamePlaceholder')}
              />
            </div>
            <div className="qty-input-wrapper">
              <Input 
                type="number"
                name="qty"
                value={newItem.qty}
                onChange={handleInputChange}
                placeholder={t('quickslip.qtyPlaceholder')}
              />
            </div>
            <div className="unit-select-wrapper">
              <StyledUnitSelect 
                name="unit"
                value={newItem.unit}
                onChange={handleInputChange}
              />
            </div>
            <div className="price-input-wrapper">
              <Input 
                type="number"
                name="rate"
                value={newItem.rate}
                onChange={handleInputChange}
                placeholder={t('quickslip.pricePlaceholder')}
              />
            </div>
            <Button onClick={handleAddItem} disabled={!newItem.name || !newItem.qty || !newItem.rate || !newItem.unit} variant="icon">+</Button>
          </AddItemRow>
        </SlipTable>

        <BottomRow>
          <TotalSection>
            <TotalRow>
              <TotalLabel>Subtotal</TotalLabel>
              <TotalValue>₹{calculateTotal().toFixed(2)}</TotalValue>
            </TotalRow>
            <TotalRow>
              <TotalLabel>Total</TotalLabel>
              <TotalValue>₹{calculateTotal().toFixed(2)}</TotalValue>
            </TotalRow>
          </TotalSection>

          <VoiceButton onClick={handleVoiceInput} disabled={recording}>
            {recording ? '...' : t('quickSlip.buttons.voice')}
          </VoiceButton>
        </BottomRow>
      </PageContainer>
      <Footer />
      <ToastContainer position="bottom-center" autoClose={3000} hideProgressBar={false} />
    </>
  );
};

export default QuickSlip;
