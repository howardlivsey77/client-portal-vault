import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Trash2, UserX, Download, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useToast } from '@/hooks';

interface PrivacyRequest {
  id: string;
  type: 'data_export' | 'data_erasure';
  employee_id: string;
  employee_name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  completion_date?: string;
  request_details: any;
}

const mockRequests: PrivacyRequest[] = [
  {
    id: '1',
    type: 'data_export',
    employee_id: 'emp-001',
    employee_name: 'John Smith',
    status: 'completed',
    created_at: '2024-01-15T10:30:00Z',
    completion_date: '2024-01-15T11:45:00Z',
    request_details: { format: 'json', scope: 'complete_profile' },
  },
  {
    id: '2',
    type: 'data_erasure',
    employee_id: 'emp-002',
    employee_name: 'Sarah Johnson',
    status: 'pending',
    created_at: '2024-01-14T14:20:00Z',
    request_details: { method: 'anonymization', reason: 'Employee departure' },
  },
];

export const PrivacyRequestManager: React.FC = () => {
  const { toast } = useToast();
  const [requests, setRequests] = React.useState<PrivacyRequest[]>(mockRequests);
  const [newRequestType, setNewRequestType] = React.useState<'data_export' | 'data_erasure'>('data_export');
  const [selectedEmployee, setSelectedEmployee] = React.useState('');
  const [requestReason, setRequestReason] = React.useState('');
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  const handleCreateRequest = () => {
    if (!selectedEmployee || !requestReason) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const newRequest: PrivacyRequest = {
      id: Date.now().toString(),
      type: newRequestType,
      employee_id: selectedEmployee,
      employee_name: `Employee ${selectedEmployee}`,
      status: 'pending',
      created_at: new Date().toISOString(),
      request_details: { reason: requestReason },
    };

    setRequests(prev => [newRequest, ...prev]);
    setIsDialogOpen(false);
    setSelectedEmployee('');
    setRequestReason('');

    toast({
      title: "Request Created",
      description: `${newRequestType === 'data_export' ? 'Data export' : 'Data erasure'} request has been created`,
    });
  };

  const handleProcessRequest = (requestId: string) => {
    setRequests(prev => prev.map(req => 
      req.id === requestId 
        ? { ...req, status: 'processing' as const }
        : req
    ));

    // Simulate processing completion after 3 seconds
    setTimeout(() => {
      setRequests(prev => prev.map(req => 
        req.id === requestId 
          ? { 
              ...req, 
              status: 'completed' as const,
              completion_date: new Date().toISOString()
            }
          : req
      ));

      toast({
        title: "Request Completed",
        description: "Privacy request has been processed successfully",
      });
    }, 3000);

    toast({
      title: "Processing Started",
      description: "Privacy request is being processed...",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusBadgeVariant = (status: string): 'default' | 'secondary' | 'destructive' => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'failed':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getTypeIcon = (type: string) => {
    return type === 'data_export' ? (
      <Download className="h-4 w-4 text-blue-600" />
    ) : (
      <Trash2 className="h-4 w-4 text-red-600" />
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Privacy Request Manager</h1>
          <p className="text-muted-foreground">Handle GDPR data export and erasure requests</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserX className="h-4 w-4 mr-2" />
              New Request
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Privacy Request</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="requestType">Request Type</Label>
                <Select value={newRequestType} onValueChange={(value: any) => setNewRequestType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="data_export">Data Export (GDPR Article 20)</SelectItem>
                    <SelectItem value="data_erasure">Data Erasure (GDPR Article 17)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="employee">Employee</Label>
                <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="emp-001">John Smith (EMP-001)</SelectItem>
                    <SelectItem value="emp-002">Sarah Johnson (EMP-002)</SelectItem>
                    <SelectItem value="emp-003">Mike Davis (EMP-003)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="reason">Reason / Legal Basis</Label>
                <Textarea
                  id="reason"
                  placeholder="Enter the reason for this request..."
                  value={requestReason}
                  onChange={(e) => setRequestReason(e.target.value)}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateRequest}>
                  Create Request
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Requests</p>
                <p className="text-2xl font-bold">{requests.length}</p>
              </div>
              <UserX className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {requests.filter(r => r.status === 'pending').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Processing</p>
                <p className="text-2xl font-bold text-blue-600">
                  {requests.filter(r => r.status === 'processing').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {requests.filter(r => r.status === 'completed').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requests List */}
      <Card>
        <CardHeader>
          <CardTitle>Privacy Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {requests.map((request) => (
              <div key={request.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      {getTypeIcon(request.type)}
                      <span className="font-medium">
                        {request.type === 'data_export' ? 'Data Export Request' : 'Data Erasure Request'}
                      </span>
                      <Badge variant={getStatusBadgeVariant(request.status)}>
                        {getStatusIcon(request.status)}
                        <span className="ml-1">{request.status}</span>
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                      <div>
                        <span className="font-medium">Employee:</span> {request.employee_name}
                      </div>
                      <div>
                        <span className="font-medium">Created:</span> {new Date(request.created_at).toLocaleDateString()}
                      </div>
                      {request.completion_date && (
                        <div>
                          <span className="font-medium">Completed:</span> {new Date(request.completion_date).toLocaleDateString()}
                        </div>
                      )}
                    </div>

                    {request.request_details.reason && (
                      <div className="text-sm">
                        <span className="font-medium">Reason:</span> {request.request_details.reason}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {request.status === 'pending' && (
                      <Button size="sm" onClick={() => handleProcessRequest(request.id)}>
                        Process
                      </Button>
                    )}
                    {request.status === 'completed' && request.type === 'data_export' && (
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {requests.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <UserX className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No privacy requests found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};