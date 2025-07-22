import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Calendar, 
  Plus, 
  Check, 
  X,
  Clock,
  User,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { DataService } from '@/services/dataService';
import type { LeaveRequest } from '@/types/database';

export default function LeaveRequests() {
  const { user } = useAuth();
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Form state
  const [leaveForm, setLeaveForm] = useState({
    startDate: '',
    endDate: '',
    reason: ''
  });

  const loadData = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      let leaveRequestsData: LeaveRequest[] = [];
      
      if (user.role === 'admin') {
        leaveRequestsData = await DataService.getLeaveRequests();
      } else {
        leaveRequestsData = await DataService.getLeaveRequestsByUser(user.id);
      }
      
      setLeaveRequests(leaveRequestsData);
      
    } catch (error) {
      console.error('Error loading leave requests:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateLeaveRequest = async () => {
    if (!user) return;
    
    try {
      await DataService.createLeaveRequest({
        userId: user.id,
        startDate: leaveForm.startDate,
        endDate: leaveForm.endDate,
        reason: leaveForm.reason,
        status: 'pending'
      });
      
      setShowCreateDialog(false);
      setLeaveForm({ startDate: '', endDate: '', reason: '' });
      loadData();
    } catch (error) {
      console.error('Error creating leave request:', error);
    }
  };

  const handleApproveLeave = async (leaveId: string) => {
    if (!user || user.role !== 'admin') return;
    
    try {
      await DataService.updateLeaveRequest(leaveId, {
        status: 'approved',
        approvedBy: user.id,
        approvedAt: new Date().toISOString()
      });
      loadData();
    } catch (error) {
      console.error('Error approving leave request:', error);
    }
  };

  const handleRejectLeave = async (leaveId: string) => {
    if (!user || user.role !== 'admin') return;
    
    if (confirm('Are you sure you want to reject this leave request?')) {
      try {
        await DataService.updateLeaveRequest(leaveId, {
          status: 'rejected',
          approvedBy: user.id,
          approvedAt: new Date().toISOString()
        });
        loadData();
      } catch (error) {
        console.error('Error rejecting leave request:', error);
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    
    const icons = {
      pending: <Clock className="h-3 w-3 mr-1" />,
      approved: <Check className="h-3 w-3 mr-1" />,
      rejected: <X className="h-3 w-3 mr-1" />
    };
    
    return (
      <Badge className={colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        <div className="flex items-center">
          {icons[status as keyof typeof icons]}
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </div>
      </Badge>
    );
  };

  const calculateDays = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const getLeaveStats = () => {
    const stats = leaveRequests.reduce((acc, request) => {
      acc[request.status] = (acc[request.status] || 0) + 1;
      acc.total++;
      return acc;
    }, { pending: 0, approved: 0, rejected: 0, total: 0 });
    
    return stats;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const stats = getLeaveStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leave Requests</h1>
          <p className="text-gray-600">
            {user?.role === 'admin' && 'Manage all leave requests and approvals'}
            {user?.role !== 'admin' && 'Submit and track your leave requests'}
          </p>
        </div>
        
        {user?.role !== 'admin' && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Request Leave
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Request Leave</DialogTitle>
                <DialogDescription>
                  Submit a new leave request for approval.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={leaveForm.startDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="end-date">End Date</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={leaveForm.endDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="reason">Reason</Label>
                  <Textarea
                    id="reason"
                    value={leaveForm.reason}
                    onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                    placeholder="Please provide a reason for your leave request..."
                    rows={4}
                  />
                </div>
                {leaveForm.startDate && leaveForm.endDate && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Duration:</strong> {calculateDays(leaveForm.startDate, leaveForm.endDate)} day(s)
                    </p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateLeaveRequest}>
                  Submit Request
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Statistics */}
      {user?.role === 'admin' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <Check className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <X className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Leave Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {user?.role === 'admin' ? 'All Leave Requests' : 'My Leave Requests'}
          </CardTitle>
          <CardDescription>
            {user?.role === 'admin' 
              ? 'Review and manage leave requests from all staff and students'
              : 'Track the status of your submitted leave requests'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {leaveRequests.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {user?.role === 'admin' && <TableHead>Requester</TableHead>}
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    {user?.role === 'admin' && <TableHead>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaveRequests.map((request) => (
                    <TableRow key={request.id}>
                      {user?.role === 'admin' && (
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            {request.user?.displayName || 'Unknown'}
                          </div>
                        </TableCell>
                      )}
                      <TableCell>{formatDate(request.startDate)}</TableCell>
                      <TableCell>{formatDate(request.endDate)}</TableCell>
                      <TableCell>
                        {calculateDays(request.startDate, request.endDate)} day(s)
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate" title={request.reason}>
                          {request.reason}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell>{formatDate(request.createdAt)}</TableCell>
                      {user?.role === 'admin' && (
                        <TableCell>
                          {request.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleApproveLeave(request.id)}
                                className="text-green-600 hover:text-green-700"
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRejectLeave(request.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <X className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          )}
                          {request.status !== 'pending' && (
                            <div className="text-sm text-gray-500">
                              {request.status === 'approved' ? 'Approved' : 'Rejected'} by{' '}
                              {request.approver?.displayName || 'Admin'}
                              {request.approvedAt && (
                                <div className="text-xs">
                                  on {formatDate(request.approvedAt)}
                                </div>
                              )}
                            </div>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No leave requests</h3>
              <p className="text-gray-600">
                {user?.role === 'admin' 
                  ? 'No leave requests have been submitted yet.'
                  : 'You haven\'t submitted any leave requests yet.'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}