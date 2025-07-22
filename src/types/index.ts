export * from './user'

export interface Class {
  id: string
  name: string
  subject: string
  grade: string
  teacherId: string
  teacherName: string
  studentCount: number
  schedule: string
  createdAt: string
  updatedAt: string
}

export interface Assignment {
  id: string
  title: string
  description: string
  classId: string
  className: string
  teacherId: string
  dueDate: string
  status: 'draft' | 'published' | 'closed'
  submissionCount: number
  totalStudents: number
  createdAt: string
  updatedAt: string
}

export interface Attendance {
  id: string
  classId: string
  studentId: string
  date: string
  status: 'present' | 'absent' | 'late' | 'excused'
  notes?: string
  markedBy: string
  createdAt: string
}

export interface LeaveRequest {
  id: string
  userId: string
  userName: string
  userRole: string
  startDate: string
  endDate: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  approvedBy?: string
  approvedAt?: string
  createdAt: string
}

export interface Message {
  id: string
  senderId: string
  senderName: string
  recipientType: 'class' | 'staff' | 'individual'
  recipientId: string
  subject: string
  content: string
  isRead: boolean
  createdAt: string
}

export interface BlogPost {
  id: string
  title: string
  content: string
  category: 'news' | 'events' | 'academics' | 'announcements'
  authorId: string
  authorName: string
  isPublished: boolean
  publishedAt?: string
  createdAt: string
  updatedAt: string
}

export interface HonorRoll {
  id: string
  studentId: string
  studentName: string
  grade: string
  category: 'principals_list' | 'high_honor' | 'honor_list'
  gpa: number
  semester: string
  year: string
  photo?: string
  createdAt: string
}