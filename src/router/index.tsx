import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { AuthLayout } from '@/components/layout/AuthLayout'

// Pages
import { DashboardPage } from '@/pages/Dashboard'
import { LoginPage } from '@/pages/Login'

// 라우터 설정
export const router = createBrowserRouter([
  {
    path: '/login',
    element: <AuthLayout />,
    children: [
      {
        index: true,
        element: <LoginPage />,
      },
    ],
  },
  {
    path: '/',
    element: <AdminLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      // 추가 라우트들은 여기에 정의
      // {
      //   path: 'vendors',
      //   element: <VendorsPage />,
      // },
      // {
      //   path: 'products',
      //   element: <ProductsPage />,
      // },
    ],
  },
])
