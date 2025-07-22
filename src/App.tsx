import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthProvider'
import { useAuth } from '@/hooks/useAuth'
import { Layout } from '@/components/layout/Layout'
import { Login } from '@/pages/Login'
import { Dashboard } from '@/pages/Dashboard'
import { Classes } from '@/pages/Classes'
import { Assignments } from '@/pages/Assignments'
import AttendancePage from '@/pages/Attendance'
import Messages from '@/pages/Messages'
import LeaveRequests from '@/pages/LeaveRequests'
import { Toaster } from '@/components/ui/toaster'

// Loading component
const LoadingScreen: React.FC = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
        <span className="text-white font-bold text-xl">E</span>
      </div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading EduPWA...</h2>
      <p className="text-gray-600">Please wait while we set up your dashboard</p>
    </div>
  </div>
)

// Protected route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <LoadingScreen />
  }

  if (!isAuthenticated) {
    return <Login />
  }

  return <>{children}</>
}

// Main app content
const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <LoadingScreen />
  }

  if (!isAuthenticated) {
    return <Login />
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/classes" element={<Classes />} />
        <Route path="/assignments" element={<Assignments />} />
        
        {/* Placeholder routes - will be implemented later */}
        <Route path="/students" element={<div className="p-8 text-center"><h1 className="text-2xl font-bold">Students Page</h1><p className="text-gray-600 mt-2">Coming soon...</p></div>} />
        <Route path="/attendance" element={<AttendancePage />} />
        <Route path="/grades" element={<div className="p-8 text-center"><h1 className="text-2xl font-bold">Grades Page</h1><p className="text-gray-600 mt-2">Coming soon...</p></div>} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/resources" element={<div className="p-8 text-center"><h1 className="text-2xl font-bold">Resources Page</h1><p className="text-gray-600 mt-2">Coming soon...</p></div>} />
        <Route path="/leave-requests" element={<LeaveRequests />} />
        <Route path="/blog" element={<div className="p-8 text-center"><h1 className="text-2xl font-bold">Blog & News Page</h1><p className="text-gray-600 mt-2">Coming soon...</p></div>} />
        <Route path="/honor-roll" element={<div className="p-8 text-center"><h1 className="text-2xl font-bold">Honor Roll Page</h1><p className="text-gray-600 mt-2">Coming soon...</p></div>} />
        <Route path="/settings" element={<div className="p-8 text-center"><h1 className="text-2xl font-bold">Settings Page</h1><p className="text-gray-600 mt-2">Coming soon...</p></div>} />
        
        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  )
}

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
        <Toaster />
      </Router>
    </AuthProvider>
  )
}

export default App