export interface User {
  id: string;
  email: string;
  displayName: string;
  role: 'admin' | 'teacher' | 'student' | 'staff';
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Class {
  id: string;
  name: string;
  subject: string;
  gradeLevel: string;
  teacherId: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  teacher?: User;
  studentCount?: number;
}

export interface ClassEnrollment {
  id: string;
  classId: string;
  studentId: string;
  enrolledAt: string;
  student?: User;
  class?: Class;
}

export interface Assignment {
  id: string;
  title: string;
  description?: string;
  classId: string;
  teacherId: string;
  dueDate: string;
  maxPoints: number;
  createdAt: string;
  updatedAt: string;
  class?: Class;
  teacher?: User;
  submissionCount?: number;
  gradedCount?: number;
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  submissionUrl?: string;
  submissionText?: string;
  submittedAt: string;
  grade?: number;
  feedback?: string;
  gradedAt?: string;
  gradedBy?: string;
  assignment?: Assignment;
  student?: User;
  grader?: User;
}

export interface Attendance {
  id: string;
  classId: string;
  studentId: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes?: string;
  markedBy: string;
  markedAt: string;
  class?: Class;
  student?: User;
  marker?: User;
}

export interface LeaveRequest {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
  user?: User;
  approver?: User;
}

export interface Message {
  id: string;
  senderId: string;
  recipientType: 'class' | 'staff' | 'individual';
  recipientId?: string;
  subject: string;
  content: string;
  createdAt: string;
  sender?: User;
  class?: Class;
  recipient?: User;
}

export interface Resource {
  id: string;
  title: string;
  description?: string;
  fileUrl: string;
  fileType: string;
  classId?: string;
  uploadedBy: string;
  createdAt: string;
  class?: Class;
  uploader?: User;
}

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  category: 'events' | 'news' | 'academics' | 'announcements';
  authorId: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
  author?: User;
}

export interface HonorRoll {
  id: string;
  studentId: string;
  semester: string;
  year: number;
  honorType: 'principals_list' | 'high_honor' | 'honor_list';
  gpa?: number;
  createdAt: string;
  student?: User;
}

export interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  totalAssignments: number;
  pendingSubmissions: number;
  pendingLeaveRequests: number;
  recentMessages: number;
  attendanceRate: number;
}