import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  BookOpen, 
  ClipboardList, 
  MessageSquare, 
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Award
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { DataService } from '@/services/dataService';
import type { DashboardStats, Assignment, LeaveRequest, Message, Class } from '@/types/database';

export function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentAssignments, setRecentAssignments] = useState<Assignment[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState<LeaveRequest[]>([]);
  const [recentMessages, setRecentMessages] = useState<Message[]>([]);
  const [userClasses, setUserClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        
        // Load dashboard stats
        const dashboardStats = await DataService.getDashboardStats();
        setStats(dashboardStats);

        // Load user-specific data based on role
        if (user.role === 'admin') {
          const [assignments, leaves, messages] = await Promise.all([
            DataService.getAssignments(),
            DataService.getLeaveRequests(),
            DataService.getMessages()
          ]);
          setRecentAssignments(assignments.slice(0, 5));
          setPendingLeaves(leaves.filter(l => l.status === 'pending').slice(0, 5));
          setRecentMessages(messages.slice(0, 5));
        } else if (user.role === 'teacher') {
          const [assignments, classes, messages] = await Promise.all([
            DataService.getAssignmentsByTeacher(user.id),
            DataService.getClassesByTeacher(user.id),
            DataService.getStaffMessages()
          ]);
          setRecentAssignments(assignments.slice(0, 5));
          setUserClasses(classes);
          setRecentMessages(messages.slice(0, 5));
        } else if (user.role === 'student') {
          const [classes, submissions, messages] = await Promise.all([
            DataService.getClassesByStudent(user.id),
            DataService.getSubmissionsByStudent(user.id),
            DataService.getMessages('class')
          ]);
          setUserClasses(classes);
          setRecentMessages(messages.slice(0, 5));
          
          // Get assignments for student's classes
          const classIds = classes.map(c => c.id);
          const allAssignments = await Promise.all(
            classIds.map(id => DataService.getAssignmentsByClass(id))
          );
          const flatAssignments = allAssignments.flat().slice(0, 5);
          setRecentAssignments(flatAssignments);
        } else if (user.role === 'staff') {
          const [leaves, messages] = await Promise.all([
            DataService.getLeaveRequestsByUser(user.id),
            DataService.getStaffMessages()
          ]);
          setPendingLeaves(leaves.slice(0, 5));
          setRecentMessages(messages.slice(0, 5));
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getRoleSpecificStats = () => {
    if (!stats) return [];

    switch (user?.role) {
      case 'admin':
        return [
          { title: 'Total Students', value: stats.totalStudents, icon: Users, color: 'text-blue-600' },
          { title: 'Total Teachers', value: stats.totalTeachers, icon: Users, color: 'text-green-600' },
          { title: 'Total Classes', value: stats.totalClasses, icon: BookOpen, color: 'text-purple-600' },
          { title: 'Pending Leaves', value: stats.pendingLeaveRequests, icon: Clock, color: 'text-orange-600' }
        ];
      case 'teacher':
        return [
          { title: 'My Classes', value: userClasses.length, icon: BookOpen, color: 'text-blue-600' },
          { title: 'My Assignments', value: recentAssignments.length, icon: ClipboardList, color: 'text-green-600' },
          { title: 'Pending Grading', value: stats.pendingSubmissions, icon: FileText, color: 'text-orange-600' },
          { title: 'Messages', value: recentMessages.length, icon: MessageSquare, color: 'text-purple-600' }
        ];
      case 'student':
        return [
          { title: 'My Classes', value: userClasses.length, icon: BookOpen, color: 'text-blue-600' },
          { title: 'Assignments', value: recentAssignments.length, icon: ClipboardList, color: 'text-green-600' },
          { title: 'Attendance Rate', value: `${stats.attendanceRate}%`, icon: CheckCircle, color: 'text-green-600' },
          { title: 'Messages', value: recentMessages.length, icon: MessageSquare, color: 'text-purple-600' }
        ];
      case 'staff':
        return [
          { title: 'My Leave Requests', value: pendingLeaves.length, icon: Calendar, color: 'text-blue-600' },
          { title: 'Staff Messages', value: recentMessages.length, icon: MessageSquare, color: 'text-green-600' },
          { title: 'Total Students', value: stats.totalStudents, icon: Users, color: 'text-purple-600' },
          { title: 'Total Classes', value: stats.totalClasses, icon: BookOpen, color: 'text-orange-600' }
        ];
      default:
        return [];
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          {getGreeting()}, {user?.displayName}!
        </h1>
        <p className="text-blue-100">
          Welcome to your {user?.role} dashboard. Here's what's happening today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {getRoleSpecificStats().map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Assignments */}
        {(user?.role === 'admin' || user?.role === 'teacher' || user?.role === 'student') && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                {user?.role === 'student' ? 'My Assignments' : 'Recent Assignments'}
              </CardTitle>
              <CardDescription>
                {user?.role === 'student' 
                  ? 'Assignments from your classes'
                  : 'Latest assignments created'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentAssignments.length > 0 ? (
                <div className="space-y-3">
                  {recentAssignments.map((assignment) => (
                    <div key={assignment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium">{assignment.title}</h4>
                        <p className="text-sm text-gray-600">
                          Due: {formatDate(assignment.dueDate)}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {assignment.maxPoints} pts
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No assignments yet</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Pending Leave Requests */}
        {(user?.role === 'admin' || user?.role === 'staff') && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                {user?.role === 'admin' ? 'Pending Leave Requests' : 'My Leave Requests'}
              </CardTitle>
              <CardDescription>
                {user?.role === 'admin' 
                  ? 'Requests awaiting approval'
                  : 'Your submitted leave requests'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingLeaves.length > 0 ? (
                <div className="space-y-3">
                  {pendingLeaves.map((leave) => (
                    <div key={leave.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium">{leave.reason}</h4>
                        <p className="text-sm text-gray-600">
                          {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                        </p>
                      </div>
                      <Badge className={getStatusColor(leave.status)}>
                        {leave.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No leave requests</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* My Classes (for students and teachers) */}
        {(user?.role === 'teacher' || user?.role === 'student') && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                My Classes
              </CardTitle>
              <CardDescription>
                {user?.role === 'teacher' ? 'Classes you teach' : 'Classes you\'re enrolled in'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {userClasses.length > 0 ? (
                <div className="space-y-3">
                  {userClasses.map((classItem) => (
                    <div key={classItem.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium">{classItem.name}</h4>
                        <p className="text-sm text-gray-600">
                          {classItem.subject} • Grade {classItem.gradeLevel}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {classItem.subject}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No classes assigned</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Recent Messages */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Recent Messages
            </CardTitle>
            <CardDescription>Latest messages and announcements</CardDescription>
          </CardHeader>
          <CardContent>
            {recentMessages.length > 0 ? (
              <div className="space-y-3">
                {recentMessages.map((message) => (
                  <div key={message.id} className="p-3 bg-gray-50 rounded-lg">
                    <h4 className="font-medium">{message.subject}</h4>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {message.content}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      {formatDate(message.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No messages yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>Common tasks for your role</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {user?.role === 'admin' && (
              <>
                <Button variant="outline" className="h-20 flex-col">
                  <Users className="h-6 w-6 mb-2" />
                  Manage Users
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <BookOpen className="h-6 w-6 mb-2" />
                  Create Class
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <Award className="h-6 w-6 mb-2" />
                  Honor Roll
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <FileText className="h-6 w-6 mb-2" />
                  Blog Post
                </Button>
              </>
            )}
            {user?.role === 'teacher' && (
              <>
                <Button variant="outline" className="h-20 flex-col">
                  <ClipboardList className="h-6 w-6 mb-2" />
                  New Assignment
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <CheckCircle className="h-6 w-6 mb-2" />
                  Mark Attendance
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <FileText className="h-6 w-6 mb-2" />
                  Upload Resource
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <MessageSquare className="h-6 w-6 mb-2" />
                  Send Message
                </Button>
              </>
            )}
            {user?.role === 'student' && (
              <>
                <Button variant="outline" className="h-20 flex-col">
                  <ClipboardList className="h-6 w-6 mb-2" />
                  View Assignments
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <TrendingUp className="h-6 w-6 mb-2" />
                  Check Grades
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <Calendar className="h-6 w-6 mb-2" />
                  Request Leave
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <FileText className="h-6 w-6 mb-2" />
                  Resources
                </Button>
              </>
            )}
            {user?.role === 'staff' && (
              <>
                <Button variant="outline" className="h-20 flex-col">
                  <Calendar className="h-6 w-6 mb-2" />
                  Request Leave
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <MessageSquare className="h-6 w-6 mb-2" />
                  Staff Messages
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <AlertCircle className="h-6 w-6 mb-2" />
                  Report Issue
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <FileText className="h-6 w-6 mb-2" />
                  View Resources
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default Dashboard;