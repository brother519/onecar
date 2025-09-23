import React, { useState, useCallback, useRef, useEffect } from 'react';
import QRCode from 'qrcode';
import { QRCodeConfig, QRErrorLevel } from '@/types';

interface QRCodeGeneratorProps {
  data?: string;
  config?: Partial<QRCodeConfig>;
  onGenerated?: (qrCodeUrl: string) => void;
  className?: string;
  showControls?: boolean;
}

const DEFAULT_CONFIG: QRCodeConfig = {
  data: '',
  size: 200,
  errorLevel: 'M',
  margin: 4,
  colorDark: '#000000',
  colorLight: '#ffffff',
};

const ERROR_LEVELS: { value: QRErrorLevel; label: string; description: string }[] = [
  { value: 'L', label: 'L (低)', description: '约7%错误恢复能力' },
  { value: 'M', label: 'M (中)', description: '约15%错误恢复能力' },
  { value: 'Q', label: 'Q (高)', description: '约25%错误恢复能力' },
  { value: 'H', label: 'H (最高)', description: '约30%错误恢复能力' },
];

/**
 * 二维码生成器组件
 * 
 * 功能特性：
 * - 商品链接二维码生成
 * - 自定义二维码样式和尺寸
 * - 批量二维码生成
 * - 二维码导出和下载
 */
export const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({
  data = '',
  config = {},
  onGenerated,
  className = '',
  showControls = true,
}) => {
  const [qrConfig, setQrConfig] = useState<QRCodeConfig>({
    ...DEFAULT_CONFIG,
    data,
    ...config,
  });
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string>('');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 生成二维码
  const generateQRCode = useCallback(async () => {
    if (!qrConfig.data.trim()) {
      setError('请输入要生成二维码的内容');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const options = {
        errorCorrectionLevel: qrConfig.errorLevel,
        type: 'image/png' as const,
        quality: 0.92,
        margin: qrConfig.margin,
        color: {
          dark: qrConfig.colorDark,
          light: qrConfig.colorLight,
        },
        width: qrConfig.size,
      };

      // 生成二维码到 canvas
      if (canvasRef.current) {
        await QRCode.toCanvas(canvasRef.current, qrConfig.data, options);
        
        // 如果有 logo，添加 logo
        if (qrConfig.logo) {
          await addLogoToQRCode(canvasRef.current, qrConfig.logo);
        }
        
        const dataUrl = canvasRef.current.toDataURL('image/png');
        setQrCodeUrl(dataUrl);
        onGenerated?.(dataUrl);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '生成二维码失败';
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  }, [qrConfig, onGenerated]);

  // 添加 logo 到二维码
  const addLogoToQRCode = useCallback(async (canvas: HTMLCanvasElement, logoUrl: string) => {
    return new Promise<void>((resolve, reject) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Cannot get canvas context'));
        return;
      }

      const logo = new Image();
      logo.crossOrigin = 'anonymous';
      
      logo.onload = () => {
        // 计算 logo 大小（占二维码的 1/5）
        const logoSize = canvas.width / 5;
        const logoX = (canvas.width - logoSize) / 2;
        const logoY = (canvas.height - logoSize) / 2;
        
        // 绘制白色背景
        ctx.fillStyle = 'white';
        ctx.fillRect(logoX - 2, logoY - 2, logoSize + 4, logoSize + 4);
        
        // 绘制 logo
        ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
        
        resolve();
      };
      
      logo.onerror = () => {
        reject(new Error('Failed to load logo'));
      };
      
      logo.src = logoUrl;
    });
  }, []);

  // 下载二维码
  const downloadQRCode = useCallback(() => {
    if (!qrCodeUrl) return;
    
    const link = document.createElement('a');
    link.download = `qrcode-${Date.now()}.png`;
    link.href = qrCodeUrl;
    link.click();
  }, [qrCodeUrl]);

  // 复制二维码
  const copyQRCode = useCallback(async () => {
    if (!qrCodeUrl) return;
    
    try {
      // 将 data URL 转换为 Blob
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      
      // 复制到剪贴板
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      
      // 这里可以显示成功提示
      console.log('二维码已复制到剪贴板');
    } catch (err) {
      console.error('复制失败:', err);
      // 降级方案：复制 data URL
      try {
        await navigator.clipboard.writeText(qrCodeUrl);
        console.log('二维码链接已复制到剪贴板');
      } catch (err) {
        console.error('复制链接也失败了:', err);
      }
    }
  }, [qrCodeUrl]);

  // 配置变化时自动生成
  useEffect(() => {
    if (qrConfig.data) {
      generateQRCode();
    }
  }, [generateQRCode]);

  return (
    <div className={`qrcode-generator ${className}`}>
      {showControls && (
        <div className="qrcode-controls">
          <div className="control-group">
            <label>内容</label>
            <textarea
              value={qrConfig.data}
              onChange={(e) => setQrConfig(prev => ({ ...prev, data: e.target.value }))}
              placeholder="请输入要生成二维码的内容（URL、文本等）"
              rows={3}
            />
          </div>

          <div className="control-row">
            <div className="control-group">
              <label>尺寸</label>
              <input
                type="number"
                value={qrConfig.size}
                onChange={(e) => setQrConfig(prev => ({ ...prev, size: parseInt(e.target.value) }))}
                min="100"
                max="800"
                step="50"
              />
            </div>

            <div className="control-group">
              <label>边距</label>
              <input
                type="number"
                value={qrConfig.margin}
                onChange={(e) => setQrConfig(prev => ({ ...prev, margin: parseInt(e.target.value) }))}
                min="0"
                max="10"
              />
            </div>
          </div>

          <div className="control-group">
            <label>错误纠正级别</label>
            <select
              value={qrConfig.errorLevel}
              onChange={(e) => setQrConfig(prev => ({ ...prev, errorLevel: e.target.value as QRErrorLevel }))}
            >
              {ERROR_LEVELS.map(level => (
                <option key={level.value} value={level.value} title={level.description}>
                  {level.label}
                </option>
              ))}
            </select>
          </div>

          <div className="control-row">
            <div className="control-group">
              <label>前景色</label>
              <div className="color-input">
                <input
                  type="color"
                  value={qrConfig.colorDark}
                  onChange={(e) => setQrConfig(prev => ({ ...prev, colorDark: e.target.value }))}
                />
                <input
                  type="text"
                  value={qrConfig.colorDark}
                  onChange={(e) => setQrConfig(prev => ({ ...prev, colorDark: e.target.value }))}
                  placeholder="#000000"
                />
              </div>
            </div>

            <div className="control-group">
              <label>背景色</label>
              <div className="color-input">
                <input
                  type="color"
                  value={qrConfig.colorLight}
                  onChange={(e) => setQrConfig(prev => ({ ...prev, colorLight: e.target.value }))}
                />
                <input
                  type="text"
                  value={qrConfig.colorLight}
                  onChange={(e) => setQrConfig(prev => ({ ...prev, colorLight: e.target.value }))}
                  placeholder="#ffffff"
                />
              </div>
            </div>
          </div>

          <div className="control-group">
            <label>Logo URL（可选）</label>
            <input
              type="url"
              value={qrConfig.logo || ''}
              onChange={(e) => setQrConfig(prev => ({ ...prev, logo: e.target.value }))}
              placeholder="输入 Logo 图片链接"
            />
          </div>

          <div className="control-actions">
            <button
              onClick={generateQRCode}
              disabled={isGenerating || !qrConfig.data.trim()}
              className="btn btn-primary"
            >
              {isGenerating ? '生成中...' : '生成二维码'}
            </button>
          </div>
        </div>
      )}

      <div className="qrcode-display">
        <div className="qrcode-container">
          <canvas
            ref={canvasRef}
            style={{
              maxWidth: '100%',
              height: 'auto',
              border: '1px solid #ddd',
              borderRadius: '8px',
            }}
          />
          
          {qrCodeUrl && (
            <div className="qrcode-actions">
              <button
                onClick={downloadQRCode}
                className="btn btn-secondary"
                title="下载二维码"
              >
                📥 下载
              </button>
              
              <button
                onClick={copyQRCode}
                className="btn btn-secondary"
                title="复制二维码"
              >
                📋 复制
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="qrcode-error">
            {error}
          </div>
        )}

        {!qrCodeUrl && !isGenerating && !error && (
          <div className="qrcode-placeholder">
            <div className="placeholder-icon">📱</div>
            <div className="placeholder-text">
              {qrConfig.data ? '点击生成二维码' : '请输入内容生成二维码'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// 批量二维码生成组件
interface BatchQRCodeGeneratorProps {
  items: Array<{ id: string; data: string; label?: string }>;
  config?: Partial<QRCodeConfig>;
  onBatchGenerated?: (results: Array<{ id: string; qrCodeUrl: string }>) => void;
  className?: string;
}

export const BatchQRCodeGenerator: React.FC<BatchQRCodeGeneratorProps> = ({
  items,
  config = {},
  onBatchGenerated,
  className = '',
}) => {
  const [progress, setProgress] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<Array<{ id: string; qrCodeUrl: string }>>([]);

  const generateBatch = useCallback(async () => {
    if (items.length === 0) return;

    setIsGenerating(true);
    setProgress(0);
    setResults([]);

    const batchResults: Array<{ id: string; qrCodeUrl: string }> = [];
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      try {
        const canvas = document.createElement('canvas');
        const options = {
          errorCorrectionLevel: config.errorLevel || 'M',
          type: 'image/png' as const,
          margin: config.margin || 4,
          color: {
            dark: config.colorDark || '#000000',
            light: config.colorLight || '#ffffff',
          },
          width: config.size || 200,
        };

        await QRCode.toCanvas(canvas, item.data, options);
        const qrCodeUrl = canvas.toDataURL('image/png');
        
        batchResults.push({
          id: item.id,
          qrCodeUrl,
        });
        
        setProgress(((i + 1) / items.length) * 100);
        
        // 添加小延迟避免阻塞 UI
        await new Promise(resolve => setTimeout(resolve, 50));
        
      } catch (error) {
        console.error(`Failed to generate QR code for item ${item.id}:`, error);
      }
    }

    setResults(batchResults);
    onBatchGenerated?.(batchResults);
    setIsGenerating(false);
  }, [items, config, onBatchGenerated]);

  const downloadAll = useCallback(() => {
    results.forEach((result, index) => {
      const link = document.createElement('a');
      link.download = `qrcode-${result.id}.png`;
      link.href = result.qrCodeUrl;
      
      // 添加延迟避免同时下载太多文件
      setTimeout(() => {
        link.click();
      }, index * 100);
    });
  }, [results]);

  return (
    <div className={`batch-qrcode-generator ${className}`}>
      <div className="batch-header">
        <h3>批量生成二维码</h3>
        <div className="batch-stats">
          共 {items.length} 项，已生成 {results.length} 项
        </div>
      </div>

      <div className="batch-controls">
        <button
          onClick={generateBatch}
          disabled={isGenerating || items.length === 0}
          className="btn btn-primary"
        >
          {isGenerating ? `生成中... ${Math.round(progress)}%` : '开始批量生成'}
        </button>

        {results.length > 0 && (
          <button
            onClick={downloadAll}
            className="btn btn-secondary"
          >
            下载全部 ({results.length})
          </button>
        )}
      </div>

      {isGenerating && (
        <div className="batch-progress">
          <div 
            className="progress-bar"
            style={{ width: `${progress}%` }}
          />
          <div className="progress-text">
            {Math.round(progress)}%
          </div>
        </div>
      )}

      <div className="batch-results">
        {results.map((result) => {
          const item = items.find(i => i.id === result.id);
          return (
            <div key={result.id} className="batch-result-item">
              <img src={result.qrCodeUrl} alt={`QR Code for ${item?.label || result.id}`} />
              <div className="result-info">
                <div className="result-label">{item?.label || result.id}</div>
                <div className="result-data">{item?.data}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// 导出相关 hooks
export const useQRCode = (initialData: string = '') => {
  const [config, setConfig] = useState<QRCodeConfig>({
    ...DEFAULT_CONFIG,
    data: initialData,
  });
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  const generate = useCallback(async (data?: string) => {
    const qrData = data || config.data;
    if (!qrData) return;

    setIsGenerating(true);
    
    try {
      const dataUrl = await QRCode.toDataURL(qrData, {
        errorCorrectionLevel: config.errorLevel,
        margin: config.margin,
        color: {
          dark: config.colorDark,
          light: config.colorLight,
        },
        width: config.size,
      });
      
      setQrCodeUrl(dataUrl);
      return dataUrl;
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, [config]);

  const updateConfig = useCallback((updates: Partial<QRCodeConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  const download = useCallback((filename?: string) => {
    if (!qrCodeUrl) return;
    
    const link = document.createElement('a');
    link.download = filename || `qrcode-${Date.now()}.png`;
    link.href = qrCodeUrl;
    link.click();
  }, [qrCodeUrl]);

  return {
    config,
    qrCodeUrl,
    isGenerating,
    generate,
    updateConfig,
    download,
  };
};