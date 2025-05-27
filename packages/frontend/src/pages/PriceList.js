import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { priceService } from '../services/api';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Button from '../components/Button';

const PageContainer = styled.div`
  min-height: 100vh;
  padding: 70px 20px 80px;
  background-color: var(--secondary-color);
`;

const SearchBar = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
`;

const SearchInput = styled.input`
  flex: 1;
  padding: 10px;
  border: 1px solid var(--border-color);
  border-radius: 10px;
  font-size: 14px;
  &:focus {
    outline: 1px solid var(--primary-color);
  }
`;

const ProductList = styled.div`
  background: white;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid var(--border-color);
`;

const ProductItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid var(--border-color);
`;

const ProductInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const ProductName = styled.div`
  font-size: 16px;
  font-weight: 500;
`;

const ProductUnit = styled.div`
  font-size: 12px;
  color: var(--text-light);
`;

const ProductPrice = styled.div`
  font-size: 16px;
  font-weight: 600;
`;

const AddProductSection = styled.div`
  margin-top: 20px;
  background: white;
  border-radius: 10px;
  padding: 15px;
  border: 1px solid var(--border-color);
`;

const FormTitle = styled.h3`
  font-size: 16px;
  margin-bottom: 15px;
`;

const FormRow = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
`;

const Input = styled.input`
  flex: 1;
  padding: 10px;
  border: 1px solid var(--border-color);
  border-radius: 5px;
  font-size: 14px;
  &:focus {
    outline: 1px solid var(--primary-color);
  }
`;

const AddButton = styled(Button)`
  position: fixed;
  bottom: 90px;
  right: 20px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.2);
  z-index: 90;
`;

const EmptyMessage = styled.div`
  text-align: center;
  padding: 20px;
  color: var(--text-light);
`;

const PriceList = () => {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    defaultUnit: 'kg',
    price: ''
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(product => 
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [searchQuery, products]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await priceService.getProducts();
      if (response.data && response.data.products) {
        setProducts(response.data.products);
        setFilteredProducts(response.data.products);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProduct(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.price) {
      alert('Please enter product name and price');
      return;
    }

    try {
      setLoading(true);
      const productData = {
        name: newProduct.name,
        default_unit: newProduct.defaultUnit,
        price: parseFloat(newProduct.price)
      };

      const response = await priceService.addProduct(productData);
      if (response.data && response.data.product) {
        // Add the new product to the list
        setProducts([...products, response.data.product]);
        setNewProduct({
          name: '',
          defaultUnit: 'kg',
          price: ''
        });
        setShowAddForm(false);
      }
    } catch (error) {
      console.error('Error adding product:', error);
      alert('Failed to add product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePrice = async (productId, newPrice) => {
    try {
      await priceService.updatePrice(productId, { price: newPrice });
      // Update the product in the list
      const updatedProducts = products.map(product => {
        if (product.id === productId) {
          return { ...product, price: newPrice };
        }
        return product;
      });
      setProducts(updatedProducts);
    } catch (error) {
      console.error('Error updating price:', error);
      alert('Failed to update price. Please try again.');
    }
  };

  return (
    <>
      <Header />
      <PageContainer>
        <SearchBar>
          <SearchInput 
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </SearchBar>

        <ProductList>
          {loading ? (
            <EmptyMessage>Loading products...</EmptyMessage>
          ) : filteredProducts.length === 0 ? (
            <EmptyMessage>No products found</EmptyMessage>
          ) : (
            filteredProducts.map((product) => (
              <ProductItem key={product.id}>
                <ProductInfo>
                  <ProductName>{product.name}</ProductName>
                  <ProductUnit>Unit: {product.default_unit}</ProductUnit>
                </ProductInfo>
                <ProductPrice>₹{product.price}</ProductPrice>
              </ProductItem>
            ))
          )}
        </ProductList>

        {showAddForm && (
          <AddProductSection>
            <FormTitle>Add New Product</FormTitle>
            <FormRow>
              <Input 
                type="text"
                name="name"
                placeholder="Product Name"
                value={newProduct.name}
                onChange={handleInputChange}
              />
            </FormRow>
            <FormRow>
              <Input 
                type="text"
                name="defaultUnit"
                placeholder="Unit (e.g., kg, pcs)"
                value={newProduct.defaultUnit}
                onChange={handleInputChange}
              />
              <Input 
                type="number"
                name="price"
                placeholder="Price"
                value={newProduct.price}
                onChange={handleInputChange}
              />
            </FormRow>
            <FormRow>
              <Button 
                variant="secondary" 
                outline
                onClick={() => setShowAddForm(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAddProduct}
                disabled={loading}
              >
                Add Product
              </Button>
            </FormRow>
          </AddProductSection>
        )}

        {!showAddForm && (
          <AddButton onClick={() => setShowAddForm(true)}>+</AddButton>
        )}
      </PageContainer>
      <Footer />
    </>
  );
};

export default PriceList;
