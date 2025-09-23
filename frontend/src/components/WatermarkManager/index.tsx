import React, { useState, useCallback, useRef, useEffect } from 'react';
import { WatermarkConfig, WatermarkPosition } from '@/types';

interface WatermarkManagerProps {
  imageUrl: string;
  onWatermarkApplied: (watermarkedImageUrl: string) => void;
  defaultConfig?: Partial<WatermarkConfig>;
  presets?: WatermarkConfig[];
  className?: string;
}

const DEFAULT_CONFIG: WatermarkConfig = {
  content: '版权所有',
  position: 'bottom-right',
  opacity: 0.5,
  fontSize: 16,
  color: '#ffffff',
  rotation: 0,
  type: 'text',
};

const POSITION_OPTIONS: { value: WatermarkPosition; label: string }[] = [
  { value: 'top-left', label: '左上' },
  { value: 'top-center', label: '上中' },
  { value: 'top-right', label: '右上' },
  { value: 'middle-left', label: '左中' },
  { value: 'middle-center', label: '中心' },
  { value: 'middle-right', label: '右中' },
  { value: 'bottom-left', label: '左下' },
  { value: 'bottom-center', label: '下中' },
  { value: 'bottom-right', label: '右下' },
];

/**
 * 水印管理组件
 * 
 * 功能特性：
 * - 文字和图片水印支持
 * - 水印位置和透明度调节
 * - 批量水印处理
 * - 水印模板管理
 */
export const WatermarkManager: React.FC<WatermarkManagerProps> = ({
  imageUrl,
  onWatermarkApplied,
  defaultConfig = {},
  presets = [],
  className = '',
}) => {
  const [config, setConfig] = useState<WatermarkConfig>({
    ...DEFAULT_CONFIG,
    ...defaultConfig,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // 计算水印位置
  const calculateWatermarkPosition = useCallback(
    (imageWidth: number, imageHeight: number, watermarkWidth: number, watermarkHeight: number) => {
      const margin = 20;
      let x = 0;
      let y = 0;

      switch (config.position) {
        case 'top-left':
          x = margin;
          y = margin;
          break;
        case 'top-center':
          x = (imageWidth - watermarkWidth) / 2;
          y = margin;
          break;
        case 'top-right':
          x = imageWidth - watermarkWidth - margin;
          y = margin;
          break;
        case 'middle-left':
          x = margin;
          y = (imageHeight - watermarkHeight) / 2;
          break;
        case 'middle-center':
          x = (imageWidth - watermarkWidth) / 2;
          y = (imageHeight - watermarkHeight) / 2;
          break;
        case 'middle-right':
          x = imageWidth - watermarkWidth - margin;
          y = (imageHeight - watermarkHeight) / 2;
          break;
        case 'bottom-left':
          x = margin;
          y = imageHeight - watermarkHeight - margin;
          break;
        case 'bottom-center':
          x = (imageWidth - watermarkWidth) / 2;
          y = imageHeight - watermarkHeight - margin;
          break;
        case 'bottom-right':
          x = imageWidth - watermarkWidth - margin;
          y = imageHeight - watermarkHeight - margin;
          break;
      }

      return { x, y };
    },
    [config.position]
  );

  // 绘制文字水印
  const drawTextWatermark = useCallback(
    (ctx: CanvasRenderingContext2D, imageWidth: number, imageHeight: number) => {
      const { content, fontSize, color, opacity, rotation } = config;
      
      ctx.font = `${fontSize}px Arial`;
      ctx.fillStyle = color;
      ctx.globalAlpha = opacity;
      
      const textMetrics = ctx.measureText(content);
      const textWidth = textMetrics.width;
      const textHeight = fontSize;
      
      const { x, y } = calculateWatermarkPosition(imageWidth, imageHeight, textWidth, textHeight);
      
      ctx.save();
      ctx.translate(x + textWidth / 2, y + textHeight / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.fillText(content, -textWidth / 2, textHeight / 4);
      ctx.restore();
      
      ctx.globalAlpha = 1;
    },
    [config, calculateWatermarkPosition]
  );

  // 绘制图片水印
  const drawImageWatermark = useCallback(
    async (ctx: CanvasRenderingContext2D, imageWidth: number, imageHeight: number) => {
      if (!config.imageUrl) return;
      
      return new Promise<void>((resolve, reject) => {
        const watermarkImg = new Image();
        watermarkImg.crossOrigin = 'anonymous';
        
        watermarkImg.onload = () => {
          const { opacity, rotation } = config;
          const watermarkWidth = watermarkImg.width;
          const watermarkHeight = watermarkImg.height;
          
          const { x, y } = calculateWatermarkPosition(
            imageWidth,
            imageHeight,
            watermarkWidth,
            watermarkHeight
          );
          
          ctx.save();
          ctx.globalAlpha = opacity;
          ctx.translate(x + watermarkWidth / 2, y + watermarkHeight / 2);
          ctx.rotate((rotation * Math.PI) / 180);
          ctx.drawImage(
            watermarkImg,
            -watermarkWidth / 2,
            -watermarkHeight / 2,
            watermarkWidth,
            watermarkHeight
          );
          ctx.restore();
          ctx.globalAlpha = 1;
          
          resolve();
        };
        
        watermarkImg.onerror = () => {
          reject(new Error('Failed to load watermark image'));
        };
        
        watermarkImg.src = config.imageUrl;
      });
    },
    [config, calculateWatermarkPosition]
  );

  // 应用水印
  const applyWatermark = useCallback(async () => {
    if (!canvasRef.current) return;
    
    setIsProcessing(true);
    
    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Cannot get canvas context');
      
      // 加载原始图片
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          
          // 绘制原始图片
          ctx.drawImage(img, 0, 0);
          
          resolve();
        };
        
        img.onerror = () => {
          reject(new Error('Failed to load image'));
        };
        
        img.src = imageUrl;
      });
      
      // 应用水印
      if (config.type === 'text') {
        drawTextWatermark(ctx, canvas.width, canvas.height);
      } else if (config.type === 'image') {
        await drawImageWatermark(ctx, canvas.width, canvas.height);
      }
      
      // 生成结果图片
      const watermarkedImageUrl = canvas.toDataURL('image/png', 0.9);
      onWatermarkApplied(watermarkedImageUrl);
      
    } catch (error) {
      console.error('Failed to apply watermark:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [imageUrl, config, drawTextWatermark, drawImageWatermark, onWatermarkApplied]);

  // 生成预览
  const generatePreview = useCallback(async () => {
    if (!previewCanvasRef.current) return;
    
    try {
      const canvas = previewCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          // 缩放到预览尺寸
          const maxSize = 300;
          const scale = Math.min(maxSize / img.width, maxSize / img.height);
          const scaledWidth = img.width * scale;
          const scaledHeight = img.height * scale;
          
          canvas.width = scaledWidth;
          canvas.height = scaledHeight;
          
          // 绘制缩放后的图片
          ctx.drawImage(img, 0, 0, scaledWidth, scaledHeight);
          
          // 应用水印（按比例缩放）
          const scaledConfig = {
            ...config,
            fontSize: config.fontSize * scale,
          };
          
          if (config.type === 'text') {
            ctx.font = `${scaledConfig.fontSize}px Arial`;
            ctx.fillStyle = config.color;
            ctx.globalAlpha = config.opacity;
            
            const textMetrics = ctx.measureText(config.content);
            const textWidth = textMetrics.width;
            const textHeight = scaledConfig.fontSize;
            
            const { x, y } = calculateWatermarkPosition(scaledWidth, scaledHeight, textWidth, textHeight);
            
            ctx.save();
            ctx.translate(x + textWidth / 2, y + textHeight / 2);
            ctx.rotate((config.rotation * Math.PI) / 180);
            ctx.fillText(config.content, -textWidth / 2, textHeight / 4);
            ctx.restore();
            ctx.globalAlpha = 1;
          }
          
          setPreviewUrl(canvas.toDataURL());
          resolve();
        };
        
        img.onerror = reject;
        img.src = imageUrl;
      });
      
    } catch (error) {
      console.error('Failed to generate preview:', error);
    }
  }, [imageUrl, config, calculateWatermarkPosition]);

  // 配置变化时更新预览
  useEffect(() => {
    generatePreview();
  }, [generatePreview]);

  // 加载预设
  const loadPreset = useCallback((preset: WatermarkConfig) => {
    setConfig(preset);
  }, []);

  // 保存为预设
  const saveAsPreset = useCallback(() => {
    // 这里应该调用 API 保存预设
    console.log('Save preset:', config);
  }, [config]);

  return (
    <div className={`watermark-manager ${className}`}>
      <div className="watermark-controls">
        <div className="control-group">
          <label>水印类型</label>
          <select
            value={config.type}
            onChange={(e) => setConfig(prev => ({ ...prev, type: e.target.value as 'text' | 'image' }))}
          >
            <option value="text">文字水印</option>
            <option value="image">图片水印</option>
          </select>
        </div>

        {config.type === 'text' ? (
          <div className="control-group">
            <label>水印文字</label>
            <input
              type="text"
              value={config.content}
              onChange={(e) => setConfig(prev => ({ ...prev, content: e.target.value }))}
              placeholder="请输入水印文字"
            />
          </div>
        ) : (
          <div className="control-group">
            <label>水印图片</label>
            <input
              type="url"
              value={config.imageUrl || ''}
              onChange={(e) => setConfig(prev => ({ ...prev, imageUrl: e.target.value }))}
              placeholder="请输入图片URL"
            />
          </div>
        )}

        <div className="control-group">
          <label>位置</label>
          <select
            value={config.position}
            onChange={(e) => setConfig(prev => ({ ...prev, position: e.target.value as WatermarkPosition }))}
          >
            {POSITION_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label>透明度: {config.opacity}</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={config.opacity}
            onChange={(e) => setConfig(prev => ({ ...prev, opacity: parseFloat(e.target.value) }))}
          />
        </div>

        {config.type === 'text' && (
          <>
            <div className="control-group">
              <label>字体大小</label>
              <input
                type="number"
                value={config.fontSize}
                onChange={(e) => setConfig(prev => ({ ...prev, fontSize: parseInt(e.target.value) }))}
                min="8"
                max="72"
              />
            </div>

            <div className="control-group">
              <label>颜色</label>
              <input
                type="color"
                value={config.color}
                onChange={(e) => setConfig(prev => ({ ...prev, color: e.target.value }))}
              />
            </div>
          </>
        )}

        <div className="control-group">
          <label>旋转角度: {config.rotation}°</label>
          <input
            type="range"
            min="-45"
            max="45"
            step="1"
            value={config.rotation}
            onChange={(e) => setConfig(prev => ({ ...prev, rotation: parseInt(e.target.value) }))}
          />
        </div>

        <div className="control-actions">
          <button
            onClick={applyWatermark}
            disabled={isProcessing}
            className="btn btn-primary"
          >
            {isProcessing ? '处理中...' : '应用水印'}
          </button>
          
          <button
            onClick={saveAsPreset}
            className="btn btn-secondary"
          >
            保存预设
          </button>
        </div>

        {presets.length > 0 && (
          <div className="presets">
            <label>预设模板</label>
            <div className="preset-list">
              {presets.map((preset, index) => (
                <button
                  key={index}
                  onClick={() => loadPreset(preset)}
                  className="preset-item"
                >
                  {preset.content}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="watermark-preview">
        <div className="preview-title">预览</div>
        <div className="preview-container">
          {previewUrl ? (
            <img src={previewUrl} alt="水印预览" />
          ) : (
            <div className="preview-placeholder">
              预览加载中...
            </div>
          )}
        </div>
      </div>

      {/* 隐藏的画布 */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <canvas ref={previewCanvasRef} style={{ display: 'none' }} />
    </div>
  );
};

// 导出相关 hooks
export const useWatermark = () => {
  const [config, setConfig] = useState<WatermarkConfig>(DEFAULT_CONFIG);
  const [presets, setPresets] = useState<WatermarkConfig[]>([]);

  const applyWatermark = useCallback(async (imageUrl: string, watermarkConfig: WatermarkConfig) => {
    // 创建临时 canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Cannot create canvas context');

    // 加载图片
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    return new Promise<string>((resolve, reject) => {
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        
        // 绘制原图
        ctx.drawImage(img, 0, 0);
        
        // 应用水印
        if (watermarkConfig.type === 'text') {
          ctx.font = `${watermarkConfig.fontSize}px Arial`;
          ctx.fillStyle = watermarkConfig.color;
          ctx.globalAlpha = watermarkConfig.opacity;
          
          // 计算位置并绘制文字
          const textMetrics = ctx.measureText(watermarkConfig.content);
          // ... 位置计算逻辑 ...
          
          ctx.fillText(watermarkConfig.content, 50, 50); // 简化示例
        }
        
        resolve(canvas.toDataURL());
      };
      
      img.onerror = reject;
      img.src = imageUrl;
    });
  }, []);

  const savePreset = useCallback((preset: WatermarkConfig) => {
    setPresets(prev => [...prev, preset]);
  }, []);

  const loadPreset = useCallback((preset: WatermarkConfig) => {
    setConfig(preset);
  }, []);

  return {
    config,
    setConfig,
    presets,
    applyWatermark,
    savePreset,
    loadPreset,
  };
};