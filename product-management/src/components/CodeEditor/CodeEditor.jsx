import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Button, Select, Space, Tooltip, message, Modal } from 'antd'
import {
  SaveOutlined,
  UndoOutlined,
  RedoOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  FormatPainterOutlined,
  SearchOutlined,
  SettingOutlined,
} from '@ant-design/icons'

// 模拟 Monaco Editor，实际使用时需要安装 @monaco-editor/react
const MonacoEditorMock = ({ 
  value, 
  onChange, 
  language, 
  theme, 
  options,
  height 
}) => {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: '100%',
        height: height || '400px',
        border: 'none',
        outline: 'none',
        resize: 'none',
        fontFamily: 'Monaco, "Courier New", monospace',
        fontSize: '14px',
        lineHeight: '1.5',
        padding: '16px',
        backgroundColor: theme === 'vs-dark' ? '#1e1e1e' : '#ffffff',
        color: theme === 'vs-dark' ? '#d4d4d4' : '#333333',
      }}
      placeholder={`请输入${language}代码...`}
    />
  )
}

const CodeEditor = ({
  initialValue = '',
  initialLanguage = 'javascript',
  height = 400,
  onSave,
  onValueChange,
  readOnly = false,
  showToolbar = true,
  showMinimap = true,
}) => {
  const [value, setValue] = useState(initialValue)
  const [language, setLanguage] = useState(initialLanguage)
  const [theme, setTheme] = useState('vs-dark')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [history, setHistory] = useState([initialValue])
  const [historyIndex, setHistoryIndex] = useState(0)
  const [isSettingsVisible, setIsSettingsVisible] = useState(false)
  const [editorOptions, setEditorOptions] = useState({
    fontSize: 14,
    wordWrap: 'off',
    minimap: { enabled: showMinimap },
    scrollBeyondLastLine: false,
    automaticLayout: true,
  })
  
  const editorRef = useRef(null)
  const containerRef = useRef(null)
  
  // 支持的编程语言
  const languages = [
    { label: 'JavaScript', value: 'javascript' },
    { label: 'TypeScript', value: 'typescript' },
    { label: 'JSON', value: 'json' },
    { label: 'HTML', value: 'html' },
    { label: 'CSS', value: 'css' },
    { label: 'SQL', value: 'sql' },
    { label: 'Python', value: 'python' },
    { label: 'Java', value: 'java' },
    { label: 'C++', value: 'cpp' },
    { label: 'PHP', value: 'php' },
    { label: 'Shell', value: 'shell' },
    { label: 'XML', value: 'xml' },
    { label: 'Markdown', value: 'markdown' },
  ]
  
  // 主题选项
  const themes = [
    { label: '浅色主题', value: 'vs-light' },
    { label: '深色主题', value: 'vs-dark' },
    { label: '高对比度', value: 'hc-black' },
  ]
  
  // 处理编辑器值变化
  const handleEditorChange = useCallback((newValue) => {
    setValue(newValue)
    setIsDirty(newValue !== initialValue)
    
    // 添加到历史记录
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(newValue)
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
    
    onValueChange && onValueChange(newValue)
  }, [initialValue, history, historyIndex, onValueChange])
  
  // 保存
  const handleSave = useCallback(() => {
    if (readOnly) {
      message.warning('只读模式下无法保存')
      return
    }
    
    onSave && onSave(value, language)
    setIsDirty(false)
    message.success('保存成功')
  }, [value, language, onSave, readOnly])
  
  // 撤销
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      setValue(history[newIndex])
      setIsDirty(history[newIndex] !== initialValue)
    }
  }, [history, historyIndex, initialValue])
  
  // 重做
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)
      setValue(history[newIndex])
      setIsDirty(history[newIndex] !== initialValue)
    }
  }, [history, historyIndex, initialValue])
  
  // 格式化代码
  const handleFormat = useCallback(async () => {
    try {
      // 这里应该集成真正的格式化工具
      // 目前只做简单的格式化演示
      let formattedValue = value
      
      if (language === 'json') {
        try {
          const parsed = JSON.parse(value)
          formattedValue = JSON.stringify(parsed, null, 2)
        } catch (e) {
          message.error('JSON格式错误，无法格式化')
          return
        }
      }
      
      setValue(formattedValue)
      handleEditorChange(formattedValue)
      message.success('代码格式化完成')
    } catch (error) {
      message.error('格式化失败')
    }
  }, [value, language, handleEditorChange])
  
  // 搜索替换
  const handleSearch = useCallback(() => {
    // 这里应该打开搜索替换对话框
    message.info('搜索功能开发中...')
  }, [])
  
  // 全屏切换
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen)
  }, [isFullscreen])
  
  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 's':
            e.preventDefault()
            handleSave()
            break
          case 'z':
            if (e.shiftKey) {
              e.preventDefault()
              handleRedo()
            } else {
              e.preventDefault()
              handleUndo()
            }
            break
          case 'f':
            e.preventDefault()
            handleSearch()
            break
          case 'Enter':
            if (e.shiftKey) {
              e.preventDefault()
              handleFormat()
            }
            break
          default:
            break
        }
      }
      
      if (e.key === 'F11') {
        e.preventDefault()
        toggleFullscreen()
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleSave, handleUndo, handleRedo, handleFormat, handleSearch, toggleFullscreen])
  
  // 渲染工具栏
  const renderToolbar = () => {
    if (!showToolbar) return null
    
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 16px',
          borderBottom: '1px solid #f0f0f0',
          backgroundColor: '#fafafa',
        }}
      >
        <Space>
          <Select
            value={language}
            onChange={setLanguage}
            style={{ width: 120 }}
            size="small"
            options={languages}
            disabled={readOnly}
          />
          
          <Select
            value={theme}
            onChange={setTheme}
            style={{ width: 100 }}
            size="small"
            options={themes}
          />
        </Space>
        
        <Space>
          <Tooltip title="撤销 (Ctrl+Z)">
            <Button
              size="small"
              icon={<UndoOutlined />}
              onClick={handleUndo}
              disabled={historyIndex <= 0 || readOnly}
            />
          </Tooltip>
          
          <Tooltip title="重做 (Ctrl+Shift+Z)">
            <Button
              size="small"
              icon={<RedoOutlined />}
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1 || readOnly}
            />
          </Tooltip>
          
          <Tooltip title="格式化代码 (Ctrl+Shift+Enter)">
            <Button
              size="small"
              icon={<FormatPainterOutlined />}
              onClick={handleFormat}
              disabled={readOnly}
            />
          </Tooltip>
          
          <Tooltip title="搜索替换 (Ctrl+F)">
            <Button
              size="small"
              icon={<SearchOutlined />}
              onClick={handleSearch}
            />
          </Tooltip>
          
          <Tooltip title="编辑器设置">
            <Button
              size="small"
              icon={<SettingOutlined />}
              onClick={() => setIsSettingsVisible(true)}
            />
          </Tooltip>
          
          <Tooltip title={isFullscreen ? '退出全屏 (F11)' : '全屏 (F11)'}>
            <Button
              size="small"
              icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
              onClick={toggleFullscreen}
            />
          </Tooltip>
          
          {!readOnly && (
            <Tooltip title="保存 (Ctrl+S)">
              <Button
                type="primary"
                size="small"
                icon={<SaveOutlined />}
                onClick={handleSave}
                disabled={!isDirty}
              >
                保存
              </Button>
            </Tooltip>
          )}
        </Space>
      </div>
    )
  }
  
  // 渲染状态栏
  const renderStatusBar = () => {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '4px 16px',
          borderTop: '1px solid #f0f0f0',
          backgroundColor: '#fafafa',
          fontSize: '12px',
          color: '#666',
        }}
      >
        <Space>
          <span>语言: {language}</span>
          <span>字符数: {value.length}</span>
          <span>行数: {value.split('\n').length}</span>
          {isDirty && <span style={{ color: '#faad14' }}>● 未保存</span>}
        </Space>
        
        <Space>
          <span>主题: {theme}</span>
          {readOnly && <span style={{ color: '#1890ff' }}>只读模式</span>}
        </Space>
      </div>
    )
  }
  
  // 编辑器容器样式
  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    height: isFullscreen ? '100vh' : height,
    border: '1px solid #d9d9d9',
    borderRadius: '6px',
    overflow: 'hidden',
    position: isFullscreen ? 'fixed' : 'relative',
    top: isFullscreen ? 0 : 'auto',
    left: isFullscreen ? 0 : 'auto',
    right: isFullscreen ? 0 : 'auto',
    bottom: isFullscreen ? 0 : 'auto',
    zIndex: isFullscreen ? 9999 : 'auto',
    backgroundColor: '#fff',
  }
  
  return (
    <>
      <div ref={containerRef} className="code-editor-container" style={containerStyle}>
        {renderToolbar()}
        
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <MonacoEditorMock
            value={value}
            onChange={handleEditorChange}
            language={language}
            theme={theme}
            options={{
              ...editorOptions,
              readOnly,
            }}
            height="100%"
          />
        </div>
        
        {renderStatusBar()}
      </div>
      
      {/* 编辑器设置弹窗 */}
      <Modal
        title="编辑器设置"
        visible={isSettingsVisible}
        onCancel={() => setIsSettingsVisible(false)}
        onOk={() => setIsSettingsVisible(false)}
        width={400}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <label>字体大小:</label>
            <Select
              value={editorOptions.fontSize}
              onChange={(value) => setEditorOptions(prev => ({ ...prev, fontSize: value }))}
              style={{ width: '100%', marginTop: 4 }}
              options={[
                { label: '12px', value: 12 },
                { label: '14px', value: 14 },
                { label: '16px', value: 16 },
                { label: '18px', value: 18 },
                { label: '20px', value: 20 },
              ]}
            />
          </div>
          
          <div>
            <label>自动换行:</label>
            <Select
              value={editorOptions.wordWrap}
              onChange={(value) => setEditorOptions(prev => ({ ...prev, wordWrap: value }))}
              style={{ width: '100%', marginTop: 4 }}
              options={[
                { label: '关闭', value: 'off' },
                { label: '开启', value: 'on' },
                { label: '自动', value: 'auto' },
              ]}
            />
          </div>
        </Space>
      </Modal>
    </>
  )
}

export default CodeEditor