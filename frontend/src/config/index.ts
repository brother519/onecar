// 环境配置管理
interface AppConfig {
  apiBaseUrl: string;
  apiTimeout: number;
  appTitle: string;
  appVersion: string;
  appDescription: string;
  enableMock: boolean;
  enableDebug: boolean;
  enableDevTools: boolean;
  uploadMaxSize: number;
  uploadAllowedTypes: string[];
  defaultPageSize: number;
  maxPageSize: number;
  defaultTheme: string;
  primaryColor: string;
}

class ConfigManager {
  private config: AppConfig;

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): AppConfig {
    return {
      apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
      apiTimeout: parseInt(import.meta.env.VITE_API_TIMEOUT) || 10000,
      appTitle: import.meta.env.VITE_APP_TITLE || 'OneCar 商品管理系统',
      appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
      appDescription: import.meta.env.VITE_APP_DESCRIPTION || 'OneCar 汽车商品后台管理系统',
      enableMock: import.meta.env.VITE_ENABLE_MOCK === 'true',
      enableDebug: import.meta.env.VITE_ENABLE_DEBUG === 'true',
      enableDevTools: import.meta.env.VITE_ENABLE_DEV_TOOLS === 'true',
      uploadMaxSize: parseInt(import.meta.env.VITE_UPLOAD_MAX_SIZE) || 10485760,
      uploadAllowedTypes: (import.meta.env.VITE_UPLOAD_ALLOWED_TYPES || 'image/jpeg,image/png').split(','),
      defaultPageSize: parseInt(import.meta.env.VITE_DEFAULT_PAGE_SIZE) || 20,
      maxPageSize: parseInt(import.meta.env.VITE_MAX_PAGE_SIZE) || 100,
      defaultTheme: import.meta.env.VITE_DEFAULT_THEME || 'light',
      primaryColor: import.meta.env.VITE_PRIMARY_COLOR || '#1677ff',
    };
  }

  get<K extends keyof AppConfig>(key: K): AppConfig[K] {
    return this.config[key];
  }

  getAll(): AppConfig {
    return { ...this.config };
  }

  isDevelopment(): boolean {
    return import.meta.env.MODE === 'development';
  }

  isProduction(): boolean {
    return import.meta.env.MODE === 'production';
  }

  // 调试信息
  logConfig(): void {
    if (this.config.enableDebug) {
      console.group('🔧 应用配置信息');
      console.log('环境模式:', import.meta.env.MODE);
      console.log('应用版本:', this.config.appVersion);
      console.log('API 地址:', this.config.apiBaseUrl);
      console.log('调试模式:', this.config.enableDebug);
      console.log('完整配置:', this.config);
      console.groupEnd();
    }
  }
}

// 创建全局配置实例
export const config = new ConfigManager();

// 导出配置类型
export type { AppConfig };
export default config;