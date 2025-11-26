import React, { useState, useEffect } from 'react';
import { Row, Col, Input } from 'antd';
import ProductList from '../components/ProductList';
import UserCard from '../components/UserCard';
import SearchResultList from '../components/SearchResultList';

// 模拟的产品数据接口
export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
  rating: number;
  category: string;
}

// 模拟的产品数据
const mockProducts: Product[] = [
  {
    id: '1',
    name: '高性能汽车轮胎',
    price: 899.99,
    image: 'https://via.placeholder.com/150',
    description: '适用于各种路况的高性能轮胎，提供卓越的抓地力和耐久性。',
    rating: 4.5,
    category: '轮胎'
  },
  {
    id: '2',
    name: '汽车发动机机油',
    price: 199.99,
    image: 'https://via.placeholder.com/150',
    description: '高品质全合成发动机机油，提供出色的润滑保护。',
    rating: 4.8,
    category: '机油'
  },
  {
    id: '3',
    name: '汽车空气滤清器',
    price: 89.99,
    image: 'https://via.placeholder.com/150',
    description: '高效空气滤清器，确保发动机获取清洁的空气供应。',
    rating: 4.2,
    category: '滤清器'
  },
  {
    id: '4',
    name: '刹车片套装',
    price: 299.99,
    image: 'https://via.placeholder.com/150',
    description: '优质陶瓷刹车片套装，提供稳定的制动性能和低噪音运行。',
    rating: 4.6,
    category: '刹车系统'
  },
  {
    id: '5',
    name: '汽车蓄电池',
    price: 599.99,
    image: 'https://via.placeholder.com/150',
    description: '高容量汽车蓄电池，适用于各种气候条件，提供可靠启动能力。',
    rating: 4.7,
    category: '电气系统'
  },
  {
    id: '6',
    name: '汽车雨刷',
    price: 79.99,
    image: 'https://via.placeholder.com/150',
    description: '优质橡胶雨刷片，提供清晰的视野，适合各种天气条件。',
    rating: 4.3,
    category: '雨刷'
  }
];

const HomePage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  
  // 搜索产品的处理函数
  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  // 当搜索词变化时，过滤产品
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    const filteredProducts = mockProducts.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setSearchResults(filteredProducts);
  }, [searchTerm]);

  return (
    <div className="home-page">
      <Row gutter={[24, 24]}>
        <Col span={18}>
          <Input.Search 
            placeholder="搜索商品..."
            size="large"
            onSearch={handleSearch}
            onChange={(e) => handleSearch(e.target.value)}
            style={{ marginBottom: 20 }}
          />
          
          {searchTerm.trim() ? (
            <SearchResultList 
              products={searchResults} 
              searchTerm={searchTerm} 
            />
          ) : (
            <ProductList products={products} />
          )}
        </Col>
        
        <Col span={6}>
          <UserCard />
        </Col>
      </Row>
    </div>
  );
};

export default HomePage;