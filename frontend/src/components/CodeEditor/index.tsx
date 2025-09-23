import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as monaco from 'monaco-editor';
import { CodeLanguage, CodeEditorConfig } from '@/types';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  config?: Partial<CodeEditorConfig>;
  onValidate?: (markers: monaco.editor.IMarker[]) => void;
  className?: string;
  height?: number;
  readOnly?: boolean;
}

const DEFAULT_CONFIG: CodeEditorConfig = {
  language: 'json',
  theme: 'light',
  fontSize: 14,
  lineNumbers: true,
  wordWrap: true,
  minimap: false,
};

/**
 * 代码编辑器组件
 * 
 * 功能特性：
 * - 语法高亮和自动补全
 * - 支持多种代码格式（JSON、HTML、Markdown）
 * - 实时预览和格式验证
 * - 代码美化和格式化
 */
export const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  config = {},
  onValidate,
  className = '',
  height = 400,
  readOnly = false,
}) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  // 初始化编辑器
  const initializeEditor = useCallback(async () => {
    if (!containerRef.current) return;

    try {
      // 配置 Monaco Editor
      monaco.editor.defineTheme('custom-light', {
        base: 'vs',
        inherit: true,
        rules: [
          { token: 'keyword', foreground: '#0066cc' },
          { token: 'string', foreground: '#008000' },
          { token: 'number', foreground: '#ff6600' },
        ],
        colors: {
          'editor.background': '#ffffff',
          'editor.foreground': '#262626',
        },
      });

      monaco.editor.defineTheme('custom-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [
          { token: 'keyword', foreground: '#569cd6' },
          { token: 'string', foreground: '#ce9178' },
          { token: 'number', foreground: '#b5cea8' },
        ],
        colors: {
          'editor.background': '#1e1e1e',
          'editor.foreground': '#d4d4d4',
        },
      });

      // 创建编辑器实例
      editorRef.current = monaco.editor.create(containerRef.current, {
        value,
        language: mergedConfig.language,
        theme: mergedConfig.theme === 'dark' ? 'custom-dark' : 'custom-light',
        fontSize: mergedConfig.fontSize,
        lineNumbers: mergedConfig.lineNumbers ? 'on' : 'off',
        wordWrap: mergedConfig.wordWrap ? 'on' : 'off',
        minimap: { enabled: mergedConfig.minimap },
        readOnly,
        automaticLayout: true,
        scrollBeyondLastLine: false,
        renderLineHighlight: 'gutter',
        selectionHighlight: false,
        contextmenu: true,
        mouseWheelZoom: true,
      });

      // 监听内容变化
      editorRef.current.onDidChangeModelContent(() => {
        const currentValue = editorRef.current?.getValue() || '';
        onChange(currentValue);
      });

      // 监听验证错误
      if (onValidate) {
        monaco.editor.onDidChangeMarkers(([resource]) => {
          if (editorRef.current && resource.toString() === editorRef.current.getModel()?.uri.toString()) {
            const markers = monaco.editor.getModelMarkers({ resource });
            onValidate(markers);
          }
        });
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Failed to initialize Monaco Editor:', error);
      setIsLoading(false);
    }
  }, [value, mergedConfig, onChange, onValidate, readOnly]);

  // 格式化代码
  const formatCode = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.formatDocument')?.run();
    }
  }, []);

  // 设置语言
  const setLanguage = useCallback((language: CodeLanguage) => {
    if (editorRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        monaco.editor.setModelLanguage(model, language);
      }
    }
  }, []);

  // 设置主题
  const setTheme = useCallback((theme: 'light' | 'dark') => {
    monaco.editor.setTheme(theme === 'dark' ? 'custom-dark' : 'custom-light');
  }, []);

  // 插入文本
  const insertText = useCallback((text: string) => {
    if (editorRef.current) {
      const selection = editorRef.current.getSelection();
      const op = { range: selection!, text, forceMoveMarkers: true };
      editorRef.current.executeEdits('insert-text', [op]);
      editorRef.current.focus();
    }
  }, []);

  // 获取选中文本
  const getSelectedText = useCallback(() => {
    if (editorRef.current) {
      const selection = editorRef.current.getSelection();
      if (selection) {
        return editorRef.current.getModel()?.getValueInRange(selection) || '';
      }
    }
    return '';
  }, []);

  // 初始化
  useEffect(() => {
    initializeEditor();

    return () => {
      if (editorRef.current) {
        editorRef.current.dispose();
      }
    };
  }, [initializeEditor]);

  // 更新值
  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.getValue()) {
      editorRef.current.setValue(value);
    }
  }, [value]);

  // 更新配置
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions({
        fontSize: mergedConfig.fontSize,
        lineNumbers: mergedConfig.lineNumbers ? 'on' : 'off',
        wordWrap: mergedConfig.wordWrap ? 'on' : 'off',
        minimap: { enabled: mergedConfig.minimap },
        readOnly,
      });
    }
  }, [mergedConfig, readOnly]);

  return (
    <div className={`code-editor ${className}`}>
      {/* 工具栏 */}
      <div className="code-editor-toolbar">
        <div className="toolbar-left">
          <select
            value={mergedConfig.language}
            onChange={(e) => setLanguage(e.target.value as CodeLanguage)}
            className="language-selector"
          >
            <option value="json">JSON</option>
            <option value="html">HTML</option>
            <option value="markdown">Markdown</option>
            <option value="javascript">JavaScript</option>
          </select>
          
          <select
            value={mergedConfig.theme}
            onChange={(e) => setTheme(e.target.value as 'light' | 'dark')}
            className="theme-selector"
          >
            <option value="light">浅色主题</option>
            <option value="dark">深色主题</option>
          </select>
        </div>
        
        <div className="toolbar-right">
          <button
            onClick={formatCode}
            className="btn btn-secondary"
            title="格式化代码"
          >
            格式化
          </button>
        </div>
      </div>

      {/* 编辑器容器 */}
      <div
        ref={containerRef}
        className="code-editor-container"
        style={{ height }}
      >
        {isLoading && (
          <div className="code-editor-loading">
            <div className="loading-spinner" />
            <span>加载编辑器中...</span>
          </div>
        )}
      </div>
    </div>
  );
};

// 预览组件
interface CodePreviewProps {
  code: string;
  language: CodeLanguage;
  className?: string;
}

export const CodePreview: React.FC<CodePreviewProps> = ({
  code,
  language,
  className = '',
}) => {
  const renderPreview = () => {
    switch (language) {
      case 'html':
        return (
          <div
            className="html-preview"
            dangerouslySetInnerHTML={{ __html: code }}
          />
        );
      
      case 'markdown':
        // 这里应该使用 markdown 解析器，如 react-markdown
        return (
          <div className="markdown-preview">
            <pre>{code}</pre>
          </div>
        );
      
      case 'json':
        try {
          const parsed = JSON.parse(code);
          return (
            <div className="json-preview">
              <pre>{JSON.stringify(parsed, null, 2)}</pre>
            </div>
          );
        } catch {
          return (
            <div className="json-preview error">
              JSON 格式错误
            </div>
          );
        }
      
      default:
        return (
          <div className="code-preview">
            <pre>{code}</pre>
          </div>
        );
    }
  };

  return (
    <div className={`code-preview-container ${className}`}>
      <div className="code-preview-header">
        <span className="preview-title">预览</span>
        <span className="preview-language">{language.toUpperCase()}</span>
      </div>
      <div className="code-preview-content">
        {renderPreview()}
      </div>
    </div>
  );
};

// 导出相关 hooks
export const useCodeEditor = (initialValue: string = '') => {
  const [value, setValue] = useState(initialValue);
  const [errors, setErrors] = useState<monaco.editor.IMarker[]>([]);
  const [config, setConfig] = useState<Partial<CodeEditorConfig>>({});

  const handleChange = useCallback((newValue: string) => {
    setValue(newValue);
  }, []);

  const handleValidate = useCallback((markers: monaco.editor.IMarker[]) => {
    setErrors(markers.filter(marker => marker.severity === monaco.MarkerSeverity.Error));
  }, []);

  const updateConfig = useCallback((newConfig: Partial<CodeEditorConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  const reset = useCallback(() => {
    setValue(initialValue);
    setErrors([]);
  }, [initialValue]);

  const isValid = errors.length === 0;

  return {
    value,
    setValue,
    errors,
    isValid,
    config,
    updateConfig,
    reset,
    editorProps: {
      value,
      onChange: handleChange,
      onValidate: handleValidate,
      config,
    },
  };
};