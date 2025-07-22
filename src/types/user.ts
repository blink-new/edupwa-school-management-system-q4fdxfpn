export interface User {
  id: string
  email: string
  displayName: string
  role: 'admin' | 'teacher' | 'student' | 'staff'
  avatar?: string
  createdAt: string
  updatedAt: string
}

export interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  tokens?: {
    accessToken: string
    refreshToken: string
  }
}