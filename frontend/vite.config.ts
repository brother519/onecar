import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';
  
  return {
    plugins: [react()],
    
    // 开发服务器配置
    server: {
      port: 3000,
      host: true,
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
        },
        '/uploads': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    
    // 路径别名
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    
    // 构建配置
    build: {
      target: 'es2015',
      outDir: 'dist',
      sourcemap: !isProduction,
      minify: isProduction ? 'terser' : false,
      
      // 资源内联限制
      assetsInlineLimit: 4096,
      
      // Rollup 构建配置
      rollupOptions: {
        output: {
          // 静态资源分类
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name?.split('.') || [];
            const ext = info[info.length - 1];
            
            if (/\.(mp4|webm|ogg|mp3|wav|flac|aac)$/.test(assetInfo.name || '')) {
              return 'assets/media/[name]-[hash].[ext]';
            }
            
            if (/\.(png|jpe?g|gif|svg|ico|webp)$/.test(assetInfo.name || '')) {
              return 'assets/images/[name]-[hash].[ext]';
            }
            
            if (/\.(woff2?|eot|ttf|otf)$/.test(assetInfo.name || '')) {
              return 'assets/fonts/[name]-[hash].[ext]';
            }
            
            return `assets/${ext}/[name]-[hash].[ext]`;
          },
          
          // 手动分割代码
          manualChunks: {
            // React 相关
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            
            // UI 组件库
            'antd-vendor': ['antd'],
            
            // 状态管理
            'state-vendor': ['zustand'],
            
            // 工具库
            'utility-vendor': ['axios'],
          },
        },
      },
      
      // Terser 压缩配置
      terserOptions: isProduction ? {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.info'],
        },
        mangle: {
          safari10: true,
        },
      } : {},
    },
    
    // CSS 配置
    css: {
      modules: {
        localsConvention: 'camelCase',
      },
    },
    
    // 优化配置
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        'antd',
        'zustand',
        'axios',
      ],
    },
    
    // 环境变量配置
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    },
  };
});