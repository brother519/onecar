import React, { useState } from 'react';
import { List, Card, Typography, Rate, Button, Select, Slider, Empty } from 'antd';
import { ShoppingCartOutlined, FilterOutlined } from '@ant-design/icons';
import { Product } from '../pages/HomePage';
import { useCart } from '../contexts/CartContext';

import '../styles/SearchResultList.css';

const { Title, Text } = Typography;
const { Option } = Select;

interface SearchResultListProps {
  products: Product[];
  searchTerm: string;
}

const SearchResultList: React.FC<SearchResultListProps> = ({ products, searchTerm }) => {
  const { addItem } = useCart();
  const [sortOrder, setSortOrder] = useState<string>('default');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [minRating, setMinRating] = useState<number>(0);
  const [showFilter, setShowFilter] = useState<boolean>(false);

  // 对产品进行排序和过滤
  const getSortedAndFilteredProducts = () => {
    let result = [...products];
    
    // 价格过滤
    result = result.filter(product => 
      product.price >= priceRange[0] && product.price <= priceRange[1]
    );
    
    // 评分过滤
    result = result.filter(product => product.rating >= minRating);
    
    // 排序
    switch (sortOrder) {
      case 'price_asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      default:
        // 默认排序，保持原有顺序
        break;
    }
    
    return result;
  };

  // 添加商品到购物车
  const handleAddToCart = (product: Product) => {
    addItem({
      id: product.id,
      name: product.name,
      image: product.image,
      price: product.price,
      quantity: 1
    });
  };

  // 计算价格范围的最大值
  const getMaxPrice = () => {
    if (products.length === 0) return 1000;
    return Math.ceil(Math.max(...products.map(p => p.price)));
  };

  // 切换过滤面板显示
  const toggleFilter = () => {
    setShowFilter(!showFilter);
  };

  const sortedAndFilteredProducts = getSortedAndFilteredProducts();
  const maxPrice = getMaxPrice();

  return (
    <div className="search-result-list">
      <div className="search-header">
        <Title level={3}>搜索结果: "{searchTerm}"</Title>
        <div className="search-actions">
          <Button 
            icon={<FilterOutlined />} 
            onClick={toggleFilter}
            type={showFilter ? 'primary' : 'default'}
          >
            筛选
          </Button>
          <Select 
            defaultValue="default" 
            style={{ width: 120 }} 
            onChange={setSortOrder}
          >
            <Option value="default">默认排序</Option>
            <Option value="price_asc">价格升序</Option>
            <Option value="price_desc">价格降序</Option>
            <Option value="rating">评分排序</Option>
          </Select>
        </div>
      </div>
      
      {showFilter && (
        <Card className="filter-panel">
          <div className="filter-section">
            <Title level={5}>价格范围</Title>
            <Slider
              range
              min={0}
              max={maxPrice}
              defaultValue={[0, maxPrice]}
              onChange={(value) => setPriceRange(value as [number, number])}
              marks={{
                0: '¥0',
                [maxPrice]: `¥${maxPrice}`
              }}
            />
          </div>
          
          <div className="filter-section">
            <Title level={5}>最低评分</Title>
            <Rate 
              allowHalf 
              value={minRating} 
              onChange={setMinRating} 
            />
          </div>
        </Card>
      )}
      
      {sortedAndFilteredProducts.length > 0 ? (
        <List
          itemLayout="horizontal"
          dataSource={sortedAndFilteredProducts}
          renderItem={product => (
            <List.Item
              actions={[
                <Button
                  type="primary"
                  icon={<ShoppingCartOutlined />}
                  onClick={() => handleAddToCart(product)}
                >
                  加入购物车
                </Button>
              ]}
            >
              <List.Item.Meta
                avatar={<img src={product.image} alt={product.name} className="product-image" />}
                title={product.name}
                description={
                  <div>
                    <Text type="danger" strong>¥{product.price.toFixed(2)}</Text>
                    <br />
                    <Rate allowHalf disabled defaultValue={product.rating} />
                    <br />
                    <Text>{product.description}</Text>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      ) : (
        <Empty 
          description={
            <span>
              没有找到与 "{searchTerm}" 相关的商品
            </span>
          }
        />
      )}
    </div>
  );
};

export default SearchResultList;