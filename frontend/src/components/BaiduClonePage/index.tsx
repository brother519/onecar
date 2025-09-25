import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Space,
  Progress,
  Tabs,
  Alert,
  List,
  Tag,
  Modal,
  Switch,
  Select,
  Row,
  Col,
  Typography,
  Divider,
  message
} from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
  EyeOutlined,
  DownloadOutlined,
  DeleteOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { CodeEditor } from '../CodeEditor';
import './BaiduClonePage.css';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

interface FetchTask {
  id: string;
  url: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETE' | 'ERROR';
  progress: number;
  createdAt: string;
  updatedAt: string;
  error?: string;
}

interface CloneConfig {
  fidelity: 'high' | 'medium' | 'low';
  componentization: 'full' | 'partial' | 'none';
  styleHandling: 'inherit' | 'simplified' | 'custom';
  interactivity: 'full' | 'basic' | 'static';
  responsive: 'full' | 'desktop' | 'mobile';
  format: 'react' | 'vue' | 'html';
}

const BaiduClonePage: React.FC = () => {
  const [form] = Form.useForm();
  const [tasks, setTasks] = useState<FetchTask[]>([]);
  const [currentTask, setCurrentTask] = useState<FetchTask | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('fetch');
  const [cloneConfig, setCloneConfig] = useState<CloneConfig>({
    fidelity: 'high',
    componentization: 'partial',
    styleHandling: 'inherit',
    interactivity: 'basic',
    responsive: 'full',
    format: 'react'
  });
  const [generatedCode, setGeneratedCode] = useState<any>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');

  // 获取任务列表
  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/fetch/tasks');
      const data = await response.json();
      if (data.success) {
        setTasks(data.data);
      }
    } catch (error) {
      console.error('获取任务列表失败:', error);
    }
  };

  // 开始抓取任务
  const startFetchTask = async (values: any) => {
    setLoading(true);
    try {
      const response = await fetch('/api/fetch/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: values.url,
          options: {
            forceRefresh: values.forceRefresh || false
          }
        }),
      });

      const data = await response.json();
      if (data.success) {
        message.success('抓取任务已启动');
        const newTask: FetchTask = {
          id: data.data.taskId,
          url: values.url,
          status: 'PENDING',
          progress: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setTasks(prev => [newTask, ...prev]);
        setCurrentTask(newTask);
        
        // 开始轮询任务状态
        pollTaskStatus(data.data.taskId);
      } else {
        message.error(data.message || '启动抓取任务失败');
      }
    } catch (error) {
      console.error('启动抓取任务失败:', error);
      message.error('网络请求失败');
    } finally {
      setLoading(false);
    }
  };

  // 轮询任务状态
  const pollTaskStatus = async (taskId: string) => {
    const poll = async () => {
      try {
        const response = await fetch(`/api/fetch/status/${taskId}`);
        const data = await response.json();
        
        if (data.success) {
          const updatedTask = data.data;
          setTasks(prev => prev.map(task => 
            task.id === taskId ? updatedTask : task
          ));
          
          if (currentTask?.id === taskId) {
            setCurrentTask(updatedTask);
          }
          
          // 如果任务完成或出错，停止轮询
          if (updatedTask.status === 'COMPLETE' || updatedTask.status === 'ERROR') {
            if (updatedTask.status === 'COMPLETE') {
              message.success('页面抓取完成');
            } else {
              message.error(`抓取失败: ${updatedTask.error}`);
            }
            return;
          }
          
          // 继续轮询
          setTimeout(poll, 2000);
        }
      } catch (error) {
        console.error('查询任务状态失败:', error);
      }
    };
    
    poll();
  };

  // 生成克隆页面
  const generateClonePage = async (taskId: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/clone/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId,
          config: cloneConfig
        }),
      });

      const data = await response.json();
      if (data.success) {
        setGeneratedCode(data.data.generatedCode);
        setActiveTab('code');
        message.success('克隆页面生成成功');
      } else {
        message.error(data.message || '生成克隆页面失败');
      }
    } catch (error) {
      console.error('生成克隆页面失败:', error);
      message.error('网络请求失败');
    } finally {
      setLoading(false);
    }
  };

  // 预览页面
  const previewPage = async (taskId: string) => {
    try {
      const response = await fetch('/api/clone/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pageData: { title: '百度首页克隆预览' }
        }),
      });

      const data = await response.json();
      if (data.success) {
        setPreviewUrl(data.data.previewUrl);
        setPreviewVisible(true);
      } else {
        message.error(data.message || '生成预览失败');
      }
    } catch (error) {
      console.error('预览页面失败:', error);
      message.error('网络请求失败');
    }
  };

  // 删除任务
  const deleteTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/fetch/task/${taskId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        setTasks(prev => prev.filter(task => task.id !== taskId));
        if (currentTask?.id === taskId) {
          setCurrentTask(null);
        }
        message.success('任务已删除');
      } else {
        message.error(data.message || '删除任务失败');
      }
    } catch (error) {
      console.error('删除任务失败:', error);
      message.error('网络请求失败');
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  return (
    <div className="baidu-clone-page">
      <div className="page-header">
        <Title level={2}>百度首页抓取与仿写</Title>
        <Paragraph type="secondary">
          抓取百度首页的页面结构、样式和内容，并生成可复用的组件代码
        </Paragraph>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="页面抓取" key="fetch">
          <Row gutter={24}>
            <Col span={12}>
              <Card title="抓取配置" className="fetch-config-card">
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={startFetchTask}
                  initialValues={{
                    url: 'https://www.baidu.com',
                    forceRefresh: false
                  }}
                >
                  <Form.Item
                    label="目标URL"
                    name="url"
                    rules={[
                      { required: true, message: '请输入目标URL' },
                      { type: 'url', message: '请输入有效的URL' }
                    ]}
                  >
                    <Input placeholder="https://www.baidu.com" />
                  </Form.Item>

                  <Form.Item
                    label="抓取选项"
                    name="forceRefresh"
                    valuePropName="checked"
                  >
                    <Switch checkedChildren="强制刷新" unCheckedChildren="使用缓存" />
                  </Form.Item>

                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={loading}
                      icon={<PlayCircleOutlined />}
                      block
                    >
                      开始抓取
                    </Button>
                  </Form.Item>
                </Form>

                {currentTask && (
                  <Card title="当前任务状态" size="small" style={{ marginTop: 16 }}>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <div>
                        <Text strong>任务ID:</Text> <Text code>{currentTask.id}</Text>
                      </div>
                      <div>
                        <Text strong>URL:</Text> <Text>{currentTask.url}</Text>
                      </div>
                      <div>
                        <Text strong>状态:</Text>{' '}
                        <Tag color={
                          currentTask.status === 'COMPLETE' ? 'success' :
                          currentTask.status === 'ERROR' ? 'error' :
                          currentTask.status === 'IN_PROGRESS' ? 'processing' : 'default'
                        }>
                          {currentTask.status}
                        </Tag>
                      </div>
                      {currentTask.status === 'IN_PROGRESS' && (
                        <Progress percent={currentTask.progress} status="active" />
                      )}
                      {currentTask.error && (
                        <Alert message={currentTask.error} type="error" showIcon />
                      )}
                    </Space>
                  </Card>
                )}
              </Card>
            </Col>

            <Col span={12}>
              <Card
                title="任务历史"
                extra={
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={fetchTasks}
                    size="small"
                  >
                    刷新
                  </Button>
                }
              >
                <List
                  dataSource={tasks}
                  renderItem={(task) => (
                    <List.Item
                      actions={[
                        task.status === 'COMPLETE' && (
                          <Button
                            key="generate"
                            type="link"
                            size="small"
                            onClick={() => generateClonePage(task.id)}
                          >
                            生成代码
                          </Button>
                        ),
                        task.status === 'COMPLETE' && (
                          <Button
                            key="preview"
                            type="link"
                            size="small"
                            icon={<EyeOutlined />}
                            onClick={() => previewPage(task.id)}
                          >
                            预览
                          </Button>
                        ),
                        <Button
                          key="delete"
                          type="link"
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => deleteTask(task.id)}
                        >
                          删除
                        </Button>
                      ].filter(Boolean)}
                    >
                      <List.Item.Meta
                        title={
                          <Space>
                            <Text ellipsis style={{ maxWidth: 200 }}>
                              {task.url}
                            </Text>
                            <Tag color={
                              task.status === 'COMPLETE' ? 'success' :
                              task.status === 'ERROR' ? 'error' :
                              task.status === 'IN_PROGRESS' ? 'processing' : 'default'
                            }>
                              {task.status}
                            </Tag>
                          </Space>
                        }
                        description={`创建时间: ${new Date(task.createdAt).toLocaleString()}`}
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane tab="生成配置" key="config">
          <Card title="克隆配置选项">
            <Row gutter={24}>
              <Col span={12}>
                <Form layout="vertical">
                  <Form.Item label="保真度级别">
                    <Select
                      value={cloneConfig.fidelity}
                      onChange={(value) => setCloneConfig(prev => ({ ...prev, fidelity: value }))}
                    >
                      <Option value="high">高保真 - 完全还原原始设计</Option>
                      <Option value="medium">中保真 - 保留主要视觉元素</Option>
                      <Option value="low">低保真 - 基础结构和功能</Option>
                    </Select>
                  </Form.Item>

                  <Form.Item label="组件化程度">
                    <Select
                      value={cloneConfig.componentization}
                      onChange={(value) => setCloneConfig(prev => ({ ...prev, componentization: value }))}
                    >
                      <Option value="full">完全组件化 - 每个元素单独组件</Option>
                      <Option value="partial">部分组件化 - 逻辑块组件化</Option>
                      <Option value="none">整体页面 - 单一组件</Option>
                    </Select>
                  </Form.Item>

                  <Form.Item label="样式处理方式">
                    <Select
                      value={cloneConfig.styleHandling}
                      onChange={(value) => setCloneConfig(prev => ({ ...prev, styleHandling: value }))}
                    >
                      <Option value="inherit">完整继承 - 保留所有原始样式</Option>
                      <Option value="simplified">简化样式 - 简化和优化样式</Option>
                      <Option value="custom">自定义主题 - 应用设计系统</Option>
                    </Select>
                  </Form.Item>
                </Form>
              </Col>

              <Col span={12}>
                <Form layout="vertical">
                  <Form.Item label="交互功能">
                    <Select
                      value={cloneConfig.interactivity}
                      onChange={(value) => setCloneConfig(prev => ({ ...prev, interactivity: value }))}
                    >
                      <Option value="full">完整交互 - 完全功能实现</Option>
                      <Option value="basic">基础交互 - 基本用户交互</Option>
                      <Option value="static">静态展示 - 仅用于展示</Option>
                    </Select>
                  </Form.Item>

                  <Form.Item label="响应式设计">
                    <Select
                      value={cloneConfig.responsive}
                      onChange={(value) => setCloneConfig(prev => ({ ...prev, responsive: value }))}
                    >
                      <Option value="full">全响应式 - 适配所有设备</Option>
                      <Option value="desktop">桌面优先 - 主要适配桌面</Option>
                      <Option value="mobile">移动优先 - 主要适配移动端</Option>
                    </Select>
                  </Form.Item>

                  <Form.Item label="代码格式">
                    <Select
                      value={cloneConfig.format}
                      onChange={(value) => setCloneConfig(prev => ({ ...prev, format: value }))}
                    >
                      <Option value="react">React + TypeScript</Option>
                      <Option value="vue">Vue 3 + TypeScript</Option>
                      <Option value="html">原生 HTML + CSS</Option>
                    </Select>
                  </Form.Item>
                </Form>
              </Col>
            </Row>

            <Divider />

            <Alert
              message="配置说明"
              description="这些配置将影响生成的代码质量和复杂度。建议根据项目需求选择合适的配置选项。"
              type="info"
              icon={<InfoCircleOutlined />}
              showIcon
            />
          </Card>
        </TabPane>

        <TabPane tab="生成代码" key="code">
          {generatedCode ? (
            <Card
              title="生成的组件代码"
              extra={
                <Space>
                  <Button icon={<DownloadOutlined />}>
                    导出项目
                  </Button>
                  <Button icon={<EyeOutlined />}>
                    预览效果
                  </Button>
                </Space>
              }
            >
              <Tabs defaultActiveKey="0">
                {generatedCode.components.map((component: any, index: number) => (
                  <TabPane tab={component.name} key={index.toString()}>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Card title="组件代码" size="small">
                          <CodeEditor
                            value={component.code}
                            language={cloneConfig.format === 'react' ? 'typescript' : 
                                     cloneConfig.format === 'vue' ? 'vue' : 'html'}
                            readOnly
                            height={400}
                          />
                        </Card>
                      </Col>
                      <Col span={12}>
                        <Card title="样式代码" size="small">
                          <CodeEditor
                            value={component.styles}
                            language="css"
                            readOnly
                            height={400}
                          />
                        </Card>
                      </Col>
                    </Row>
                  </TabPane>
                ))}
              </Tabs>
            </Card>
          ) : (
            <Card>
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Text type="secondary">
                  请先完成页面抓取并生成代码
                </Text>
              </div>
            </Card>
          )}
        </TabPane>
      </Tabs>

      <Modal
        title="页面预览"
        visible={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        width={1200}
        footer={null}
      >
        {previewUrl && (
          <iframe
            src={previewUrl}
            style={{ width: '100%', height: '600px', border: 'none' }}
            title="页面预览"
          />
        )}
      </Modal>
    </div>
  );
};

export default BaiduClonePage;