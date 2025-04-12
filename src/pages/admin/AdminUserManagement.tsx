
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { Plus, Search, Mail } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import supabase from '@/lib/supabase';

interface User {
  id: string;
  email: string;
  name?: string;
  reportCount: number;
  hasSubmittedReports: boolean;
  createdAt: string;
}

const AdminUserManagement = () => {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [sendingInvite, setSendingInvite] = useState(false);
  const [userStats, setUserStats] = useState({
    totalUsers: 0,
    activeUsers: 0, // Users who have submitted at least one report
    totalReports: 0
  });

  useEffect(() => {
    if (!isAdmin) {
      toast({
        title: "Access Denied",
        description: "You do not have permission to view this page",
        variant: "destructive"
      });
      return;
    }

    fetchUsers();
  }, [isAdmin, toast]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch all reports to count per user
      const { data: reports, error: reportsError } = await supabase
        .from('reports')
        .select('reported_by');
        
      if (reportsError) throw reportsError;
      
      // Create a map of user IDs to their report counts
      const reportCountMap: Record<string, number> = {};
      reports?.forEach(report => {
        if (report.reported_by) {
          reportCountMap[report.reported_by] = (reportCountMap[report.reported_by] || 0) + 1;
        }
      });
      
      // For demo, let's generate mock user data
      const mockUsers: User[] = [
        {
          id: '1',
          email: 'admin@pccoepune.org',
          name: 'Admin User',
          reportCount: reportCountMap['1'] || 0,
          hasSubmittedReports: Boolean(reportCountMap['1']),
          createdAt: '2023-01-01T00:00:00Z'
        },
        {
          id: '2',
          email: 'john.doe@example.com',
          name: 'John Doe',
          reportCount: 3,
          hasSubmittedReports: true,
          createdAt: '2023-02-15T00:00:00Z'
        },
        {
          id: '3',
          email: 'jane.smith@example.com',
          name: 'Jane Smith',
          reportCount: 5,
          hasSubmittedReports: true,
          createdAt: '2023-03-10T00:00:00Z'
        },
        {
          id: '4',
          email: 'bob.johnson@example.com',
          name: 'Bob Johnson',
          reportCount: 0,
          hasSubmittedReports: false,
          createdAt: '2023-04-20T00:00:00Z'
        },
        {
          id: '5',
          email: 'alice.walker@example.com',
          name: 'Alice Walker',
          reportCount: 2,
          hasSubmittedReports: true,
          createdAt: '2023-05-05T00:00:00Z'
        }
      ];
      
      setUsers(mockUsers);
      
      // Calculate statistics
      const totalUsers = mockUsers.length;
      const activeUsers = mockUsers.filter(user => user.hasSubmittedReports).length;
      const totalReports = mockUsers.reduce((sum, user) => sum + user.reportCount, 0);
      
      setUserStats({
        totalUsers,
        activeUsers,
        totalReports
      });
      
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to load user data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInviteUser = async () => {
    if (!inviteEmail.trim()) return;
    
    try {
      setSendingInvite(true);
      
      // In a real app, this would send an invite email
      
      toast({
        title: "Invite sent",
        description: `Invitation email sent to ${inviteEmail}`,
      });
      
      setInviteEmail('');
      setShowInviteDialog(false);
    } catch (error) {
      console.error('Error sending invite:', error);
      toast({
        title: "Error",
        description: "Failed to send invitation",
        variant: "destructive",
      });
    } finally {
      setSendingInvite(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-campus-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">User Accounts</h1>
        
        <Button 
          onClick={() => setShowInviteDialog(true)}
          className="bg-campus-primary hover:bg-campus-primary/90"
        >
          <Plus className="mr-2 h-4 w-4" />
          Invite User
        </Button>
      </div>
      
      {/* User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{userStats.totalUsers}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{userStats.activeUsers}</div>
            <p className="text-sm text-muted-foreground">Users who have submitted reports</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{userStats.totalReports}</div>
          </CardContent>
        </Card>
      </div>
      
      {/* User List */}
      <Card>
        <CardHeader>
          <CardTitle>User Accounts</CardTitle>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Reports</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.name || 'N/A'}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.reportCount}</TableCell>
                  <TableCell>
                    {user.hasSubmittedReports ? (
                      <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>
                    ) : (
                      <Badge variant="outline">Registered</Badge>
                    )}
                  </TableCell>
                  <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    No users found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Invite User Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite User</DialogTitle>
            <DialogDescription>
              Send an invitation email to a new user to join the platform.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="email">Email address</Label>
            <div className="flex items-center mt-2">
              <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowInviteDialog(false)}
              disabled={sendingInvite}
            >
              Cancel
            </Button>
            <Button
              className="bg-campus-primary hover:bg-campus-primary/90"
              onClick={handleInviteUser}
              disabled={!inviteEmail.trim() || sendingInvite}
            >
              {sendingInvite ? "Sending..." : "Send Invite"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUserManagement;
