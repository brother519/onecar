import React, { useState, useCallback, useRef, useEffect } from 'react';
import { CaptchaConfig, CaptchaResponse } from '@/types';

interface CaptchaInputProps {
  onVerify: (token: string, value: string) => Promise<boolean>;
  config?: Partial<CaptchaConfig>;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const DEFAULT_CONFIG: CaptchaConfig = {
  width: 120,
  height: 40,
  length: 4,
  noise: 0.3,
  color: true,
};

/**
 * 验证码输入组件
 * 
 * 功能特性：
 * - 生成和验证图形验证码
 * - 支持音频验证码（可访问性）
 * - 验证码刷新和重新生成
 * - 集成第三方验证服务
 */
export const CaptchaInput: React.FC<CaptchaInputProps> = ({
  onVerify,
  config = {},
  placeholder = '请输入验证码',
  disabled = false,
  className = '',
  onSuccess,
  onError,
}) => {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const [captchaData, setCaptchaData] = useState<CaptchaResponse | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 生成随机字符串
  const generateRandomString = useCallback((length: number): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }, []);

  // 绘制验证码
  const drawCaptcha = useCallback((canvas: HTMLCanvasElement, text: string) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height, noise, color } = mergedConfig;
    
    // 清空画布
    ctx.clearRect(0, 0, width, height);
    
    // 背景
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, width, height);
    
    // 绘制噪点
    for (let i = 0; i < width * height * noise; i++) {
      ctx.fillStyle = color ? 
        `hsl(${Math.random() * 360}, 50%, ${50 + Math.random() * 50}%)` : 
        `rgba(0, 0, 0, ${Math.random() * 0.3})`;
      ctx.fillRect(
        Math.random() * width,
        Math.random() * height,
        1,
        1
      );
    }
    
    // 绘制干扰线
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      ctx.strokeStyle = color ? 
        `hsl(${Math.random() * 360}, 50%, 70%)` : 
        `rgba(0, 0, 0, ${0.1 + Math.random() * 0.2})`;
      ctx.beginPath();
      ctx.moveTo(Math.random() * width, Math.random() * height);
      ctx.lineTo(Math.random() * width, Math.random() * height);
      ctx.stroke();
    }
    
    // 绘制文字
    const fontSize = Math.min(width / text.length * 0.8, height * 0.6);
    ctx.font = `${fontSize}px Arial`;
    ctx.textBaseline = 'middle';
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const x = (width / text.length) * i + (width / text.length) / 2;
      const y = height / 2;
      
      // 随机颜色和旋转
      ctx.fillStyle = color ? 
        `hsl(${Math.random() * 360}, 70%, 40%)` : 
        `rgba(0, 0, 0, ${0.7 + Math.random() * 0.3})`;
      
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((Math.random() - 0.5) * 0.5);
      ctx.fillText(char, -fontSize / 4, 0);
      ctx.restore();
    }
  }, [mergedConfig]);

  // 生成新验证码
  const generateCaptcha = useCallback(() => {
    const text = generateRandomString(mergedConfig.length);
    const token = Math.random().toString(36).substring(2);
    
    if (canvasRef.current) {
      drawCaptcha(canvasRef.current, text);
      const image = canvasRef.current.toDataURL();
      
      setCaptchaData({
        token,
        image,
        // 实际项目中，验证码文本不应该暴露给前端
        // 这里仅为演示目的
        __text: text,
      } as CaptchaResponse & { __text: string });
    }
    
    setInputValue('');
    setError('');
  }, [generateRandomString, mergedConfig.length, drawCaptcha]);

  // 验证验证码
  const handleVerify = useCallback(async () => {
    if (!captchaData || !inputValue.trim()) {
      setError('请输入验证码');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      // 本地验证（实际项目中应该在后端验证）
      const isValid = inputValue.toUpperCase() === (captchaData as any).__text;
      
      if (isValid) {
        const success = await onVerify(captchaData.token, inputValue);
        if (success) {
          onSuccess?.();
        } else {
          setError('验证失败，请重试');
          generateCaptcha();
        }
      } else {
        setError('验证码错误');
        generateCaptcha();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '验证失败';
      setError(errorMessage);
      onError?.(errorMessage);
      generateCaptcha();
    } finally {
      setIsVerifying(false);
    }
  }, [captchaData, inputValue, onVerify, onSuccess, onError, generateCaptcha]);

  // 处理输入变化
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setInputValue(value);
    setError('');
    
    // 自动验证
    if (value.length === mergedConfig.length) {
      setTimeout(handleVerify, 100);
    }
  }, [mergedConfig.length, handleVerify]);

  // 处理回车键
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isVerifying) {
      handleVerify();
    }
  }, [handleVerify, isVerifying]);

  // 初始化验证码
  useEffect(() => {
    generateCaptcha();
  }, [generateCaptcha]);

  // 音频验证码（可访问性）
  const playAudio = useCallback(() => {
    if (!captchaData) return;
    
    // 使用 Web Speech API 播放验证码
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(
        (captchaData as any).__text.split('').join(' ')
      );
      utterance.rate = 0.5;
      speechSynthesis.speak(utterance);
    }
  }, [captchaData]);

  return (
    <div className={`captcha-input ${className}`}>
      <div className="captcha-display">
        <canvas
          ref={canvasRef}
          width={mergedConfig.width}
          height={mergedConfig.height}
          className="captcha-canvas"
          onClick={generateCaptcha}
          title="点击刷新验证码"
        />
        
        <div className="captcha-actions">
          <button
            type="button"
            onClick={generateCaptcha}
            disabled={isVerifying}
            className="captcha-refresh"
            title="刷新验证码"
          >
            🔄
          </button>
          
          <button
            type="button"
            onClick={playAudio}
            disabled={isVerifying}
            className="captcha-audio"
            title="音频验证码"
          >
            🔊
          </button>
        </div>
      </div>
      
      <div className="captcha-input-group">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isVerifying}
          maxLength={mergedConfig.length}
          className={`form-input ${error ? 'error' : ''}`}
          autoComplete="off"
        />
        
        <button
          type="button"
          onClick={handleVerify}
          disabled={disabled || isVerifying || !inputValue.trim()}
          className="btn btn-primary captcha-verify"
        >
          {isVerifying ? '验证中...' : '验证'}
        </button>
      </div>
      
      {error && (
        <div className="captcha-error">
          {error}
        </div>
      )}
    </div>
  );
};

// 导出相关 hooks
export const useCaptcha = (onVerify: (token: string, value: string) => Promise<boolean>) => {
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState('');

  const handleSuccess = useCallback(() => {
    setIsVerified(true);
    setError('');
  }, []);

  const handleError = useCallback((error: string) => {
    setIsVerified(false);
    setError(error);
  }, []);

  const reset = useCallback(() => {
    setIsVerified(false);
    setError('');
  }, []);

  return {
    isVerified,
    error,
    handleSuccess,
    handleError,
    reset,
    captchaProps: {
      onVerify,
      onSuccess: handleSuccess,
      onError: handleError,
    },
  };
};