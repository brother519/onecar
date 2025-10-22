/**
 * Vite 配置文件
 * 配置开发服务器和构建选项
 */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()], // 启用 React 插件支持
  server: {
    port: 3000,  // 开发服务器端口
    open: true   // 启动时自动打开浏览器
  }
})