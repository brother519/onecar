import React from 'react';
import { ProductLink } from '../../types/baidu';
import './FooterInfo.css';

const FooterInfo: React.FC = () => {
  const productLinks: ProductLink[] = [
    { name: '关于百度', url: 'https://home.baidu.com', category: 'company' },
    { name: 'About Baidu', url: 'https://ir.baidu.com', category: 'company' },
    { name: '百度营销', url: 'https://e.baidu.com', category: 'business' },
    { name: '使用百度前必读', url: 'https://www.baidu.com/duty/', category: 'legal' },
    { name: '意见反馈', url: 'https://help.baidu.com', category: 'service' },
    { name: '帮助中心', url: 'https://help.baidu.com', category: 'service' },
  ];

  const groupedLinks = {
    company: productLinks.filter(link => link.category === 'company'),
    business: productLinks.filter(link => link.category === 'business'),
    legal: productLinks.filter(link => link.category === 'legal'),
    service: productLinks.filter(link => link.category === 'service'),
  };

  return (
    <footer className="footer-info" role="contentinfo">
      <div className="footer-container">
        {/* 产品导航 */}
        <nav className="footer-nav" aria-label="底部导航">
          <ul className="footer-links">
            {productLinks.map((link) => (
              <li key={link.name} className="footer-link-item">
                <a 
                  href={link.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="footer-link"
                >
                  {link.name}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* 版权信息 */}
        <div className="footer-copyright">
          <p className="copyright-text">
            © 2025 Baidu 
            <a 
              href="https://beian.miit.gov.cn" 
              target="_blank" 
              rel="noopener noreferrer"
              className="beian-link"
            >
              京ICP证030173号
            </a>
          </p>
          
          <div className="footer-extra">
            <a 
              href="http://www.beian.gov.cn" 
              target="_blank" 
              rel="noopener noreferrer"
              className="footer-extra-link"
            >
              <span className="police-icon">🛡️</span>
              京公网安备11000002000001号
            </a>
          </div>
        </div>

        {/* 附加信息 */}
        <div className="footer-meta">
          <p className="meta-text">
            互联网药品信息服务资格证书 (京)-经营性-2017-0020
          </p>
          <p className="meta-text">
            信息网络传播视听节目许可证 0110516
          </p>
        </div>
      </div>
    </footer>
  );
};

export default FooterInfo;
