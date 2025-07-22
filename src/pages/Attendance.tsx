import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  Calendar,
  Users,
  Plus,
  Search
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { DataService } from '@/services/dataService';
import type { Attendance, Class, User } from '@/types/database';

export default function AttendancePage() {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<{ [classId: string]: User[] }>({});
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showMarkDialog, setShowMarkDialog] = useState(false);
  const [attendanceData, setAttendanceData] = useState<{ [studentId: string]: string }>({});

  const loadData = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      let classesData: Class[] = [];
      
      if (user.role === 'admin') {
        classesData = await DataService.getClasses();
      } else if (user.role === 'teacher') {
        classesData = await DataService.getClassesByTeacher(user.id);
      } else if (user.role === 'student') {
        classesData = await DataService.getClassesByStudent(user.id);
        // Load student's attendance
        const attendanceData = await DataService.getAttendanceByStudent(user.id);
        setAttendance(attendanceData);
      }
      
      setClasses(classesData);

      // Load students for each class
      const studentsMap: { [classId: string]: User[] } = {};
      for (const classItem of classesData) {
        const classStudents = await DataService.getClassStudents(classItem.id);
        studentsMap[classItem.id] = classStudents;
      }
      setStudents(studentsMap);
      
      // Load attendance for selected class and date
      if (selectedClass && (user.role === 'admin' || user.role === 'teacher')) {
        const attendanceData = await DataService.getAttendanceByClass(selectedClass, selectedDate);
        setAttendance(attendanceData);
      }
      
    } catch (error) {
      console.error('Error loading attendance data:', error);
    } finally {
      setLoading(false);
    }
  }, [user, selectedClass, selectedDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleMarkAttendance = async () => {
    if (!selectedClass || !user || (user.role !== 'admin' && user.role !== 'teacher')) return;
    
    try {
      const classStudents = students[selectedClass] || [];
      
      for (const student of classStudents) {
        const status = attendanceData[student.id] || 'present';
        
        // Check if attendance already exists for this student and date
        const existingAttendance = attendance.find(
          a => a.studentId === student.id && a.classId === selectedClass && a.date === selectedDate
        );
        
        if (existingAttendance) {
          // Update existing attendance
          await DataService.updateAttendance(existingAttendance.id, { status });
        } else {
          // Create new attendance record
          await DataService.markAttendance({
            classId: selectedClass,
            studentId: student.id,
            date: selectedDate,
            status: status as 'present' | 'absent' | 'late' | 'excused',
            markedBy: user.id
          });
        }
      }
      
      setShowMarkDialog(false);
      setAttendanceData({});
      loadData();
    } catch (error) {
      console.error('Error marking attendance:', error);
    }
  };

  const openMarkDialog = () => {
    if (!selectedClass) return;
    
    const classStudents = students[selectedClass] || [];
    const initialData: { [studentId: string]: string } = {};
    
    // Pre-fill with existing attendance data
    classStudents.forEach(student => {
      const existingAttendance = attendance.find(
        a => a.studentId === student.id && a.classId === selectedClass && a.date === selectedDate
      );
      initialData[student.id] = existingAttendance?.status || 'present';
    });
    
    setAttendanceData(initialData);
    setShowMarkDialog(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'absent':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'late':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'excused':
        return <AlertCircle className="h-4 w-4 text-blue-600" />;
      default:
        return <CheckCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      present: 'bg-green-100 text-green-800',
      absent: 'bg-red-100 text-red-800',
      late: 'bg-yellow-100 text-yellow-800',
      excused: 'bg-blue-100 text-blue-800'
    };
    
    return (
      <Badge className={colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getAttendanceStats = () => {
    if (attendance.length === 0) return { present: 0, absent: 0, late: 0, excused: 0, total: 0 };
    
    const stats = attendance.reduce((acc, record) => {
      acc[record.status] = (acc[record.status] || 0) + 1;
      acc.total++;
      return acc;
    }, { present: 0, absent: 0, late: 0, excused: 0, total: 0 });
    
    return stats;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const stats = getAttendanceStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Attendance</h1>
          <p className="text-gray-600">
            {user?.role === 'admin' && 'Manage attendance across all classes'}
            {user?.role === 'teacher' && 'Mark and track student attendance'}
            {user?.role === 'student' && 'View your attendance record'}
          </p>
        </div>
      </div>

      {/* Filters and Controls */}
      {(user?.role === 'admin' || user?.role === 'teacher') && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Attendance Controls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="class-select">Select Class</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((classItem) => (
                      <SelectItem key={classItem.id} value={classItem.id}>
                        {classItem.name} - {classItem.subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label htmlFor="date-select">Date</Label>
                <Input
                  id="date-select"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={openMarkDialog}
                  disabled={!selectedClass}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Mark Attendance
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.present}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absent</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? Math.round((stats.absent / stats.total) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Late</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.late}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? Math.round((stats.late / stats.total) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Excused</CardTitle>
            <AlertCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.excused}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? Math.round((stats.excused / stats.total) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Records */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {user?.role === 'student' ? 'My Attendance Record' : 'Attendance Records'}
          </CardTitle>
          <CardDescription>
            {selectedClass && selectedDate 
              ? `${classes.find(c => c.id === selectedClass)?.name} - ${formatDate(selectedDate)}`
              : user?.role === 'student' 
              ? 'Your attendance across all classes'
              : 'Select a class and date to view records'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {attendance.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {user?.role !== 'student' && <TableHead>Student</TableHead>}
                    {user?.role === 'student' && <TableHead>Class</TableHead>}
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notes</TableHead>
                    {user?.role !== 'student' && <TableHead>Marked By</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendance.map((record) => (
                    <TableRow key={record.id}>
                      {user?.role !== 'student' && (
                        <TableCell>
                          {students[record.classId]?.find(s => s.id === record.studentId)?.displayName || 'Unknown'}
                        </TableCell>
                      )}
                      {user?.role === 'student' && (
                        <TableCell>
                          {classes.find(c => c.id === record.classId)?.name || 'Unknown Class'}
                        </TableCell>
                      )}
                      <TableCell>{formatDate(record.date)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(record.status)}
                          {getStatusBadge(record.status)}
                        </div>
                      </TableCell>
                      <TableCell>{record.notes || '-'}</TableCell>
                      {user?.role !== 'student' && (
                        <TableCell>
                          {record.marker?.displayName || 'System'}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No attendance records</h3>
              <p className="text-gray-600">
                {user?.role === 'student' 
                  ? 'No attendance has been recorded yet.'
                  : selectedClass 
                  ? 'No attendance marked for this class and date.'
                  : 'Select a class and date to view attendance records.'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mark Attendance Dialog */}
      <Dialog open={showMarkDialog} onOpenChange={setShowMarkDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Mark Attendance</DialogTitle>
            <DialogDescription>
              Mark attendance for {classes.find(c => c.id === selectedClass)?.name} on {formatDate(selectedDate)}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            {selectedClass && students[selectedClass] && students[selectedClass].length > 0 ? (
              <div className="space-y-4">
                {students[selectedClass].map((student) => (
                  <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{student.displayName}</h4>
                      <p className="text-sm text-gray-600">{student.email}</p>
                    </div>
                    <Select 
                      value={attendanceData[student.id] || 'present'} 
                      onValueChange={(value) => setAttendanceData(prev => ({ ...prev, [student.id]: value }))}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="present">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            Present
                          </div>
                        </SelectItem>
                        <SelectItem value="absent">
                          <div className="flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-red-600" />
                            Absent
                          </div>
                        </SelectItem>
                        <SelectItem value="late">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-yellow-600" />
                            Late
                          </div>
                        </SelectItem>
                        <SelectItem value="excused">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-blue-600" />
                            Excused
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-8 text-gray-500">No students enrolled in this class</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMarkDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleMarkAttendance}>
              Save Attendance
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}