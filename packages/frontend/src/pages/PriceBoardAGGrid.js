import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule } from 'ag-grid-community'; // ModuleRegistry might not be needed if only using props
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { priceService } from '../services/api'; // Assuming priceService is available
import styled, { createGlobalStyle } from 'styled-components';
import { debounce } from 'lodash';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Header from '../components/Header'; // Placeholder - Update path if needed
import Footer from '../components/Footer'; // Placeholder - Update path if needed
import { FaSearch } from 'react-icons/fa';

let agGridGeneratedIdCounter = 0;

// Styled component for the search area wrapper
const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  position: relative; /* For icon positioning */
  width: 100%;
  margin-bottom: 20px;
`;

// Styled component for the search icon
const StyledSearchIcon = styled(FaSearch)`
  position: absolute;
  left: 12px; /* Adjust as needed */
  top: 50%;
  transform: translateY(-50%);
  color: #757575; /* Icon color */
  font-size: 16px; /* Icon size */
`;

// Styled component for the submit button
const SearchSubmitButton = styled.button`
  padding: 0 15px;
  height: 38px; /* Matches SearchInput calculated height */
  font-size: 10px;
  background-color: #0051FF;
  color: #FFFFFF;
  border: none; /* Remove border for a flatter look with new bg and radius */
  cursor: pointer;
  border-radius: 20px; /* Apply to all corners */
  text-transform: uppercase;
  flex-shrink: 0; /* Prevent button from shrinking */
  margin-left: 5px; /* Add 5px gap */

  &:hover {
    background-color: #003DAA; /* Darker shade for hover */
  }
`;

// Global styles for AG Grid pagination overrides
const PaginationOverrideStyles = createGlobalStyle`
  .ag-paging-panel {
    display: flex !important; /* Use !important to ensure override if necessary */
    justify-content: space-between !important;
    align-items: center !important;
    background-color: #F5F7FF !important;
  }

  /* Ensure row summary panel takes available space to its right, pushing navigation to the end */
  .ag-paging-row-summary-panel {
    margin-right: auto !important; /* Push other elements to the right */
  }
  /* .ag-paging-page-summary-panel { margin-left: auto; } */ // This one might not be needed if the above works

  .ag-header-cell {
    background-color: #E5EBFF !important;
  }
`;


const SearchInput = styled.input`
  padding: 10px 15px;
  padding-left: 40px; /* Make space for the icon */
  font-size: 16px;
  border-radius: 20px; /* Updated to 20px */
  border: 1px solid #ccc; /* Ensure full border */
  width: 100%; 
  box-sizing: border-box;
  flex-grow: 1; /* Input takes available space */

  &:focus {
    outline: none;
    border-color: var(--primary-color);
  }
`;

const GridContainer = styled.div`
  height: 70vh; // Use viewport height for better responsiveness
  width: 100%;
  padding: 20px;
  box-sizing: border-box;

  .ag-header-cell-label {
    justify-content: center; /* Center align header text */
  }

  .ag-right-aligned-header .ag-header-cell-label {
    justify-content: flex-end;
  }

  // Ensure input fields within cells take full width if needed for editing
  .ag-input-wrapper input {
    width: 100%;
  }
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin-bottom: 20px;
`;

const PriceBoardAGGrid = () => {
  const gridRef = useRef(null);
  const [searchText, setSearchText] = useState('');
  const [rowData, setRowData] = useState([]);
  const [gridApi, setGridApi] = useState(null);

  // Column Definitions: Defines the columns to be displayed.
  const columnDefs = useMemo(() => [
    { headerName: 'Product Name', field: 'name', sortable: true, resizable: true, flex: 50, minWidth: 150 },
    { 
      headerName: 'Last (Rs.)', 
      field: 'minimum_price',  // <-- UPDATED FIELD NAME
      sortable: true, 
      resizable: true, 
      flex: 17, 
      minWidth: 100, 
      editable: true, 
      valueParser: params => Number(params.newValue)
    },
    { 
      headerName: 'Good (Rs.)', 
      field: 'fair_price',    // <-- FIELD NAME IS CORRECT (matches API)
      sortable: true, 
      resizable: true, 
      flex: 17, 
      minWidth: 100, 
      editable: true, 
      valueParser: params => Number(params.newValue)
    },
    { headerName: 'Unit', field: 'unit', sortable: true, resizable: true, flex: 10, minWidth: 80 },
  ], []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await priceService.getProducts(); // Using the existing service
        // Ensure the data structure matches what AG Grid expects, or transform if necessary.
        // AG Grid expects an array of objects, where each object is a row.
        // The 'field' in columnDefs should match the keys in these objects.
        // Example: if API returns { _id: '...', name: '...', ... }, it's fine.
        const rawProducts = response.data.products || [];
        const products = response.data.products || [];
        // Ensure 'id' is consistently available, map API's 'minimum_price' and 'fair_price' if needed for consistency
        // For now, assuming API returns 'id', 'minimum_price', 'fair_price' directly as needed by grid
        const processedProducts = products.map(p => ({ ...p, id: p.id || p._id }));
        setRowData(processedProducts); 
      } catch (error) {
        console.error('Error fetching products:', error);
        // Optionally, set some error state to display to the user
        setRowData([]); // Clear data on error or set to a default error structure
      }
    };

    fetchProducts();
  }, []);

  const onGridReady = useCallback((params) => {
    console.log('AG Grid: onGridReady fired. params.api available:', !!params.api);
    if (params.api) {
      console.log('AG Grid: Methods on params.api in onGridReady:', Object.keys(params.api));
    }
    setGridApi(params.api);
  }, []);

  useEffect(() => {
    if (gridApi) {
      gridApi.setGridOption('quickFilterText', searchText);
    }
  }, [searchText, gridApi]);

  const debouncedUpdateProduct = useCallback(
    debounce(async (updatedProductData) => {
      if (typeof updatedProductData.id === 'undefined') {
        console.error('Product ID is missing, cannot update');
        toast.error('Error: Product ID missing.');
        return;
      }
      try {
        // Optimistically update UI or use AG Grid API to flash cell/row
        // For now, just log and show toast
        const payloadToBackend = {
          minimum_price: updatedProductData.min_price, // Use 'minimum_price' for the backend
          fair_price: updatedProductData.fair_price,
        };
        console.log('Payload being constructed in debouncedUpdateProduct:', payloadToBackend);
        await priceService.updatePrice(updatedProductData.id, payloadToBackend); // Use 'id' and correct method name
        toast.success(`Product ${updatedProductData.name} updated!`);

        // Example of updating AG Grid data directly (if not refetching)
        // This is a simple way, might need more robust handling for complex cases
        // Or, you could refetch the specific row or entire dataset if necessary
        if (gridRef.current && gridRef.current.api) {
          const rowNode = gridRef.current.api.getRowNode(String(updatedProductData.id)); // Use 'id' and ensure it's a string
          if (rowNode) {
            rowNode.setData(updatedProductData);
            // Optionally, flash the cells
            // gridRef.current.api.flashCells({ rowNodes: [rowNode], columns: ['min_price', 'fair_price'] });
          }
        }

      } catch (error) {
        console.error('Error updating product:', error);
        toast.error(`Failed to update ${updatedProductData.name}.`);
        // Optionally, revert optimistic update here
      }
    }, 1000), // 1 second debounce
    []
  );

  const defaultColDef = useMemo(() => {
    return {
      editable: false, // Default: cells are not editable
      sortable: true,
      filter: false, // Disable filtering on all columns by default
      resizable: true,
      suppressMovable: true,
      cellStyle: { textAlign: 'left' }, // Default left align for cells
      headerClass: 'ag-left-aligned-header', // Default left align for headers (requires CSS class)
    };
  }, []);

  // AG Grid needs a way to identify rows, typically an 'id' field.
  // If your data has '_id', you can tell AG Grid to use it.
  const getRowId = useMemo(() => {
    return params => (params.data && params.data.id) ? String(params.data.id) : `generated-row-${agGridGeneratedIdCounter++}`; // Use 'id' for row identification
  }, []);

  const onFilterTextBoxChanged = (e) => {
    setSearchText(e.target.value);
  };

  return (
    <>
      <PaginationOverrideStyles />
      <Header />
      <GridContainer className="ag-theme-alpine">
        <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
        <Title>Price Board (AG Grid)</Title>
        <SearchContainer>
          <StyledSearchIcon />
          <SearchInput
            type="text"
            placeholder="Search products..."
            onChange={onFilterTextBoxChanged}
          />
          <SearchSubmitButton onClick={() => gridRef.current?.api?.onFilterChanged() /* Optional: trigger filter on click */ }>
            Enter
          </SearchSubmitButton>
        </SearchContainer>
        <AgGridReact
          modules={[AllCommunityModule]}
          ref={gridRef}
          onGridReady={onGridReady}
          rowModelType={'clientSide'} // Explicitly set, though it's default
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          onCellValueChanged={debouncedUpdateProduct} // Use the debounced version
          getRowId={getRowId}
          pagination={true}
          paginationPageSize={50} // Set fixed page size to 50
          paginationPageSizeSelector={false} // Remove page size selector
          suppressRowClickSelection={true}
          // stopEditingWhenCellsLoseFocus={true} // Consider this for UX
          ensureDomOrder={true} // This was present in the partial change, keeping it
          // enableCellTextSelection={true} // This was in a previous version, removed as it wasn't in the last good state
        />
      </GridContainer>
      <Footer />
    </>
  );
};

export default PriceBoardAGGrid;
