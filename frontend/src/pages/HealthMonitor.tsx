import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Badge, Button, Table, Progress, Typography, Space, Alert } from 'antd';
import { ReloadOutlined, CheckCircleOutlined, ExclamationCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { frontendMonitor } from '../utils/monitor';
import type { HealthStatus } from '../utils/monitor';

const { Title, Text } = Typography;

interface HealthCheckResult {
  timestamp: string;
  overall: {
    healthy: boolean;
    issues: string[];
  };
  checks: {
    backend: HealthStatus;
    browser: HealthStatus;
  };
  stats: {
    system: any;
    app: any;
  };
}

const HealthMonitorPage: React.FC = () => {
  const [healthData, setHealthData] = useState<HealthCheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // 执行健康检查
  const performHealthCheck = async () => {
    setLoading(true);
    try {
      const result = await frontendMonitor.performHealthCheck();
      setHealthData(result);
    } catch (error) {
      console.error('健康检查失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 自动刷新
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (autoRefresh) {
      interval = setInterval(performHealthCheck, 10000); // 每10秒刷新
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [autoRefresh]);

  // 组件挂载时执行检查
  useEffect(() => {
    performHealthCheck();
  }, []);

  // 获取状态图标
  const getStatusIcon = (healthy: boolean) => {
    return healthy ? (
      <CheckCircleOutlined style={{ color: '#52c41a' }} />
    ) : (
      <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
    );
  };

  // 获取状态徽章
  const getStatusBadge = (healthy: boolean) => {
    return (
      <Badge 
        status={healthy ? 'success' : 'error'} 
        text={healthy ? '正常' : '异常'} 
      />
    );
  };

  if (!healthData) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Button type="primary" loading={loading} onClick={performHealthCheck}>
          执行健康检查
        </Button>
      </div>
    );
  }

  const { overall, checks, stats } = healthData;

  return (
    <div style={{ padding: 24 }}>
      <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2} style={{ margin: 0 }}>
            系统健康监控
          </Title>
        </Col>
        <Col>
          <Space>
            <Button 
              icon={<ReloadOutlined />} 
              loading={loading} 
              onClick={performHealthCheck}
            >
              刷新
            </Button>
            <Button 
              type={autoRefresh ? 'primary' : 'default'}
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              {autoRefresh ? '停止自动刷新' : '开启自动刷新'}
            </Button>
          </Space>
        </Col>
      </Row>

      {/* 总体状态 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Alert
            message={
              <Space>
                {getStatusIcon(overall.healthy)}
                <Text strong>
                  系统状态: {overall.healthy ? '健康' : '异常'}
                </Text>
              </Space>
            }
            description={
              overall.issues.length > 0 ? (
                <div>
                  发现以下问题：
                  <ul>
                    {overall.issues.map((issue, index) => (
                      <li key={index}>{issue}</li>
                    ))}
                  </ul>
                </div>
              ) : '所有系统组件运行正常'
            }
            type={overall.healthy ? 'success' : 'error'}
            showIcon
          />
        </Col>
      </Row>

      {/* 服务状态 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12}>
          <Card title="后端服务" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>状态:</Text>
                {getStatusBadge(checks.backend.healthy)}
              </div>
              <div>
                <Text type="secondary">消息:</Text>
                <div>{checks.backend.message}</div>
              </div>
              {checks.backend.details && (
                <div>
                  <Text type="secondary">详情:</Text>
                  <pre style={{ fontSize: '12px', background: '#f5f5f5', padding: '8px', borderRadius: '4px' }}>
                    {JSON.stringify(checks.backend.details, null, 2)}
                  </pre>
                </div>
              )}
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card title="浏览器兼容性" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>状态:</Text>
                {getStatusBadge(checks.browser.healthy)}
              </div>
              <div>
                <Text type="secondary">消息:</Text>
                <div>{checks.browser.message}</div>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* 系统统计 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="应用统计" size="small">
            <Row gutter={16}>
              <Col span={12}>
                <Statistic 
                  title="运行时间" 
                  value={Math.round(stats.app.uptime / 1000 / 60)} 
                  suffix="分钟" 
                />
              </Col>
              <Col span={12}>
                <Statistic 
                  title="错误数量" 
                  value={stats.app.errorCount} 
                />
              </Col>
              <Col span={12}>
                <Statistic 
                  title="API 调用" 
                  value={stats.app.apiCallCount} 
                />
              </Col>
              <Col span={12}>
                <Statistic 
                  title="成功率" 
                  value={stats.app.apiSuccessRate} 
                  suffix="%" 
                  precision={1}
                />
              </Col>
            </Row>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="系统资源" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text>内存使用:</Text>
                  <Text>{stats.system.memory.percentage.toFixed(1)}%</Text>
                </div>
                <Progress 
                  percent={stats.system.memory.percentage} 
                  status={stats.system.memory.percentage > 80 ? 'exception' : 'normal'}
                  size="small"
                />
              </div>
              <div>
                <Text type="secondary">已使用: </Text>
                <Text>{(stats.system.memory.used / 1024 / 1024).toFixed(1)} MB</Text>
              </div>
              <div>
                <Text type="secondary">总内存: </Text>
                <Text>{(stats.system.memory.total / 1024 / 1024).toFixed(1)} MB</Text>
              </div>
              {stats.system.connection && (
                <div>
                  <Text type="secondary">网络类型: </Text>
                  <Text>{stats.system.connection.effectiveType}</Text>
                </div>
              )}
            </Space>
          </Card>
        </Col>
      </Row>

      {/* 性能指标 */}
      {stats.system.performance.navigation && (
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Card title="页面性能" size="small">
              <Row gutter={16}>
                <Col xs={24} sm={8}>
                  <Statistic 
                    title="页面加载时间" 
                    value={stats.system.performance.navigation.loadEventEnd - stats.system.performance.navigation.navigationStart} 
                    suffix="ms" 
                  />
                </Col>
                <Col xs={24} sm={8}>
                  <Statistic 
                    title="DOM 就绪时间" 
                    value={stats.system.performance.navigation.domContentLoadedEventEnd - stats.system.performance.navigation.navigationStart} 
                    suffix="ms" 
                  />
                </Col>
                <Col xs={24} sm={8}>
                  <Statistic 
                    title="首字节时间" 
                    value={stats.system.performance.navigation.responseStart - stats.system.performance.navigation.navigationStart} 
                    suffix="ms" 
                  />
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      )}

      <div style={{ marginTop: 16, textAlign: 'center', color: '#666' }}>
        <Text type="secondary">
          最后更新: {new Date(healthData.timestamp).toLocaleString()}
        </Text>
      </div>
    </div>
  );
};

export default HealthMonitorPage;