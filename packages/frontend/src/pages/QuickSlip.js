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
import AddIcon from '@mui/icons-material/Add';
import MicIcon from '@mui/icons-material/Mic';

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
    toast.info('Initializing voice recording...');
    
    // Comprehensive browser support check
    if (!navigator.mediaDevices?.getUserMedia) {
      console.error('getUserMedia not supported');
      toast.error(t('messages.voiceUnsupported'));
      setRecording(false);
      return;
    }
    
    if (!window.MediaRecorder) {
      console.error('MediaRecorder not supported');
      toast.error(t('messages.voiceUnsupported'));
      setRecording(false);
      return;
    }
    
    // Log supported MIME types for debugging
    console.log('Audio format support check:');
    const mimeTypes = [
      'audio/webm',
      'audio/webm;codecs=opus',
      'audio/ogg;codecs=opus',
      'audio/wav',
      'audio/mp4'
    ];
    
    mimeTypes.forEach(type => {
      console.log(`${type}: ${MediaRecorder.isTypeSupported(type) ? 'Supported' : 'Not supported'}`);
    });
    
    // Find a supported MIME type
    let selectedMimeType = null;
    for (const type of mimeTypes) {
      if (MediaRecorder.isTypeSupported(type)) {
        selectedMimeType = type;
        console.log('Selected MIME type:', selectedMimeType);
        break;
      }
    }
    
    if (!selectedMimeType) {
      console.error('No supported audio format found');
      toast.error(t('messages.voiceUnsupported'));
      setRecording(false);
      return;
    }
    
    let stream = null;
    try {
      console.log('Requesting microphone access...');
      // Request minimal audio settings first to increase chances of success
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('Microphone access granted');
      
      // Create a simple recorder config
      const recorderOptions = { mimeType: selectedMimeType };
      console.log('Creating MediaRecorder with options:', recorderOptions);
      
      const mediaRecorder = new MediaRecorder(stream, recorderOptions);
      const chunks = [];
      
      // Set up event handlers before starting
      mediaRecorder.ondataavailable = (event) => {
        console.log(`Data available event, size: ${event.data.size} bytes`);
        if (event.data && event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      // Manually trigger data collection
      let recordingInterval = null;
      
      mediaRecorder.onstart = () => {
        console.log('Recording started');
        toast.info('Recording... (4 seconds)', { autoClose: 4000 });
        // Request data every 1 second to ensure we get something
        recordingInterval = setInterval(() => {
          if (mediaRecorder.state === 'recording') {
            console.log('Requesting data...');
            mediaRecorder.requestData();
          }
        }, 1000);
      };
      
      // Create promise to track completion
      const recordingPromise = new Promise((resolve) => {
        mediaRecorder.onstop = async () => {
          console.log('Recording stopped');
          
          // Clear the interval
          if (recordingInterval) {
            clearInterval(recordingInterval);
          }
          
          // Stop all audio tracks
          if (stream) {
            stream.getTracks().forEach(track => {
              track.stop();
              console.log('Audio track stopped');
            });
          }
          
          console.log(`Recorded ${chunks.length} chunks of audio data`);
          
          if (chunks.length === 0) {
            console.error('No audio data recorded');
            toast.error('No audio data recorded. Please try again.');
            resolve(false);
            return;
          }
          
          try {
            const blob = new Blob(chunks, { type: selectedMimeType });
            console.log(`Audio blob created: ${(blob.size / 1024).toFixed(2)}KB, type: ${blob.type}`);
            
            if (blob.size < 100) { // Likely too small to be valid
              console.warn('Audio recording too small, likely invalid');
              toast.warning('Recording too short or failed. Please try again.');
              resolve(false);
              return;
            }
            
            // Show loading state
            toast.info('Processing audio...', { autoClose: false, toastId: 'processing' });
            
            try {
              // Use mock data if no proper audio was recorded
              // Small recordings skip server processing
              if (blob.size < 1000) {
                console.warn('Small recording, using direct input prompt');
                // Wait for UI to update
                await new Promise(r => setTimeout(r, 1500));
                
                toast.dismiss('processing');
                
                // Ask the user what they said instead of using mock data
                const userInput = prompt('What did you say? (e.g. "4 kg chawal 20 rupees")');
                
                if (!userInput) {
                  toast.info('Voice input cancelled');
                  resolve(false);
                  return;
                }
                
                // Try to parse the user input - first look for Hindi patterns
                const voiceItems = parseVoiceInput(userInput);
                
                if (voiceItems.length > 0) {
                  setItems(prev => [...prev, ...voiceItems]);
                  toast.success(`Added ${voiceItems.length} items from your input`);
                  resolve(true);
                } else {
                  toast.warning('Could not recognize items in your input');
                  resolve(false);
                }
                return;
              }
              
              // Send to API
              const response = await voiceService.processVoice(blob, 'hi-IN');
              toast.dismiss('processing');
              
              // Check for transcript
              if (response.data?.transcript) {
                const shortTranscript = response.data.transcript.substring(0, 50) + 
                  (response.data.transcript.length > 50 ? '...' : '');
                toast.info(`Transcript: ${shortTranscript}`);
              }
              
              // Process items
              if (response.data?.items && response.data.items.length > 0) {
                const voiceItems = response.data.items.map(item => ({
                  name: item.name,
                  qty: parseFloat(item.qty),
                  unit: item.unit,
                  rate: parseFloat(item.rate),
                  line_total: parseFloat(item.qty) * parseFloat(item.rate)
                }));
                
                setItems(prev => [...prev, ...voiceItems]);
                toast.success(`Added ${voiceItems.length} items from voice input`);
              } else {
                toast.warning('No items could be identified from the voice input');
              }
              
              resolve(true);
            } catch (error) {
              console.error('Error processing voice with API:', error);
              toast.dismiss('processing');
              toast.error(t('messages.voiceError'));
              resolve(false);
            }
          } catch (blobError) {
            console.error('Error creating audio blob:', blobError);
            toast.error('Failed to process recording');
            resolve(false);
          }
        };
        
        mediaRecorder.onerror = (event) => {
          console.error('MediaRecorder error:', event.error || 'Unknown error');
          toast.error('Recording error');
          if (recordingInterval) {
            clearInterval(recordingInterval);
          }
          resolve(false);
        };
      });
      
      // Start recording with a time slice to get frequent ondataavailable events
      console.log('Starting MediaRecorder...');
      mediaRecorder.start(1000); // Request data every second
      
      // Set timeout to stop recording after 4 seconds
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          console.log('Stopping recording after timeout');
          mediaRecorder.stop();
        }
      }, 4000);
      
      // Wait for recording completion
      const success = await recordingPromise;
      console.log('Recording process finished, success:', success);
      
    } catch (err) {
      // Clean up
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      // Detailed error logging
      console.error('Voice recording error:', err);
      console.error('Error name:', err.name);
      console.error('Error message:', err.message);
      console.error('Error stack:', err.stack);
      
      toast.error(t('messages.voiceError'));
    } finally {
      setRecording(false);
    }
  };

  /**
   * Parse voice input text to extract items, quantities, and prices
   * @param {string} input - The text to parse
   * @returns {Array} - Array of parsed items
   */
  const parseVoiceInput = (input) => {
    if (!input) return [];
    
    console.log('Parsing voice input:', input);
    const items = [];
    
    // Try to match various patterns in both Hindi and English
    // Pattern 1: Common Hindi pattern - "[quantity] [unit] [product] [price]"
    // e.g. "chaar kilo chawal 20 rupay" or "4 kilo chawal 20"
    const hindiPattern = /(\d+|एक|दो|तीन|चार|पाँच|छह|सात|आठ|नौ|दस)\s*(किलो|kilo|kg|किलोग्राम|ग्राम|gram)\s*([\w\s]+?)\s*(\d+)/gi;
    
    // Map Hindi numbers to digits
    const hindiNumbers = {
      'एक': 1, 'दो': 2, 'तीन': 3, 'चार': 4, 'पाँच': 5, 
      'छह': 6, 'सात': 7, 'आठ': 8, 'नौ': 9, 'दस': 10
    };
    
    // Map Hindi units to standard units
    const hindiUnits = {
      'किलो': 'kg', 'kilo': 'kg', 'किलोग्राम': 'kg',
      'ग्राम': 'g', 'gram': 'g'
    };
    
    // Find all matches for the Hindi/English pattern
    let match;
    while ((match = hindiPattern.exec(input)) !== null) {
      // Extract quantity - could be digit or Hindi word
      let qty = match[1].trim();
      // Convert Hindi number words to digits if needed
      if (hindiNumbers[qty.toLowerCase()]) {
        qty = hindiNumbers[qty.toLowerCase()];
      }
      
      // Extract and normalize unit
      let unit = match[2].trim().toLowerCase();
      if (hindiUnits[unit]) {
        unit = hindiUnits[unit];
      }
      
      // Extract product name and rate
      const productName = match[3].trim();
      const rate = parseFloat(match[4].trim());
      
      // Create item object
      const item = {
        name: productName,
        qty: parseFloat(qty),
        unit: unit,
        rate: rate,
        line_total: parseFloat(qty) * rate
      };
      
      console.log('Extracted item from voice:', item);
      items.push(item);
    }
    
    // If no items found with the primary pattern, try simpler patterns
    if (items.length === 0) {
      // Try to extract simple product mentions with numbers
      const simplePattern = /(\d+)\s*([\w\s]+)/g;
      while ((match = simplePattern.exec(input)) !== null) {
        if (match[1] && match[2]) {
          const qty = parseFloat(match[1].trim());
          const productName = match[2].trim();
          
          // Default unit and rate if not specified
          items.push({
            name: productName,
            qty: qty,
            unit: 'kg', // Default unit
            rate: 50,   // Default rate
            line_total: qty * 50
          });
        }
      }
    }
    
    return items;
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
                placeholder={t('quickSlip.itemNamePlaceholder')}
              />
            </div>
            <div className="qty-input-wrapper">
              <Input 
                type="number"
                name="qty"
                value={newItem.qty}
                onChange={handleInputChange}
                placeholder={t('quickSlip.qtyPlaceholder')}
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
                placeholder={t('quickSlip.pricePlaceholder')}
              />
            </div>
            <Button onClick={handleAddItem} disabled={!newItem.name || !newItem.qty || !newItem.rate || !newItem.unit} variant="icon"><AddIcon /></Button>
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
            {recording ? '...' : <MicIcon />}
          </VoiceButton>
        </BottomRow>
      </PageContainer>
      <Footer />
      <ToastContainer position="bottom-center" autoClose={3000} hideProgressBar={false} />
    </>
  );
};

export default QuickSlip;
