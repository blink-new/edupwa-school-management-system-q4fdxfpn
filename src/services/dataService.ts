import { blink } from '../blink/client';
import type {
  User,
  Class,
  ClassEnrollment,
  Assignment,
  AssignmentSubmission,
  Attendance,
  LeaveRequest,
  Message,
  Resource,
  BlogPost,
  HonorRoll,
  DashboardStats
} from '../types/database';

export class DataService {
  // User operations
  static async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) {
    return await blink.db.users.create({
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...userData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  static async getUserById(id: string): Promise<User | null> {
    const users = await blink.db.users.list({ where: { id } });
    return users[0] || null;
  }

  static async getUsersByRole(role: User['role']): Promise<User[]> {
    return await blink.db.users.list({ where: { role } });
  }

  static async updateUser(id: string, updates: Partial<User>) {
    return await blink.db.users.update(id, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  }

  // Class operations
  static async createClass(classData: Omit<Class, 'id' | 'createdAt' | 'updatedAt'>) {
    return await blink.db.classes.create({
      id: `class_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...classData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  static async getClasses(): Promise<Class[]> {
    return await blink.db.classes.list({ orderBy: { createdAt: 'desc' } });
  }

  static async getClassesByTeacher(teacherId: string): Promise<Class[]> {
    return await blink.db.classes.list({ 
      where: { teacherId },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async getClassesByStudent(studentId: string): Promise<Class[]> {
    const enrollments = await blink.db.classEnrollments.list({ 
      where: { studentId } 
    });
    const classIds = enrollments.map(e => e.classId);
    if (classIds.length === 0) return [];
    
    return await blink.db.classes.list({
      where: { 
        OR: classIds.map(id => ({ id }))
      }
    });
  }

  static async updateClass(id: string, updates: Partial<Class>) {
    return await blink.db.classes.update(id, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  }

  static async deleteClass(id: string) {
    return await blink.db.classes.delete(id);
  }

  // Class enrollment operations
  static async enrollStudent(classId: string, studentId: string) {
    return await blink.db.classEnrollments.create({
      id: `enrollment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      classId,
      studentId,
      enrolledAt: new Date().toISOString()
    });
  }

  static async unenrollStudent(classId: string, studentId: string) {
    const enrollments = await blink.db.classEnrollments.list({
      where: { AND: [{ classId }, { studentId }] }
    });
    if (enrollments[0]) {
      return await blink.db.classEnrollments.delete(enrollments[0].id);
    }
  }

  static async getClassStudents(classId: string): Promise<User[]> {
    const enrollments = await blink.db.classEnrollments.list({ 
      where: { classId } 
    });
    const studentIds = enrollments.map(e => e.studentId);
    if (studentIds.length === 0) return [];
    
    return await blink.db.users.list({
      where: { 
        OR: studentIds.map(id => ({ id }))
      }
    });
  }

  // Assignment operations
  static async createAssignment(assignmentData: Omit<Assignment, 'id' | 'createdAt' | 'updatedAt'>) {
    return await blink.db.assignments.create({
      id: `assignment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...assignmentData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  static async getAssignments(): Promise<Assignment[]> {
    return await blink.db.assignments.list({ orderBy: { dueDate: 'desc' } });
  }

  static async getAssignmentsByClass(classId: string): Promise<Assignment[]> {
    return await blink.db.assignments.list({ 
      where: { classId },
      orderBy: { dueDate: 'desc' }
    });
  }

  static async getAssignmentsByTeacher(teacherId: string): Promise<Assignment[]> {
    return await blink.db.assignments.list({ 
      where: { teacherId },
      orderBy: { dueDate: 'desc' }
    });
  }

  static async updateAssignment(id: string, updates: Partial<Assignment>) {
    return await blink.db.assignments.update(id, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  }

  static async deleteAssignment(id: string) {
    return await blink.db.assignments.delete(id);
  }

  // Assignment submission operations
  static async submitAssignment(submissionData: Omit<AssignmentSubmission, 'id' | 'submittedAt'>) {
    return await blink.db.assignmentSubmissions.create({
      id: `submission_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...submissionData,
      submittedAt: new Date().toISOString()
    });
  }

  static async getSubmissionsByAssignment(assignmentId: string): Promise<AssignmentSubmission[]> {
    return await blink.db.assignmentSubmissions.list({ 
      where: { assignmentId },
      orderBy: { submittedAt: 'desc' }
    });
  }

  static async getSubmissionsByStudent(studentId: string): Promise<AssignmentSubmission[]> {
    return await blink.db.assignmentSubmissions.list({ 
      where: { studentId },
      orderBy: { submittedAt: 'desc' }
    });
  }

  static async gradeSubmission(id: string, grade: number, feedback?: string, gradedBy?: string) {
    return await blink.db.assignmentSubmissions.update(id, {
      grade,
      feedback,
      gradedBy,
      gradedAt: new Date().toISOString()
    });
  }

  // Attendance operations
  static async markAttendance(attendanceData: Omit<Attendance, 'id' | 'markedAt'>) {
    return await blink.db.attendance.create({
      id: `attendance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...attendanceData,
      markedAt: new Date().toISOString()
    });
  }

  static async getAttendanceByClass(classId: string, date?: string): Promise<Attendance[]> {
    const where = date ? { AND: [{ classId }, { date }] } : { classId };
    return await blink.db.attendance.list({ 
      where,
      orderBy: { date: 'desc' }
    });
  }

  static async getAttendanceByStudent(studentId: string): Promise<Attendance[]> {
    return await blink.db.attendance.list({ 
      where: { studentId },
      orderBy: { date: 'desc' }
    });
  }

  static async updateAttendance(id: string, updates: Partial<Attendance>) {
    return await blink.db.attendance.update(id, updates);
  }

  // Leave request operations
  static async createLeaveRequest(leaveData: Omit<LeaveRequest, 'id' | 'createdAt' | 'updatedAt'>) {
    return await blink.db.leaveRequests.create({
      id: `leave_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...leaveData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  static async getLeaveRequests(): Promise<LeaveRequest[]> {
    return await blink.db.leaveRequests.list({ orderBy: { createdAt: 'desc' } });
  }

  static async getLeaveRequestsByUser(userId: string): Promise<LeaveRequest[]> {
    return await blink.db.leaveRequests.list({ 
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async updateLeaveRequest(id: string, updates: Partial<LeaveRequest>) {
    return await blink.db.leaveRequests.update(id, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  }

  // Message operations
  static async sendMessage(messageData: Omit<Message, 'id' | 'createdAt'>) {
    return await blink.db.messages.create({
      id: `message_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...messageData,
      createdAt: new Date().toISOString()
    });
  }

  static async getMessages(recipientType?: string, recipientId?: string): Promise<Message[]> {
    const where = recipientType && recipientId 
      ? { AND: [{ recipientType }, { recipientId }] }
      : recipientType 
      ? { recipientType }
      : {};
    
    return await blink.db.messages.list({ 
      where,
      orderBy: { createdAt: 'desc' }
    });
  }

  static async getStaffMessages(): Promise<Message[]> {
    return await blink.db.messages.list({ 
      where: { recipientType: 'staff' },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async getClassMessages(classId: string): Promise<Message[]> {
    return await blink.db.messages.list({ 
      where: { AND: [{ recipientType: 'class' }, { recipientId: classId }] },
      orderBy: { createdAt: 'desc' }
    });
  }

  // Resource operations
  static async uploadResource(resourceData: Omit<Resource, 'id' | 'createdAt'>) {
    return await blink.db.resources.create({
      id: `resource_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...resourceData,
      createdAt: new Date().toISOString()
    });
  }

  static async getResources(classId?: string): Promise<Resource[]> {
    const where = classId ? { classId } : {};
    return await blink.db.resources.list({ 
      where,
      orderBy: { createdAt: 'desc' }
    });
  }

  static async deleteResource(id: string) {
    return await blink.db.resources.delete(id);
  }

  // Blog post operations
  static async createBlogPost(postData: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'>) {
    return await blink.db.blogPosts.create({
      id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...postData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  static async getBlogPosts(published?: boolean): Promise<BlogPost[]> {
    const where = published !== undefined ? { published: published ? "1" : "0" } : {};
    return await blink.db.blogPosts.list({ 
      where,
      orderBy: { createdAt: 'desc' }
    });
  }

  static async updateBlogPost(id: string, updates: Partial<BlogPost>) {
    return await blink.db.blogPosts.update(id, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  }

  static async deleteBlogPost(id: string) {
    return await blink.db.blogPosts.delete(id);
  }

  // Honor roll operations
  static async addToHonorRoll(honorData: Omit<HonorRoll, 'id' | 'createdAt'>) {
    return await blink.db.honorRoll.create({
      id: `honor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...honorData,
      createdAt: new Date().toISOString()
    });
  }

  static async getHonorRoll(semester?: string, year?: number): Promise<HonorRoll[]> {
    const where = semester && year 
      ? { AND: [{ semester }, { year }] }
      : semester 
      ? { semester }
      : year 
      ? { year }
      : {};
    
    return await blink.db.honorRoll.list({ 
      where,
      orderBy: { createdAt: 'desc' }
    });
  }

  // Dashboard statistics
  static async getDashboardStats(): Promise<DashboardStats> {
    const [students, teachers, classes, assignments, submissions, leaveRequests, messages, attendance] = await Promise.all([
      blink.db.users.list({ where: { role: 'student' } }),
      blink.db.users.list({ where: { role: 'teacher' } }),
      blink.db.classes.list(),
      blink.db.assignments.list(),
      blink.db.assignmentSubmissions.list({ where: { grade: null } }),
      blink.db.leaveRequests.list({ where: { status: 'pending' } }),
      blink.db.messages.list({ limit: 10 }),
      blink.db.attendance.list({ where: { status: 'present' } })
    ]);

    const totalAttendance = await blink.db.attendance.list();
    const attendanceRate = totalAttendance.length > 0 
      ? (attendance.length / totalAttendance.length) * 100 
      : 0;

    return {
      totalStudents: students.length,
      totalTeachers: teachers.length,
      totalClasses: classes.length,
      totalAssignments: assignments.length,
      pendingSubmissions: submissions.length,
      pendingLeaveRequests: leaveRequests.length,
      recentMessages: messages.length,
      attendanceRate: Math.round(attendanceRate)
    };
  }
}