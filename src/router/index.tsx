import { createBrowserRouter, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { Spin } from 'antd'
import AuthGuard from '../components/AuthGuard'

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
    element: withGuard(<AppBuilderPage />),
  },
  {
    path: '/builder/:appId',
    element: withGuard(<AppBuilderPage />),
  },
  {
    path: '/app/:appId',
    element: withGuard(<AppRunnerPage />),
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