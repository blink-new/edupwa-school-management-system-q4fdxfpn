import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  BookOpen,
  ClipboardCheck,
  FileText,
  MessageSquare,
  FolderOpen,
  Calendar,
  Trophy,
  Settings,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles: string[]
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['admin', 'teacher', 'student', 'staff']
  },
  {
    title: 'Classes',
    href: '/classes',
    icon: BookOpen,
    roles: ['admin', 'teacher', 'student']
  },
  {
    title: 'Students',
    href: '/students',
    icon: Users,
    roles: ['admin', 'teacher']
  },
  {
    title: 'Attendance',
    href: '/attendance',
    icon: ClipboardCheck,
    roles: ['admin', 'teacher', 'student']
  },
  {
    title: 'Assignments',
    href: '/assignments',
    icon: FileText,
    roles: ['admin', 'teacher', 'student']
  },
  {
    title: 'Grades',
    href: '/grades',
    icon: Trophy,
    roles: ['admin', 'teacher', 'student']
  },
  {
    title: 'Messages',
    href: '/messages',
    icon: MessageSquare,
    roles: ['admin', 'teacher', 'student', 'staff']
  },
  {
    title: 'Resources',
    href: '/resources',
    icon: FolderOpen,
    roles: ['admin', 'teacher', 'student']
  },
  {
    title: 'Leave Requests',
    href: '/leave-requests',
    icon: Calendar,
    roles: ['admin', 'teacher', 'student', 'staff']
  },
  {
    title: 'Blog & News',
    href: '/blog',
    icon: FileText,
    roles: ['admin', 'teacher', 'student', 'staff']
  },
  {
    title: 'Honor Roll',
    href: '/honor-roll',
    icon: Trophy,
    roles: ['admin', 'teacher', 'student', 'staff']
  }
]

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth()

  const filteredNavItems = navItems.filter(item => 
    user?.role && item.roles.includes(user.role)
  )

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden" 
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 z-50 h-full w-64 bg-white border-r transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:z-auto",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-16 items-center justify-between px-4 border-b">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">E</span>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">EduPWA</h2>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-3 py-4">
            <nav className="space-y-1">
              {filteredNavItems.map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )
                  }
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.title}</span>
                </NavLink>
              ))}
            </nav>

            <Separator className="my-4" />

            {/* Settings */}
            <nav className="space-y-1">
              <NavLink
                to="/settings"
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )
                }
              >
                <Settings className="h-5 w-5" />
                <span>Settings</span>
              </NavLink>
            </nav>
          </ScrollArea>

          {/* Footer */}
          <div className="p-4 border-t">
            <div className="text-xs text-gray-500 text-center">
              <p>EduPWA v1.0</p>
              <p>School Management System</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}