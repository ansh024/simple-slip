import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { slipService } from '../services/api';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Button from '../components/Button';
import { toast } from 'react-toastify';

const PageContainer = styled.div`
  min-height: 100vh;
  padding: 70px 20px 80px;
  background-color: var(--secondary-color);
  display: flex;
  flex-direction: column;
`;

const SlipCard = styled.div`
  background: white;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid var(--border-color);
  margin-bottom: 20px;
`;

const SlipHeader = styled.div`
  padding: 15px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const SlipInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const SlipNumber = styled.div`
  font-weight: 600;
  font-size: 16px;
`;

const SlipDate = styled.div`
  color: var(--text-light);
  font-size: 14px;
`;

const CustomerName = styled.div`
  font-size: 14px;
  padding: 10px 15px;
  border-bottom: 1px solid var(--border-color);
`;

const ItemsTable = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHeader = styled.tr`
  background: var(--table-header);
  font-size: 12px;
  font-weight: 500;
  text-align: center;
`;

const TableCell = styled.td`
  padding: 8px;
  font-size: 12px;
  text-align: center;
  border-bottom: 1px solid var(--border-dark);
  border-right: ${props => props.$last ? 'none' : '1px solid var(--border-dark)'};
`;

const TableHeaderCell = styled.th`
  padding: 8px;
  font-size: 12px;
  font-weight: 500;
  border-bottom: 1px solid var(--border-dark);
  border-right: ${props => props.$last ? 'none' : '1px solid var(--border-dark)'};
`;

const TotalSection = styled.div`
  padding: 15px;
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const TotalRow = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  font-weight: ${props => props.$bold ? '600' : '400'};
`;

const ActionBar = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-top: auto;
  padding: 10px;
`;

const DeleteButton = styled.div`
  color: #d9534f;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: all 0.2s;
  
  &:hover {
    color: #c9302c;
    text-decoration: underline;
  }
`;

const ConfirmationModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 10px;
  padding: 20px;
  width: 85%;
  max-width: 350px;
  display: flex;
  flex-direction: column;
  gap: 15px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
`;

const ModalTitle = styled.div`
  font-weight: 600;
  font-size: 16px;
  color: var(--text-dark);
`;

const ModalMessage = styled.div`
  font-size: 14px;
  color: var(--text-light);
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 10px;
`;

const CancelButton = styled.button`
  padding: 8px 12px;
  background: #f8f9fa;
  border: 1px solid #d1d1d1;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
`;

const ConfirmButton = styled.button`
  padding: 8px 12px;
  background: #d9534f;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: var(--text-light);
  background: white;
  border-radius: 10px;
  border: 1px solid var(--border-color);
`;

const SlipDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [slip, setSlip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (id && id !== 'new') {
      fetchSlipDetails();
    } else {
      setLoading(false);
    }
  }, [id]);
  
  // Transform the slip data to ensure it has the expected structure
  const formatSlipData = (rawSlip) => {
    if (!rawSlip) return null;
    
    // Transform slip_items to items for consistency
    return {
      ...rawSlip,
      // Map slip_items to the format expected by the component
      items: rawSlip.slip_items?.map(item => ({
        product_name: item.products?.name || item.name || 'Unknown Product',
        qty: item.qty,
        unit: item.unit || item.products?.default_unit || 'unit',
        rate: item.rate,
        line_total: item.line_total || (item.qty * item.rate)
      })) || []
    };
  };

  const fetchSlipDetails = async () => {
    try {
      setLoading(true);
      const response = await slipService.getSlipById(id);
      if (response.data && response.data.slip) {
        // Format the slip data to ensure it has the expected structure
        const formattedSlip = formatSlipData(response.data.slip);
        setSlip(formattedSlip);
      }
    } catch (error) {
      console.error('Error fetching slip details:', error);
    } finally {
      setLoading(false);
    }
  };

  // PDF functionality removed to simplify the application

  const handleDeleteSlip = async () => {
    if (!slip) return;
    
    try {
      await slipService.deleteSlip({ id: slip.id });
      toast.success('Slip deleted successfully');
      navigate('/history');
    } catch (error) {
      console.error('Error deleting slip:', error);
      toast.error('Failed to delete slip');
    } finally {
      setShowDeleteModal(false);
    }
  };
  
  const handleShareViaWhatsApp = () => {
    if (!slip) return;
    
    // Format the slip details for WhatsApp
    const slipDetails = `*Slip #${slip.slip_no}*\n` +
      `Date: ${new Date(slip.slip_date).toLocaleDateString()}\n` +
      `Customer: ${slip.customer_name}\n\n` +
      `*Items:*\n${slip.items.map((item, index) => 
        `${index + 1}. ${item.product_name} - ${item.qty} ${item.unit} x ₹${item.rate} = ₹${item.line_total}`
      ).join('\n')}\n\n` +
      `*Total: ₹${slip.total}*`;
    
    // Encode the text for a WhatsApp URL
    const encodedText = encodeURIComponent(slipDetails);
    
    // Open WhatsApp with the slip details
    window.open(`https://wa.me/?text=${encodedText}`, '_blank');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <>
        <Header />
        <PageContainer>
          <LoadingMessage>Loading slip details...</LoadingMessage>
        </PageContainer>
        <Footer />
      </>
    );
  }

  if (!slip && id !== 'new') {
    return (
      <>
        <Header />
        <PageContainer>
          <LoadingMessage>Slip not found</LoadingMessage>
          <Button onClick={() => navigate('/')} style={{ alignSelf: 'center', marginTop: '20px' }}>
            Go Home
          </Button>
        </PageContainer>
        <Footer />
      </>
    );
  }

  if (id === 'new') {
    return (
      <>
        <Header />
        <PageContainer>
          <LoadingMessage>
            Create a new slip through the Quick Slip feature
          </LoadingMessage>
          <Button 
            onClick={() => navigate('/quick-slip')} 
            style={{ alignSelf: 'center', marginTop: '20px' }}
          >
            Go to Quick Slip
          </Button>
        </PageContainer>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header slipNumber={slip.slip_no} />
      <PageContainer>
        <SlipCard>
          <SlipHeader>
            <SlipInfo>
              <SlipNumber>Slip #{slip.slip_no}</SlipNumber>
              <SlipDate>{formatDate(slip.slip_date)}</SlipDate>
            </SlipInfo>
            <DeleteButton onClick={() => setShowDeleteModal(true)}>Delete</DeleteButton>
          </SlipHeader>
          
          <CustomerName>
            Customer: {slip.customer_name}
          </CustomerName>
          
          <ItemsTable>
            <thead>
              <TableHeader>
                <TableHeaderCell>S.No.</TableHeaderCell>
                <TableHeaderCell>Item Name</TableHeaderCell>
                <TableHeaderCell>QTY</TableHeaderCell>
                <TableHeaderCell>Unit</TableHeaderCell>
                <TableHeaderCell>Price</TableHeaderCell>
                <TableHeaderCell $last>Total</TableHeaderCell>
              </TableHeader>
            </thead>
            <tbody>
              {slip.items.map((item, index) => (
                <tr key={index}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{item.product_name}</TableCell>
                  <TableCell>{item.qty}</TableCell>
                  <TableCell>{item.unit}</TableCell>
                  <TableCell>{item.rate}</TableCell>
                  <TableCell $last>{item.line_total}</TableCell>
                </tr>
              ))}
            </tbody>
          </ItemsTable>
          
          <TotalSection>
            <TotalRow>
              <div>Subtotal</div>
              <div>₹{slip.subtotal.toFixed(2)}</div>
            </TotalRow>
            
            {slip.discount > 0 && (
              <TotalRow>
                <div>Discount</div>
                <div>₹{slip.discount.toFixed(2)}</div>
              </TotalRow>
            )}
            
            <TotalRow $bold>
              <div>Total</div>
              <div>₹{slip.total.toFixed(2)}</div>
            </TotalRow>
          </TotalSection>
        </SlipCard>
        
        <ActionBar>
          <Button variant="secondary" outline onClick={() => navigate('/history')}>
            Back
          </Button>
          <Button onClick={handleShareViaWhatsApp}>
            Share
          </Button>
        </ActionBar>
        {showDeleteModal && (
          <ConfirmationModal onClick={(e) => e.target === e.currentTarget && setShowDeleteModal(false)}>
            <ModalContent>
              <ModalTitle>Delete Slip?</ModalTitle>
              <ModalMessage>Are you sure you want to delete Slip #{slip.slip_no}? This action cannot be undone.</ModalMessage>
              <ModalActions>
                <CancelButton onClick={() => setShowDeleteModal(false)}>Cancel</CancelButton>
                <ConfirmButton onClick={handleDeleteSlip}>Delete</ConfirmButton>
              </ModalActions>
            </ModalContent>
          </ConfirmationModal>
        )}
      </PageContainer>
      <Footer />
    </>
  );
};

export default SlipDetail;
