import React from 'react';
import './BaiduLogo.css';

interface BaiduLogoProps {
  onClick?: () => void;
}

const BaiduLogo: React.FC<BaiduLogoProps> = ({ onClick }) => {
  return (
    <div className="baidu-logo" onClick={onClick}>
      <svg 
        viewBox="0 0 140 56" 
        xmlns="http://www.w3.org/2000/svg"
        className="baidu-logo-svg"
        aria-label="百度"
      >
        {/* 百度 Logo SVG */}
        <g fill="#4e6ef2">
          {/* 熊掌 1 */}
          <path d="M30 15c0-5.5-3.5-10-8-10s-8 4.5-8 10 3.5 10 8 10 8-4.5 8-10z" />
          
          {/* 熊掌 2 */}
          <path d="M52 15c0-5.5-3.5-10-8-10s-8 4.5-8 10 3.5 10 8 10 8-4.5 8-10z" />
          
          {/* 熊掌 3 */}
          <path d="M10 30c0-4-2-7-5-7s-5 3-5 7 2 8 5 8 5-4 5-8z" />
          
          {/* 熊掌 4 */}
          <path d="M72 30c0-4-2-7-5-7s-5 3-5 7 2 8 5 8 5-4 5-8z" />
          
          {/* 熊脸 */}
          <ellipse cx="36" cy="38" rx="20" ry="15" />
        </g>
        
        {/* 百度文字 */}
        <text x="80" y="35" fontSize="24" fill="#4e6ef2" fontWeight="600" fontFamily="Arial, sans-serif">
          百度
        </text>
      </svg>
    </div>
  );
};

export default BaiduLogo;
