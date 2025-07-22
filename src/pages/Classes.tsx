import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  BookOpen, 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  UserPlus,
  UserMinus,
  Search
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { DataService } from '@/services/dataService';
import type { Class, User } from '@/types/database';

export function Classes() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [classStudents, setClassStudents] = useState<{ [classId: string]: User[] }>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showStudentsDialog, setShowStudentsDialog] = useState(false);
  const [showEnrollDialog, setShowEnrollDialog] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    gradeLevel: '',
    teacherId: '',
    description: ''
  });

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
      }
      
      setClasses(classesData);

      // Load teachers and students for admin
      if (user.role === 'admin') {
        const [teachersData, studentsData] = await Promise.all([
          DataService.getUsersByRole('teacher'),
          DataService.getUsersByRole('student')
        ]);
        setTeachers(teachersData);
        setStudents(studentsData);
      }

      // Load students for each class
      const studentsMap: { [classId: string]: User[] } = {};
      for (const classItem of classesData) {
        const classStudentsData = await DataService.getClassStudents(classItem.id);
        studentsMap[classItem.id] = classStudentsData;
      }
      setClassStudents(studentsMap);
      
    } catch (error) {
      console.error('Error loading classes:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateClass = async () => {
    if (!user || user.role !== 'admin') return;
    
    try {
      await DataService.createClass({
        name: formData.name,
        subject: formData.subject,
        gradeLevel: formData.gradeLevel,
        teacherId: formData.teacherId,
        description: formData.description
      });
      
      setShowCreateDialog(false);
      setFormData({ name: '', subject: '', gradeLevel: '', teacherId: '', description: '' });
      loadData();
    } catch (error) {
      console.error('Error creating class:', error);
    }
  };

  const handleEditClass = async () => {
    if (!selectedClass || !user || user.role !== 'admin') return;
    
    try {
      await DataService.updateClass(selectedClass.id, {
        name: formData.name,
        subject: formData.subject,
        gradeLevel: formData.gradeLevel,
        teacherId: formData.teacherId,
        description: formData.description
      });
      
      setShowEditDialog(false);
      setSelectedClass(null);
      setFormData({ name: '', subject: '', gradeLevel: '', teacherId: '', description: '' });
      loadData();
    } catch (error) {
      console.error('Error updating class:', error);
    }
  };

  const handleDeleteClass = async (classId: string) => {
    if (!user || user.role !== 'admin') return;
    
    if (confirm('Are you sure you want to delete this class? This action cannot be undone.')) {
      try {
        await DataService.deleteClass(classId);
        loadData();
      } catch (error) {
        console.error('Error deleting class:', error);
      }
    }
  };

  const handleEnrollStudent = async (studentId: string) => {
    if (!selectedClass) return;
    
    try {
      await DataService.enrollStudent(selectedClass.id, studentId);
      loadData();
    } catch (error) {
      console.error('Error enrolling student:', error);
    }
  };

  const handleUnenrollStudent = async (studentId: string) => {
    if (!selectedClass) return;
    
    if (confirm('Are you sure you want to unenroll this student?')) {
      try {
        await DataService.unenrollStudent(selectedClass.id, studentId);
        loadData();
      } catch (error) {
        console.error('Error unenrolling student:', error);
      }
    }
  };

  const openEditDialog = (classItem: Class) => {
    setSelectedClass(classItem);
    setFormData({
      name: classItem.name,
      subject: classItem.subject,
      gradeLevel: classItem.gradeLevel,
      teacherId: classItem.teacherId,
      description: classItem.description || ''
    });
    setShowEditDialog(true);
  };

  const openStudentsDialog = (classItem: Class) => {
    setSelectedClass(classItem);
    setShowStudentsDialog(true);
  };

  const openEnrollDialog = (classItem: Class) => {
    setSelectedClass(classItem);
    setShowEnrollDialog(true);
  };

  const filteredClasses = classes.filter(classItem =>
    classItem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    classItem.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    classItem.gradeLevel.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getAvailableStudents = () => {
    if (!selectedClass) return [];
    const enrolledStudentIds = classStudents[selectedClass.id]?.map(s => s.id) || [];
    return students.filter(student => !enrolledStudentIds.includes(student.id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Classes</h1>
          <p className="text-gray-600">
            {user?.role === 'admin' && 'Manage all classes and enrollments'}
            {user?.role === 'teacher' && 'Your assigned classes'}
            {user?.role === 'student' && 'Your enrolled classes'}
          </p>
        </div>
        
        <div className="flex gap-2">
          {user?.role === 'admin' && (
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Class
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Class</DialogTitle>
                  <DialogDescription>
                    Add a new class to the system and assign a teacher.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Class Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Advanced Mathematics"
                    />
                  </div>
                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="e.g., Mathematics"
                    />
                  </div>
                  <div>
                    <Label htmlFor="gradeLevel">Grade Level</Label>
                    <Input
                      id="gradeLevel"
                      value={formData.gradeLevel}
                      onChange={(e) => setFormData({ ...formData, gradeLevel: e.target.value })}
                      placeholder="e.g., 10"
                    />
                  </div>
                  <div>
                    <Label htmlFor="teacher">Teacher</Label>
                    <Select value={formData.teacherId} onValueChange={(value) => setFormData({ ...formData, teacherId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a teacher" />
                      </SelectTrigger>
                      <SelectContent>
                        {teachers.map((teacher) => (
                          <SelectItem key={teacher.id} value={teacher.id}>
                            {teacher.displayName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Class description (optional)"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateClass}>Create Class</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search classes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClasses.map((classItem) => (
          <Card key={classItem.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{classItem.name}</CardTitle>
                  <CardDescription>{classItem.subject}</CardDescription>
                </div>
                <Badge variant="outline">Grade {classItem.gradeLevel}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {classItem.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {classItem.description}
                  </p>
                )}
                
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="h-4 w-4" />
                  <span>{classStudents[classItem.id]?.length || 0} students</span>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openStudentsDialog(classItem)}
                  >
                    <Users className="h-4 w-4 mr-1" />
                    Students
                  </Button>
                  
                  {user?.role === 'admin' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEnrollDialog(classItem)}
                      >
                        <UserPlus className="h-4 w-4 mr-1" />
                        Enroll
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(classItem)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClass(classItem.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredClasses.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No classes found</h3>
          <p className="text-gray-600">
            {searchTerm ? 'Try adjusting your search terms.' : 'No classes have been created yet.'}
          </p>
        </div>
      )}

      {/* Edit Class Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Class</DialogTitle>
            <DialogDescription>
              Update class information and settings.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Class Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-subject">Subject</Label>
              <Input
                id="edit-subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-gradeLevel">Grade Level</Label>
              <Input
                id="edit-gradeLevel"
                value={formData.gradeLevel}
                onChange={(e) => setFormData({ ...formData, gradeLevel: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-teacher">Teacher</Label>
              <Select value={formData.teacherId} onValueChange={(value) => setFormData({ ...formData, teacherId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a teacher" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditClass}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Students Dialog */}
      <Dialog open={showStudentsDialog} onOpenChange={setShowStudentsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Class Students</DialogTitle>
            <DialogDescription>
              Students enrolled in {selectedClass?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            {selectedClass && classStudents[selectedClass.id]?.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    {user?.role === 'admin' && <TableHead>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classStudents[selectedClass.id].map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>{student.displayName}</TableCell>
                      <TableCell>{student.email}</TableCell>
                      {user?.role === 'admin' && (
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUnenrollStudent(student.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <UserMinus className="h-4 w-4 mr-1" />
                            Unenroll
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center py-8 text-gray-500">No students enrolled yet</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Enroll Students Dialog */}
      <Dialog open={showEnrollDialog} onOpenChange={setShowEnrollDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Enroll Students</DialogTitle>
            <DialogDescription>
              Add students to {selectedClass?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            {getAvailableStudents().length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getAvailableStudents().map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>{student.displayName}</TableCell>
                      <TableCell>{student.email}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEnrollStudent(student.id)}
                        >
                          <UserPlus className="h-4 w-4 mr-1" />
                          Enroll
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center py-8 text-gray-500">All students are already enrolled</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Classes;