import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  MessageSquare, 
  Plus, 
  Send,
  Users,
  BookOpen,
  User
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { DataService } from '@/services/dataService';
import type { Message, Class, User as UserType } from '@/types/database';

export default function Messages() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [staffMessages, setStaffMessages] = useState<Message[]>([]);
  const [classMessages, setClassMessages] = useState<{ [classId: string]: Message[] }>({});
  const [classes, setClasses] = useState<Class[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showComposeDialog, setShowComposeDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('staff');

  // Form state
  const [messageForm, setMessageForm] = useState({
    recipientType: 'staff' as 'staff' | 'class' | 'individual',
    recipientId: '',
    subject: '',
    content: ''
  });

  const loadData = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Load staff messages
      const staffMessagesData = await DataService.getStaffMessages();
      setStaffMessages(staffMessagesData);
      
      // Load classes based on user role
      let classesData: Class[] = [];
      if (user.role === 'admin') {
        classesData = await DataService.getClasses();
        const usersData = await DataService.getUsersByRole('teacher');
        const studentsData = await DataService.getUsersByRole('student');
        const staffData = await DataService.getUsersByRole('staff');
        setUsers([...usersData, ...studentsData, ...staffData]);
      } else if (user.role === 'teacher') {
        classesData = await DataService.getClassesByTeacher(user.id);
        const studentsData = await DataService.getUsersByRole('student');
        setUsers(studentsData);
      } else if (user.role === 'student') {
        classesData = await DataService.getClassesByStudent(user.id);
      }
      
      setClasses(classesData);
      
      // Load class messages
      const classMessagesMap: { [classId: string]: Message[] } = {};
      for (const classItem of classesData) {
        const messages = await DataService.getClassMessages(classItem.id);
        classMessagesMap[classItem.id] = messages;
      }
      setClassMessages(classMessagesMap);
      
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSendMessage = async () => {
    if (!user) return;
    
    try {
      await DataService.sendMessage({
        senderId: user.id,
        recipientType: messageForm.recipientType,
        recipientId: messageForm.recipientType === 'staff' ? undefined : messageForm.recipientId,
        subject: messageForm.subject,
        content: messageForm.content
      });
      
      setShowComposeDialog(false);
      setMessageForm({
        recipientType: 'staff',
        recipientId: '',
        subject: '',
        content: ''
      });
      loadData();
    } catch (error) {
      console.error('Error sending message:', error);
    }
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

  const canSendMessages = user?.role === 'admin' || user?.role === 'teacher' || user?.role === 'staff';

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
          <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-600">
            {user?.role === 'admin' && 'Send messages to staff and classes'}
            {user?.role === 'teacher' && 'Communicate with staff and your classes'}
            {user?.role === 'student' && 'View messages from your classes'}
            {user?.role === 'staff' && 'View staff messages and announcements'}
          </p>
        </div>
        
        {canSendMessages && (
          <Dialog open={showComposeDialog} onOpenChange={setShowComposeDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Compose Message
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Compose New Message</DialogTitle>
                <DialogDescription>
                  Send a message to staff, a class, or an individual.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="recipient-type">Recipient Type</Label>
                  <Select 
                    value={messageForm.recipientType} 
                    onValueChange={(value: 'staff' | 'class' | 'individual') => 
                      setMessageForm({ ...messageForm, recipientType: value, recipientId: '' })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="staff">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Staff
                        </div>
                      </SelectItem>
                      {classes.length > 0 && (
                        <SelectItem value="class">
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4" />
                            Class
                          </div>
                        </SelectItem>
                      )}
                      {user?.role === 'admin' && (
                        <SelectItem value="individual">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Individual
                          </div>
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                {messageForm.recipientType === 'class' && (
                  <div>
                    <Label htmlFor="class-select">Select Class</Label>
                    <Select 
                      value={messageForm.recipientId} 
                      onValueChange={(value) => setMessageForm({ ...messageForm, recipientId: value })}
                    >
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
                )}
                
                {messageForm.recipientType === 'individual' && (
                  <div>
                    <Label htmlFor="user-select">Select User</Label>
                    <Select 
                      value={messageForm.recipientId} 
                      onValueChange={(value) => setMessageForm({ ...messageForm, recipientId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a user" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((userItem) => (
                          <SelectItem key={userItem.id} value={userItem.id}>
                            {userItem.displayName} ({userItem.role})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={messageForm.subject}
                    onChange={(e) => setMessageForm({ ...messageForm, subject: e.target.value })}
                    placeholder="Message subject"
                  />
                </div>
                
                <div>
                  <Label htmlFor="content">Message</Label>
                  <Textarea
                    id="content"
                    value={messageForm.content}
                    onChange={(e) => setMessageForm({ ...messageForm, content: e.target.value })}
                    placeholder="Type your message here..."
                    rows={6}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowComposeDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSendMessage}>
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Messages Tabs */}
      <div className="space-y-4">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('staff')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'staff'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Users className="h-4 w-4" />
            Staff Messages
          </button>
          {classes.length > 0 && (
            <button
              onClick={() => setActiveTab('classes')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'classes'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BookOpen className="h-4 w-4" />
              Class Messages
            </button>
          )}
        </div>

        {/* Staff Messages */}
        {activeTab === 'staff' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Staff Messages
              </CardTitle>
              <CardDescription>Messages for all staff members</CardDescription>
            </CardHeader>
            <CardContent>
              {staffMessages.length > 0 ? (
                <div className="space-y-4">
                  {staffMessages.map((message) => (
                    <div key={message.id} className="p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-lg">{message.subject}</h3>
                        <span className="text-sm text-gray-500">{formatDate(message.createdAt)}</span>
                      </div>
                      <p className="text-gray-700 mb-2">{message.content}</p>
                      <div className="text-sm text-gray-500">
                        From: {message.sender?.displayName || 'Unknown'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No staff messages</h3>
                  <p className="text-gray-600">No messages have been sent to staff yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Class Messages */}
        {activeTab === 'classes' && (
          <div className="space-y-6">
            {classes.map((classItem) => (
              <Card key={classItem.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    {classItem.name} - {classItem.subject}
                  </CardTitle>
                  <CardDescription>Messages for this class</CardDescription>
                </CardHeader>
                <CardContent>
                  {classMessages[classItem.id] && classMessages[classItem.id].length > 0 ? (
                    <div className="space-y-4">
                      {classMessages[classItem.id].map((message) => (
                        <div key={message.id} className="p-4 border rounded-lg hover:bg-gray-50">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-lg">{message.subject}</h3>
                            <span className="text-sm text-gray-500">{formatDate(message.createdAt)}</span>
                          </div>
                          <p className="text-gray-700 mb-2">{message.content}</p>
                          <div className="text-sm text-gray-500">
                            From: {message.sender?.displayName || 'Unknown'}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <MessageSquare className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">No messages for this class yet.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            
            {classes.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No classes available</h3>
                  <p className="text-gray-600">
                    {user?.role === 'student' 
                      ? 'You are not enrolled in any classes yet.'
                      : 'No classes have been created yet.'
                    }
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}