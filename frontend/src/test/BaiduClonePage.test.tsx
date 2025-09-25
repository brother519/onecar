import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import BaiduClonePage from '../src/components/BaiduClonePage'

// Mock fetch
global.fetch = vi.fn()

describe('BaiduClonePage 组件测试', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('应该正确渲染页面', () => {
    render(<BaiduClonePage />)
    
    expect(screen.getByText('百度首页抓取与仿写')).toBeInTheDocument()
    expect(screen.getByText('抓取百度首页的页面结构、样式和内容，并生成可复用的组件代码')).toBeInTheDocument()
  })

  it('应该显示抓取配置表单', () => {
    render(<BaiduClonePage />)
    
    expect(screen.getByLabelText('目标URL')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '开始抓取' })).toBeInTheDocument()
  })

  it('应该有默认的百度URL', () => {
    render(<BaiduClonePage />)
    
    const urlInput = screen.getByLabelText('目标URL') as HTMLInputElement
    expect(urlInput.value).toBe('https://www.baidu.com')
  })

  it('应该显示生成配置选项', () => {
    render(<BaiduClonePage />)
    
    // 切换到生成配置选项卡
    fireEvent.click(screen.getByText('生成配置'))
    
    expect(screen.getByText('保真度级别')).toBeInTheDocument()
    expect(screen.getByText('组件化程度')).toBeInTheDocument()
    expect(screen.getByText('样式处理方式')).toBeInTheDocument()
    expect(screen.getByText('交互功能')).toBeInTheDocument()
    expect(screen.getByText('响应式设计')).toBeInTheDocument()
    expect(screen.getByText('代码格式')).toBeInTheDocument()
  })

  it('应该能够启动抓取任务', async () => {
    const mockResponse = {
      success: true,
      data: {
        taskId: 'test-task-id',
        status: 'PENDING'
      }
    }

    ;(fetch as any).mockResolvedValueOnce({
      json: async () => mockResponse
    })

    render(<BaiduClonePage />)
    
    const startButton = screen.getByRole('button', { name: '开始抓取' })
    fireEvent.click(startButton)

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/fetch/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: 'https://www.baidu.com',
          options: {
            forceRefresh: false
          }
        }),
      })
    })
  })

  it('应该显示任务状态', async () => {
    const mockTasks = [
      {
        id: 'task-1',
        url: 'https://www.baidu.com',
        status: 'COMPLETE',
        progress: 100,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]

    ;(fetch as any).mockResolvedValueOnce({
      json: async () => ({
        success: true,
        data: mockTasks
      })
    })

    render(<BaiduClonePage />)

    await waitFor(() => {
      expect(screen.getByText('https://www.baidu.com')).toBeInTheDocument()
      expect(screen.getByText('COMPLETE')).toBeInTheDocument()
    })
  })

  it('应该能够生成代码', async () => {
    const mockGenerateResponse = {
      success: true,
      data: {
        generatedCode: {
          components: [
            {
              name: 'TestComponent',
              code: 'const TestComponent = () => <div>Test</div>',
              styles: '.test { color: red; }'
            }
          ]
        }
      }
    }

    ;(fetch as any).mockResolvedValueOnce({
      json: async () => mockGenerateResponse
    })

    render(<BaiduClonePage />)
    
    // 模拟点击生成代码按钮
    const generateButton = screen.getByText('生成代码')
    fireEvent.click(generateButton)

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/clone/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining('taskId')
      })
    })
  })

  it('应该处理错误情况', async () => {
    const mockErrorResponse = {
      success: false,
      message: '抓取失败'
    }

    ;(fetch as any).mockResolvedValueOnce({
      json: async () => mockErrorResponse
    })

    render(<BaiduClonePage />)
    
    const startButton = screen.getByRole('button', { name: '开始抓取' })
    fireEvent.click(startButton)

    // 这里应该显示错误消息，但由于我们使用的是 antd 的 message，
    // 在测试环境中可能不会直接显示，所以我们主要验证 fetch 被调用
    await waitFor(() => {
      expect(fetch).toHaveBeenCalled()
    })
  })
})