import React from 'react'
import { GraduationCap, Users, BookOpen, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/useAuth'

export const Login: React.FC = () => {
  const { login } = useAuth()

  const features = [
    {
      icon: Users,
      title: 'Role-Based Access',
      description: 'Secure access for admins, teachers, students, and staff'
    },
    {
      icon: BookOpen,
      title: 'Complete Academic Management',
      description: 'Classes, assignments, grades, and attendance tracking'
    },
    {
      icon: Shield,
      title: 'Offline-First PWA',
      description: 'Works offline and installs on mobile devices'
    }
  ]

  const roles = [
    { name: 'Admin', color: 'bg-red-100 text-red-800', description: 'Full system access' },
    { name: 'Teacher', color: 'bg-blue-100 text-blue-800', description: 'Manage classes & students' },
    { name: 'Student', color: 'bg-green-100 text-green-800', description: 'View grades & submit work' },
    { name: 'Staff', color: 'bg-purple-100 text-purple-800', description: 'Internal messaging & leave' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left side - Branding and Features */}
        <div className="space-y-8">
          {/* Logo and Title */}
          <div className="text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start space-x-3 mb-4">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                <GraduationCap className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">EduPWA</h1>
                <p className="text-sm text-gray-600">School Management System</p>
              </div>
            </div>
            <p className="text-lg text-gray-600 max-w-md mx-auto lg:mx-0">
              A comprehensive Progressive Web App designed to digitize and streamline school operations for educational institutions.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 text-center lg:text-left">
              Key Features
            </h2>
            <div className="grid gap-4">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start space-x-3 p-4 bg-white rounded-lg shadow-sm border">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <feature.icon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{feature.title}</h3>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Supported Roles */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 text-center lg:text-left">
              Supported Roles
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {roles.map((role, index) => (
                <div key={index} className="p-3 bg-white rounded-lg shadow-sm border">
                  <Badge className={`${role.color} mb-2`}>
                    {role.name}
                  </Badge>
                  <p className="text-xs text-gray-600">{role.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right side - Login Card */}
        <div className="flex justify-center">
          <Card className="w-full max-w-md shadow-xl border-0">
            <CardHeader className="text-center space-y-4">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto">
                <GraduationCap className="h-8 w-8 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">Welcome to EduPWA</CardTitle>
                <CardDescription className="text-base">
                  Sign in to access your school management dashboard
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-medium text-blue-900 mb-2">Demo Access Available</h3>
                  <p className="text-sm text-blue-700">
                    Click "Sign In" to access the system with demo data. 
                    Your role will be automatically assigned based on your account.
                  </p>
                </div>

                <Button 
                  onClick={login}
                  className="w-full h-12 text-base font-medium bg-blue-600 hover:bg-blue-700"
                  size="lg"
                >
                  Sign In to EduPWA
                </Button>
              </div>

              <div className="text-center space-y-2">
                <p className="text-xs text-gray-500">
                  Secure authentication powered by Blink
                </p>
                <div className="flex items-center justify-center space-x-4 text-xs text-gray-400">
                  <span>✓ Offline Support</span>
                  <span>✓ Mobile Ready</span>
                  <span>✓ PWA Enabled</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}