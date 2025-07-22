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
  ClipboardList, 
  Plus, 
  Edit, 
  Trash2, 
  Upload,
  Download,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Star
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { DataService } from '@/services/dataService';
import type { Assignment, AssignmentSubmission, Class } from '@/types/database';

export function Assignments() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showSubmissionsDialog, setShowSubmissionsDialog] = useState(false);
  const [showGradeDialog, setShowGradeDialog] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<AssignmentSubmission | null>(null);

  // Form states
  const [assignmentForm, setAssignmentForm] = useState({
    title: '',
    description: '',
    classId: '',
    dueDate: '',
    maxPoints: 100
  });

  const [submissionForm, setSubmissionForm] = useState({
    submissionText: '',
    submissionUrl: ''
  });

  const [gradeForm, setGradeForm] = useState({
    grade: '',
    feedback: ''
  });

  const loadData = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      let assignmentsData: Assignment[] = [];
      let classesData: Class[] = [];
      
      if (user.role === 'admin') {
        assignmentsData = await DataService.getAssignments();
        classesData = await DataService.getClasses();
      } else if (user.role === 'teacher') {
        assignmentsData = await DataService.getAssignmentsByTeacher(user.id);
        classesData = await DataService.getClassesByTeacher(user.id);
      } else if (user.role === 'student') {
        classesData = await DataService.getClassesByStudent(user.id);
        // Get assignments for student's classes
        const allAssignments = await Promise.all(
          classesData.map(c => DataService.getAssignmentsByClass(c.id))
        );
        assignmentsData = allAssignments.flat();
        
        // Load student's submissions
        const submissionsData = await DataService.getSubmissionsByStudent(user.id);
        setSubmissions(submissionsData);
      }
      
      setAssignments(assignmentsData);
      setClasses(classesData);
      
    } catch (error) {
      console.error('Error loading assignments:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateAssignment = async () => {
    if (!user || (user.role !== 'admin' && user.role !== 'teacher')) return;
    
    try {
      await DataService.createAssignment({
        title: assignmentForm.title,
        description: assignmentForm.description,
        classId: assignmentForm.classId,
        teacherId: user.id,
        dueDate: new Date(assignmentForm.dueDate).toISOString(),
        maxPoints: assignmentForm.maxPoints
      });
      
      setShowCreateDialog(false);
      setAssignmentForm({ title: '', description: '', classId: '', dueDate: '', maxPoints: 100 });
      loadData();
    } catch (error) {
      console.error('Error creating assignment:', error);
    }
  };

  const handleEditAssignment = async () => {
    if (!selectedAssignment || !user || (user.role !== 'admin' && user.role !== 'teacher')) return;
    
    try {
      await DataService.updateAssignment(selectedAssignment.id, {
        title: assignmentForm.title,
        description: assignmentForm.description,
        classId: assignmentForm.classId,
        dueDate: new Date(assignmentForm.dueDate).toISOString(),
        maxPoints: assignmentForm.maxPoints
      });
      
      setShowEditDialog(false);
      setSelectedAssignment(null);
      setAssignmentForm({ title: '', description: '', classId: '', dueDate: '', maxPoints: 100 });
      loadData();
    } catch (error) {
      console.error('Error updating assignment:', error);
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!user || (user.role !== 'admin' && user.role !== 'teacher')) return;
    
    if (confirm('Are you sure you want to delete this assignment? This action cannot be undone.')) {
      try {
        await DataService.deleteAssignment(assignmentId);
        loadData();
      } catch (error) {
        console.error('Error deleting assignment:', error);
      }
    }
  };

  const handleSubmitAssignment = async () => {
    if (!selectedAssignment || !user || user.role !== 'student') return;
    
    try {
      await DataService.submitAssignment({
        assignmentId: selectedAssignment.id,
        studentId: user.id,
        submissionText: submissionForm.submissionText,
        submissionUrl: submissionForm.submissionUrl || undefined
      });
      
      setShowSubmitDialog(false);
      setSelectedAssignment(null);
      setSubmissionForm({ submissionText: '', submissionUrl: '' });
      loadData();
    } catch (error) {
      console.error('Error submitting assignment:', error);
    }
  };

  const loadSubmissions = async (assignmentId: string) => {
    try {
      const submissionsData = await DataService.getSubmissionsByAssignment(assignmentId);
      setSubmissions(submissionsData);
    } catch (error) {
      console.error('Error loading submissions:', error);
    }
  };

  const handleGradeSubmission = async () => {
    if (!selectedSubmission || !user || (user.role !== 'admin' && user.role !== 'teacher')) return;
    
    try {
      await DataService.gradeSubmission(
        selectedSubmission.id,
        parseInt(gradeForm.grade),
        gradeForm.feedback,
        user.id
      );
      
      setShowGradeDialog(false);
      setSelectedSubmission(null);
      setGradeForm({ grade: '', feedback: '' });
      loadSubmissions(selectedAssignment!.id);
    } catch (error) {
      console.error('Error grading submission:', error);
    }
  };

  const openEditDialog = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setAssignmentForm({
      title: assignment.title,
      description: assignment.description || '',
      classId: assignment.classId,
      dueDate: new Date(assignment.dueDate).toISOString().slice(0, 16),
      maxPoints: assignment.maxPoints
    });
    setShowEditDialog(true);
  };

  const openSubmitDialog = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    
    // Check if student already submitted
    const existingSubmission = submissions.find(s => s.assignmentId === assignment.id);
    if (existingSubmission) {
      setSubmissionForm({
        submissionText: existingSubmission.submissionText || '',
        submissionUrl: existingSubmission.submissionUrl || ''
      });
    }
    
    setShowSubmitDialog(true);
  };

  const openSubmissionsDialog = async (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    await loadSubmissions(assignment.id);
    setShowSubmissionsDialog(true);
  };

  const openGradeDialog = (submission: AssignmentSubmission) => {
    setSelectedSubmission(submission);
    setGradeForm({
      grade: submission.grade?.toString() || '',
      feedback: submission.feedback || ''
    });
    setShowGradeDialog(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  const getSubmissionStatus = (assignment: Assignment) => {
    const submission = submissions.find(s => s.assignmentId === assignment.id);
    if (!submission) return 'not_submitted';
    if (submission.grade !== null && submission.grade !== undefined) return 'graded';
    return 'submitted';
  };

  const getStatusBadge = (assignment: Assignment) => {
    const status = getSubmissionStatus(assignment);
    const overdue = isOverdue(assignment.dueDate);
    
    if (status === 'graded') {
      return <Badge className="bg-green-100 text-green-800">Graded</Badge>;
    } else if (status === 'submitted') {
      return <Badge className="bg-blue-100 text-blue-800">Submitted</Badge>;
    } else if (overdue) {
      return <Badge className="bg-red-100 text-red-800">Overdue</Badge>;
    } else {
      return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
    }
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
          <h1 className="text-3xl font-bold text-gray-900">Assignments</h1>
          <p className="text-gray-600">
            {user?.role === 'admin' && 'Manage all assignments across classes'}
            {user?.role === 'teacher' && 'Create and manage your assignments'}
            {user?.role === 'student' && 'View and submit your assignments'}
          </p>
        </div>
        
        {(user?.role === 'admin' || user?.role === 'teacher') && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Assignment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Assignment</DialogTitle>
                <DialogDescription>
                  Create a new assignment for your class.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={assignmentForm.title}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })}
                    placeholder="Assignment title"
                  />
                </div>
                <div>
                  <Label htmlFor="class">Class</Label>
                  <Select value={assignmentForm.classId} onValueChange={(value) => setAssignmentForm({ ...assignmentForm, classId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a class" />
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
                <div>
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="datetime-local"
                    value={assignmentForm.dueDate}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, dueDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="maxPoints">Max Points</Label>
                  <Input
                    id="maxPoints"
                    type="number"
                    value={assignmentForm.maxPoints}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, maxPoints: parseInt(e.target.value) || 100 })}
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={assignmentForm.description}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, description: e.target.value })}
                    placeholder="Assignment instructions and details"
                    rows={4}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateAssignment}>Create Assignment</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Assignments Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {assignments.map((assignment) => (
          <Card key={assignment.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{assignment.title}</CardTitle>
                  <CardDescription>
                    {classes.find(c => c.id === assignment.classId)?.name || 'Unknown Class'}
                  </CardDescription>
                </div>
                {user?.role === 'student' && getStatusBadge(assignment)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {assignment.description && (
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {assignment.description}
                  </p>
                )}
                
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>Due: {formatDate(assignment.dueDate)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4" />
                    <span>{assignment.maxPoints} pts</span>
                  </div>
                </div>

                {isOverdue(assignment.dueDate) && (
                  <div className="flex items-center gap-1 text-red-600 text-sm">
                    <Clock className="h-4 w-4" />
                    <span>Overdue</span>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-2">
                  {user?.role === 'student' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openSubmitDialog(assignment)}
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      {getSubmissionStatus(assignment) === 'not_submitted' ? 'Submit' : 'Update'}
                    </Button>
                  )}
                  
                  {(user?.role === 'admin' || user?.role === 'teacher') && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openSubmissionsDialog(assignment)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Submissions
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(assignment)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteAssignment(assignment.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </>
                  )}
                </div>

                {user?.role === 'student' && (() => {
                  const submission = submissions.find(s => s.assignmentId === assignment.id);
                  if (submission && submission.grade !== null && submission.grade !== undefined) {
                    return (
                      <div className="mt-3 p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-green-800">
                            Grade: {submission.grade}/{assignment.maxPoints}
                          </span>
                          <span className="text-sm text-green-600">
                            {Math.round((submission.grade / assignment.maxPoints) * 100)}%
                          </span>
                        </div>
                        {submission.feedback && (
                          <p className="text-sm text-green-700 mt-1">{submission.feedback}</p>
                        )}
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {assignments.length === 0 && (
        <div className="text-center py-12">
          <ClipboardList className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No assignments found</h3>
          <p className="text-gray-600">
            {user?.role === 'student' 
              ? 'No assignments have been posted yet.'
              : 'Create your first assignment to get started.'
            }
          </p>
        </div>
      )}

      {/* Edit Assignment Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Assignment</DialogTitle>
            <DialogDescription>Update assignment details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={assignmentForm.title}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-class">Class</Label>
              <Select value={assignmentForm.classId} onValueChange={(value) => setAssignmentForm({ ...assignmentForm, classId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a class" />
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
            <div>
              <Label htmlFor="edit-dueDate">Due Date</Label>
              <Input
                id="edit-dueDate"
                type="datetime-local"
                value={assignmentForm.dueDate}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, dueDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-maxPoints">Max Points</Label>
              <Input
                id="edit-maxPoints"
                type="number"
                value={assignmentForm.maxPoints}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, maxPoints: parseInt(e.target.value) || 100 })}
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={assignmentForm.description}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, description: e.target.value })}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditAssignment}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Submit Assignment Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Assignment</DialogTitle>
            <DialogDescription>
              Submit your work for: {selectedAssignment?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="submissionText">Written Response</Label>
              <Textarea
                id="submissionText"
                value={submissionForm.submissionText}
                onChange={(e) => setSubmissionForm({ ...submissionForm, submissionText: e.target.value })}
                placeholder="Type your response here..."
                rows={6}
              />
            </div>
            <div>
              <Label htmlFor="submissionUrl">File URL (Optional)</Label>
              <Input
                id="submissionUrl"
                value={submissionForm.submissionUrl}
                onChange={(e) => setSubmissionForm({ ...submissionForm, submissionUrl: e.target.value })}
                placeholder="https://example.com/your-file.pdf"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitAssignment}>Submit Assignment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Submissions Dialog */}
      <Dialog open={showSubmissionsDialog} onOpenChange={setShowSubmissionsDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Assignment Submissions</DialogTitle>
            <DialogDescription>
              Submissions for: {selectedAssignment?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            {submissions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell>{submission.student?.displayName || 'Unknown'}</TableCell>
                      <TableCell>{formatDate(submission.submittedAt)}</TableCell>
                      <TableCell>
                        {submission.grade !== null && submission.grade !== undefined 
                          ? `${submission.grade}/${selectedAssignment?.maxPoints}`
                          : 'Not graded'
                        }
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openGradeDialog(submission)}
                        >
                          {submission.grade !== null && submission.grade !== undefined ? 'Update Grade' : 'Grade'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center py-8 text-gray-500">No submissions yet</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Grade Submission Dialog */}
      <Dialog open={showGradeDialog} onOpenChange={setShowGradeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Grade Submission</DialogTitle>
            <DialogDescription>
              Grade submission from: {selectedSubmission?.student?.displayName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedSubmission?.submissionText && (
              <div>
                <Label>Student Response</Label>
                <div className="p-3 bg-gray-50 rounded-lg max-h-32 overflow-y-auto">
                  <p className="text-sm">{selectedSubmission.submissionText}</p>
                </div>
              </div>
            )}
            {selectedSubmission?.submissionUrl && (
              <div>
                <Label>File Submission</Label>
                <a 
                  href={selectedSubmission.submissionUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm"
                >
                  View submitted file
                </a>
              </div>
            )}
            <div>
              <Label htmlFor="grade">Grade (out of {selectedAssignment?.maxPoints})</Label>
              <Input
                id="grade"
                type="number"
                min="0"
                max={selectedAssignment?.maxPoints}
                value={gradeForm.grade}
                onChange={(e) => setGradeForm({ ...gradeForm, grade: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="feedback">Feedback</Label>
              <Textarea
                id="feedback"
                value={gradeForm.feedback}
                onChange={(e) => setGradeForm({ ...gradeForm, feedback: e.target.value })}
                placeholder="Provide feedback to the student..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGradeDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleGradeSubmission}>Save Grade</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Assignments;