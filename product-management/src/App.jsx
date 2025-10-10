import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import MainLayout from './components/Layout/MainLayout'
import ProductListPage from './pages/ProductListPage'
import ProductEditPage from './pages/ProductEditPage'
import ProductCodePage from './pages/ProductCodePage'
import BatchOperationPage from './pages/BatchOperationPage'
import Watermark from './components/Watermark/Watermark'

function App() {
  return (
    <div className="app">
      <DndProvider backend={HTML5Backend}>
        <Watermark text="商品管理系统" fontSize={16} color="rgba(0,0,0,0.1)">
          <Router>
            <MainLayout>
              <Routes>
                <Route path="/" element={<Navigate to="/products" replace />} />
                <Route path="/products" element={<ProductListPage />} />
                <Route path="/products/add" element={<ProductEditPage />} />
                <Route path="/products/:id/edit" element={<ProductEditPage />} />
                <Route path="/products/:id/code" element={<ProductCodePage />} />
                <Route path="/products/batch" element={<BatchOperationPage />} />
                <Route path="*" element={<Navigate to="/products" replace />} />
              </Routes>
            </MainLayout>
          </Router>
        </Watermark>
      </DndProvider>
    </div>
  )
}

export default App