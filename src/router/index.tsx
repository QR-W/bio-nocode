import { createBrowserRouter, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { Spin } from 'antd'
import AuthGuard from '../components/AuthGuard'
import RouteErrorBoundary from '../components/RouteErrorBoundary'

const HomePage = lazy(() => import('../pages/HomePage'))
const AppBuilderPage = lazy(() => import('../pages/AppBuilderPage'))
const AppRunnerPage = lazy(() => import('../pages/AppRunnerPage'))
const SettingsPage = lazy(() => import('../pages/SettingsPage'))
const AuthPage = lazy(() => import('../pages/AuthPage'))

function PageLoader() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
    }}>
      <Spin size="large" />
    </div>
  )
}

function withSuspense(element: React.ReactNode) {
  return <Suspense fallback={<PageLoader />}>{element}</Suspense>
}

function withGuard(element: React.ReactNode) {
  return withSuspense(<AuthGuard>{element}</AuthGuard>)
}

/** 捕获子树渲染错误，避免白屏；不清理 Zustand 中的构建器状态 */
function withGuardAndErrorBoundary(
  element: React.ReactNode,
  errorTitle?: string,
) {
  return withSuspense(
    <AuthGuard>
      <RouteErrorBoundary title={errorTitle}>{element}</RouteErrorBoundary>
    </AuthGuard>,
  )
}

export const router = createBrowserRouter([
  {
    path: '/auth',
    element: withSuspense(<AuthPage />),
  },
  {
    path: '/',
    element: withGuard(<HomePage />),
  },
  {
    path: '/builder',
    element: withGuardAndErrorBoundary(<AppBuilderPage />, '应用构建器'),
  },
  {
    path: '/builder/:appId',
    element: withGuardAndErrorBoundary(<AppBuilderPage />, '应用构建器'),
  },
  {
    path: '/app/:appId',
    element: withGuardAndErrorBoundary(<AppRunnerPage />, '应用运行'),
  },
  {
    path: '/settings',
    element: withGuard(<SettingsPage />),
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
])