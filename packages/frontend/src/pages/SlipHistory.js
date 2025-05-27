import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { slipService } from '../services/api';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Button from '../components/Button';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { toast, ToastContainer } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import 'react-toastify/dist/ReactToastify.css';

const PageContainer = styled.div`
  min-height: 100vh;
  padding: 70px 20px 80px;
  background-color: var(--secondary-color);
`;

const HeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const RefreshButton = styled.button`
  background-color: #E1EEFF;
  color: #0051FF;
  border: none;
  border-radius: 50%;
  width: 23px; /* 30% bigger than 18px */
  height: 23px; /* 30% bigger than 18px */
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 12px; /* 30% bigger than 9px */
  margin-left: 10px;
  padding: 0;
  
  &:hover {
    background-color: #c1d8ff;
  }
  
  &:active {
    transform: scale(0.95);
  }
`;

const Title = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: var(--text-color);
`;

const FilterContainer = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
`;

const FilterItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const FilterLabel = styled.label`
  font-size: 12px;
  color: var(--text-light);
`;

const SelectFilter = styled.select`
  padding: 6px 10px;
  border-radius: 4px;
  border: 1px solid var(--border-color);
  font-size: 14px;
  background-color: white;
`;

const DatePickerWrapper = styled.div`
  .react-datepicker-wrapper {
    width: 100%;
  }
  
  .react-datepicker__input-container input {
    padding: 6px 10px;
    border-radius: 4px;
    border: 1px solid var(--border-color);
    font-size: 14px;
    width: 100px;
  }
`;

const ToggleContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
`;

const ToggleSwitch = styled.label`
  position: relative;
  display: inline-block;
  width: 40px;
  height: 20px;
  
  input {
    opacity: 0;
    width: 0;
    height: 0;
  }
  
  span {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #ccc;
    transition: .4s;
    border-radius: 20px;
  }
  
  span:before {
    position: absolute;
    content: "";
    height: 16px;
    width: 16px;
    left: 2px;
    bottom: 2px;
    background-color: white;
    transition: .4s;
    border-radius: 50%;
  }
  
  input:checked + span {
    background-color: var(--primary-color);
  }
  
  input:checked + span:before {
    transform: translateX(20px);
  }
`;

const TableHeader = styled.div`
  display: flex;
  background-color: #f8f9fa;
  padding: 12px 15px;
  border-bottom: 1px solid var(--border-color);
  font-weight: 600;
  font-size: 14px;
  
  div:first-child {
    flex: 1;
  }
  
  div:nth-child(2) {
    width: 80px;
    text-align: center;
  }
  
  div:last-child {
    width: 100px;
    text-align: right;
  }
`;

const SlipList = styled.div`
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border-color);
  border-radius: 10px;
  overflow: hidden;
  background-color: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const SlipCard = styled.div`
  background: white;
  padding: 9px; /* Reduced by 40% from 15px */
  cursor: pointer;
  border-bottom: 1px solid var(--border-color);
  position: relative;
  transition: background-color 0.2s;
  display: flex;
  flex-direction: column;
  gap: 6px; /* Reduced by 40% from 10px */
  
  &:hover {
    background-color: #f5f9ff;
  }
`;

const SlipHeader = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px; /* Reduced by 40% from 10px */
  width: 100%;
`;

const SlipCustomer = styled.div`
  font-size: 15px; /* Slightly reduced font size */
  font-weight: 600;
  color: var(--text-color);
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 3px; /* Reduced by 40% from 5px */
`;

const SlipNumber = styled.div`
  font-weight: 600;
  font-size: 16px;
`;

const SlipDate = styled.div`
  color: var(--text-light);
  font-size: 14px;
  margin-left: 5%;
`;

const SlipTime = styled.div`
  color: var(--text-light);
  font-size: 12px;
  margin-left: 5px;
`;

const DraftLabel = styled.div`
  background-color: #F0CA00;
  color: #7D6500;
  font-size: 12px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 20px;
  display: inline-block;
  margin-left: 10px;
`;

const DeleteButton = styled.div`
  color: #FF4747;
  font-size: 14px;
  font-weight: 600;
  margin-left: auto; /* Push to right */
  cursor: pointer;
  
  &:hover {
    text-decoration: underline;
  }
`;

const ConfirmationModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: white;
  padding: 20px;
  border-radius: 10px;
  width: 90%;
  max-width: 350px;
`;

const ModalTitle = styled.h3`
  font-size: 16px;
  margin-bottom: 15px;
  color: var(--text-color);
`;

const ModalButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
`;

const ModalButton = styled.button`
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  
  background-color: ${props => props.$primary ? 'var(--primary-color)' : '#f1f1f1'};
  color: ${props => props.$primary ? 'white' : 'var(--text-color)'};
  
  &:hover {
    opacity: 0.9;
  }
`;

const Toast = styled.div`
  font-size: 10px;
`;

const SlipDetails = styled.div`
  display: flex;
  align-items: center;
  margin-top: 9px; /* Reduced by 40% from 15px */
  margin-bottom: 0px; /* Reduced by more than 40% to make the card even more compact */
  position: relative;
  width: 100%;
`;

const SlipAmount = styled.div`
  font-size: 16px; /* Slightly reduced font size */
  font-weight: 600;
  color: var(--primary-color);
`;

const SlipItemCount = styled.div`
  font-size: 14px;
  color: var(--text-light);
  margin-left: 20px; /* Add 20px space as requested */
`;

const CustomerName = styled.div`
  font-weight: 500;
  font-size: 14px;
`;

const SlipTotal = styled.div`
  font-size: 16px;
  font-weight: 600;
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 20px;
  color: var(--text-light);
  background: white;
  border-radius: 10px;
  border: 1px solid var(--border-color);
`;

const EmptyMessage = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: var(--text-light);
  background: white;
  border-radius: 10px;
  
  button {
    margin-top: 15px;
    padding: 8px 16px;
    background-color: var(--primary-color);
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    
    &:hover {
      background-color: #0056b3;
    }
  }
`;

const ItemCount = styled.div`
  color: var(--text-light);
  font-size: 12px;
  margin-top: 10px;
`;

const SlipHistory = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  // State for slips and filters
  const [slips, setSlips] = useState([]);
  const [filteredSlips, setFilteredSlips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState(null);
  const [sortOrder, setSortOrder] = useState('newest');
  const [slipToDelete, setSlipToDelete] = useState(null);
  
  useEffect(() => {
    fetchSlips();
  }, []);
  
  useEffect(() => {
    // Apply filters whenever the filter settings or slips change
    applyFilters();
  }, [slips, dateFilter, sortOrder]);
  
  const fetchSlips = async () => {
    setLoading(true);
    try {
      // Get saved slips from backend
      const response = await slipService.getSlips();
      let allSlips = [];
      
      if (response.data && response.data.slips) {
        allSlips = response.data.slips.map(slip => {
          // Ensure we have valid dates
          let timestampSource = slip.slip_timestamp || slip.created_at || slip.slip_date;
          if (!timestampSource) timestampSource = new Date().toISOString(); // Ultimate fallback

          let dateForFormatting = new Date(timestampSource);
          if (isNaN(dateForFormatting.getTime())) dateForFormatting = new Date(); // Fallback for invalid date

          const formattedDate = formatDateStatic(dateForFormatting);
          const formattedTime = formatTimeStatic(dateForFormatting);

          return {
            ...slip,
            isDraft: false,
            // Store the primary timestamp as ISO string
            slip_timestamp: new Date(timestampSource).toISOString(), 
            // Keep created_at and slip_date if they exist, for any other potential uses or fallbacks
            created_at: slip.created_at ? new Date(slip.created_at).toISOString() : new Date(timestampSource).toISOString(),
            slip_date: slip.slip_date ? new Date(slip.slip_date).toISOString() : new Date(timestampSource).toISOString(),
            formattedDate,
            formattedTime,
          };
        });
      }
      
      // Get draft slips from localStorage
      try {
        const draftSlipsString = localStorage.getItem('draftSlips');
        if (draftSlipsString) {
          const draftSlips = JSON.parse(draftSlipsString);
          const formattedDraftSlips = draftSlips.map(draft => {
            // Ensure we have valid dates
            let created_at = draft.created_at ? new Date(draft.created_at) : new Date();
            if (isNaN(created_at.getTime())) created_at = new Date(); // Fallback to current date if invalid
            
            let slip_date = draft.slip_date ? new Date(draft.slip_date) : created_at;
            if (isNaN(slip_date.getTime())) slip_date = created_at; // Fallback to created_at if invalid
            
            // Pre-format the date and time strings to prevent updates on re-render
            // Use the memoized static functions
            const formattedDate = formatDateStatic(slip_date);
            const formattedTime = formatTimeStatic(created_at);
            
            // Create a stable draft object with ISO strings and pre-formatted display values
            return {
              ...draft,
              isDraft: true,
              created_at: created_at.toISOString(), // Store as ISO string to prevent mutation
              slip_date: slip_date.toISOString(),   // Store as ISO string to prevent mutation
              // Use consistent property names for the pre-formatted strings
              formattedDate,  // Pre-formatted date string
              formattedTime,  // Pre-formatted time string
              id: draft.draftId || draft.id || `draft-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            };
          });
          
          allSlips = [...allSlips, ...formattedDraftSlips];
        }
      } catch (draftError) {
        console.error('Error loading draft slips:', draftError);
        toast.error(t('errorLoadingDrafts') || 'Error loading draft slips');
      }
      
      setSlips(allSlips);
    } catch (error) {
      console.error('Error fetching slips:', error);
      toast.error(t('errorFetchingSlips') || 'Error fetching slips');
    } finally {
      setLoading(false);
    }
  };
  
  const applyFilters = () => {
    let result = [...slips];
    
    // Always filter out draft slips as they should be removed
    result = result.filter(slip => !slip.isDraft);
    
    // Filter by date if date filter is active
    if (dateFilter) {
      const filterDate = new Date(dateFilter).setHours(0, 0, 0, 0);
      result = result.filter(slip => {
        // Use original ISO string for date filtering
        const dateStr = slip.slip_date || slip.created_at;
        const slipDate = new Date(dateStr).setHours(0, 0, 0, 0);
        return slipDate === filterDate;
      });
    }
    
    // Sort results with improved date handling
    result.sort((a, b) => {
      // Parse ISO strings to timestamps for sorting
      const dateA = new Date(a.slip_timestamp || a.created_at || a.slip_date || 0).getTime();
      const dateB = new Date(b.slip_timestamp || b.created_at || b.slip_date || 0).getTime();
      
      // Apply the sort direction based on the selected option
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
    
    // Commented out debug logging to prevent unnecessary date object creation
    // console.log('Sorted slips:', result.map(slip => ({
    //   id: slip.id,
    //   date: slip.formattedDate,
    //   sortOrder
    // })));
    
    setFilteredSlips(result);
  };
  
  const handleSlipClick = (slip) => {
    if (slip.isDraft) {
      // Navigate to edit draft
      navigate(`/quick-slip?draftId=${slip.id}`);
    } else {
      // Navigate to view saved slip
      navigate(`/slip/${slip.id}`);
    }
  };
  
  // Move date formatting functions outside of component to prevent recreation on each render
  // They are now pure utility functions that don't depend on component state
  const formatDateStatic = useCallback((dateString) => {
    if (!dateString) return '';

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';

      const day = date.getDate(); // Just the number
      const year = date.getFullYear();

      // Get month name
      const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];
      const monthName = monthNames[date.getMonth()];

      return `${day} ${monthName} ${year}`; // e.g., "20 April 2025"
    } catch (error) {
      console.warn('Error formatting date:', error);
      return 'N/A';
    }
  }, []);
  
  // Format time function is also memoized
  const formatTimeStatic = useCallback((dateString) => {
    if (!dateString) return '';
    
    try {
      // Parse the date string once
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return ''; // Return empty string for invalid times
      
      // Get hours in 12-hour format
      let hours = date.getHours();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // Convert 0 to 12
      
      // Get minutes with leading zero if needed
      const minutes = date.getMinutes().toString().padStart(2, '0');
      
      // Return fixed time string that won't update on re-renders
      return `${hours}:${minutes} ${ampm}`;
    } catch (error) {
      console.warn('Error formatting time:', error);
      return '';
    }
  }, []);
  
  const handleDeleteClick = (e, slip) => {
    e.stopPropagation(); // Prevent the click from bubbling to the slip card
    setSlipToDelete(slip);
  };
  
  const confirmDelete = async () => {
    if (!slipToDelete) return;
    
    try {
      if (slipToDelete.isDraft) {
        // Delete from localStorage
        const draftSlipsString = localStorage.getItem('draftSlips');
        if (draftSlipsString) {
          const draftSlips = JSON.parse(draftSlipsString);
          const updatedDrafts = draftSlips.filter(draft => 
            draft.draftId !== slipToDelete.id && draft.id !== slipToDelete.id
          );
          localStorage.setItem('draftSlips', JSON.stringify(updatedDrafts));
        }
        toast.success(t('draftDeletedSuccessMessage', 'The draft has been deleted successfully.'));
      } else {
        // Delete from backend
        await slipService.deleteSlip(slipToDelete.id);
        toast.success(t('slipDeletedSuccessMessage', 'The slip has been deleted successfully.'));
      }
      
      // Refresh the list
      fetchSlips();
    } catch (error) {
      console.error('Error deleting slip:', error);
      toast.error(t('errorDeletingSlip') || 'Error deleting slip');
    } finally {
      setSlipToDelete(null);
    }
  };
  
  const cancelDelete = () => {
    setSlipToDelete(null);
  };

  return (
    <PageContainer>
      <Header title="Books" showBackButton={true} />
      
      <HeaderContainer>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Title>Slips Book</Title>
          <RefreshButton onClick={fetchSlips} title={t('refresh') || 'Refresh'}>
            ↻
          </RefreshButton>
        </div>
        
        <FilterContainer>
          <FilterItem>
            <FilterLabel>Sort By:</FilterLabel>
            <SelectFilter 
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
            </SelectFilter>
          </FilterItem>
          
          <FilterItem>
            <FilterLabel>Date Range</FilterLabel>
            <DatePickerWrapper>
              <DatePicker 
                selected={dateFilter} 
                onChange={(date) => setDateFilter(date)}
                placeholderText={t('all') || 'All'}
                dateFormat="dd/MM/yyyy"
                isClearable
              />
            </DatePickerWrapper>
          </FilterItem>
          
          {/* Draft toggle removed as requested */}
        </FilterContainer>
      </HeaderContainer>
      
      <SlipList>
        {loading ? (
          <LoadingMessage>{t('loading') || 'Loading...'}</LoadingMessage>
        ) : filteredSlips.length === 0 ? (
          <EmptyMessage>
            {t('noSlipsFound') || 'No slips found'}
            <div>
              <button onClick={fetchSlips}>
                {t('refresh') || 'Refresh'}
              </button>
            </div>
          </EmptyMessage>
        ) : (
          <>
            <TableHeader>
              <div>Customer / Date & Time</div>
              <div></div>
              <div>Actions</div>
            </TableHeader>
            {filteredSlips.map(slip => (
              <SlipCard key={slip.id || `slip-${Math.random()}`} onClick={() => handleSlipClick(slip)}>
                <SlipHeader>
                  <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <SlipCustomer>
                      {slip.customer_name ? slip.customer_name.trim() : (t('walkInCustomer') || 'Walk-in Customer')}
                      {slip.isDraft && <DraftLabel>{t('draft') || 'Draft'}</DraftLabel>}
                    </SlipCustomer>
                    {/* Stable pre-formatted date and time */}
                    <SlipDate data-testid="slip-date">{slip.formattedDate}</SlipDate>
                    <SlipTime data-testid="slip-time">{slip.formattedTime}</SlipTime>
                  </div>
                </SlipHeader>
                
                <SlipDetails>
                  <SlipAmount>₹{slip.total ? parseFloat(slip.total).toFixed(2) : '0.00'}</SlipAmount>
                  <SlipItemCount>
                    {(slip.slip_items?.length || slip.items?.length || 0)}{' '}
                    {(slip.slip_items?.length || slip.items?.length || 0) === 1 
                      ? (t('item') || 'item') 
                      : (t('items') || 'items')}
                  </SlipItemCount>
                  <DeleteButton onClick={(e) => handleDeleteClick(e, slip)}>
                    Delete
                  </DeleteButton>
                </SlipDetails>
              </SlipCard>
            ))}
          </>
        )}
      </SlipList>
      
      {slipToDelete && (
        <ConfirmationModal>
          <ModalContent>
            <ModalTitle>
              {slipToDelete.isDraft
                ? (t('confirmDeleteDraftTitle', 'Are you sure you want to delete this draft?'))
                : (t('confirmDeleteSlipTitle', 'Are you sure you want to delete this slip?'))}
            </ModalTitle>

            {/* Slip Details */}
            <div style={{ margin: '15px 0', fontSize: '14px', lineHeight: '1.6', textAlign: 'center' }}>
              <div style={{ fontWeight: '500' }}>
                {slipToDelete.customer_name ? slipToDelete.customer_name.trim() : (t('walkInCustomer', 'Walk-in customer'))}
                <span style={{ marginLeft: '10px', fontWeight: 'normal' }}>₹{parseFloat(slipToDelete.total || 0).toFixed(2)}</span>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-light)', marginTop: '5px' }}>
                {slipToDelete.formattedDate} {slipToDelete.formattedTime}
              </div>
            </div>

            <div style={{ fontSize: '14px', color: 'var(--text-color)', textAlign: 'center' }}>
              {t('thisActionCannotBeUndone', 'This action cannot be undone.')}
            </div>

            <ModalButtons>
              <ModalButton onClick={cancelDelete}>
                {t('cancelButton', 'Cancel')}
              </ModalButton>
              <ModalButton $primary onClick={confirmDelete}>
                {t('deleteButton', 'Delete')}
              </ModalButton>
            </ModalButtons>
          </ModalContent>
        </ConfirmationModal>
      )}
      
      <ToastContainer position="bottom-center" autoClose={3000} hideProgressBar theme="colored" />
      <Footer />
    </PageContainer>
  );
};

export default SlipHistory;
