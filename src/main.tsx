/**
 * Tom cat
 * 
 * Task Management System - Application Entry File
 * 
 * Features:
 * - Initialize React application instance
 * - Configure strict mode to detect potential issues
 * - Mount root component to DOM node
 * - Import global styles
 * 
 * Tech Stack:
 * - React 18
 * - TypeScript
 * - Vite build tool
 * 
 * @module main
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';

/**
 * Create React root instance and render application
 * 
 * Execution flow:
 * 1. Get DOM element with id 'root'
 * 2. Create React 18 root instance using createRoot
 * 3. Render App component under StrictMode
 * 
 * StrictMode functions:
 * - Identify unsafe lifecycles
 * - Detect usage of deprecated APIs
 * - Detect unexpected side effects
 * - Ensure reusable state
 */
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);