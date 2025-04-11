
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { UserPlus, Search, Mail, User as UserIcon, Filter, MoreHorizontal } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import supabase from '@/lib/supabase';

interface User {
  id: string;
  email: string;
  created_at: string;
  display_name: string | null;
  reportCount: number;
}

const AdminUserManagement = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [sendingInvite, setSendingInvite] = useState(false);
  const [activeUserCount, setActiveUserCount] = useState(0);
  
  // Check if user is admin
  const isAdmin = currentUser?.email === 'admin@pccoepune.org';
  
  useEffect(() => {
    if (!isAdmin) {
      toast({
        title: "Access Denied",
        description: "You do not have permission to view this page",
        variant: "destructive"
      });
      navigate('/dashboard');
      return;
    }
    
    fetchUsers();
  }, [isAdmin, navigate, toast]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch users from auth.users table (this would normally be done via admin API)
      // For demo purposes, we'll use a mock dataset
      const mockUsers = [
        { id: '1', email: 'student1@college.edu', created_at: '2023-08-15T10:30:00Z', display_name: 'Student One' },
        { id: '2', email: 'student2@college.edu', created_at: '2023-09-05T14:45:00Z', display_name: 'Student Two' },
        { id: '3', email: 'faculty1@college.edu', created_at: '2023-07-20T09:15:00Z', display_name: 'Faculty Member' },
        { id: '4', email: 'staff1@college.edu', created_at: '2023-10-10T11:20:00Z', display_name: 'Staff Member' },
        { id: '5', email: 'admin@pccoepune.org', created_at: '2023-06-01T08:00:00Z', display_name: 'Admin User' },
      ];
      
      // Get report counts for each user
      const { data: reportsData, error: reportsError } = await supabase
        .from('reports')
        .select('reported_by');
        
      if (reportsError) {
        console.error('Error fetching report data:', reportsError);
      }
      
      const reportCounts: Record<string, number> = {};
      
      if (reportsData) {
        reportsData.forEach(report => {
          if (report.reported_by) {
            reportCounts[report.reported_by] = (reportCounts[report.reported_by] || 0) + 1;
          }
        });
      }
      
      // Combine user data with report counts
      const usersWithReportCounts = mockUsers.map(user => ({
        ...user,
        reportCount: reportCounts[user.id] || 0
      }));
      
      setUsers(usersWithReportCounts);
      setActiveUserCount(usersWithReportCounts.length);
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

  const handleSendInvite = async () => {
    if (!inviteEmail || !inviteEmail.includes('@')) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setSendingInvite(true);
      
      // This would normally call Supabase Auth APIs to send an invite
      // For demo purposes, we'll simulate success
      
      setTimeout(() => {
        toast({
          title: "Invitation Sent",
          description: `An invitation has been sent to ${inviteEmail}`,
        });
        
        setInviteEmail('');
        setShowInviteDialog(false);
        setSendingInvite(false);
      }, 1000);
    } catch (error) {
      console.error('Error sending invite:', error);
      toast({
        title: "Error",
        description: "Failed to send invitation",
        variant: "destructive"
      });
      setSendingInvite(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.display_name && user.display_name.toLowerCase().includes(searchTerm.toLowerCase()))
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
        <h1 className="text-3xl font-bold">Manage Users</h1>
        <Button 
          onClick={() => setShowInviteDialog(true)}
          className="bg-campus-primary hover:bg-campus-primary/90"
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Invite User
        </Button>
      </div>
      
      {/* User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <UserIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Users</p>
                <h3 className="text-2xl font-bold">{activeUserCount}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="bg-green-100 p-3 rounded-full">
                <Filter className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Reports</p>
                <h3 className="text-2xl font-bold">{users.reduce((sum, user) => sum + user.reportCount, 0)}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div className="w-full md:w-64 relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>
          <Input
            type="search"
            placeholder="Search users..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>User List</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No users found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left font-medium py-3 px-4">User</th>
                    <th className="text-left font-medium py-3 px-4">Email</th>
                    <th className="text-left font-medium py-3 px-4">Joined</th>
                    <th className="text-left font-medium py-3 px-4">Reports</th>
                    <th className="text-left font-medium py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user.id} className="border-b hover:bg-muted/20">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 bg-muted rounded-full flex items-center justify-center text-muted-foreground">
                            {user.display_name?.[0] || user.email[0].toUpperCase()}
                          </div>
                          <span>{user.display_name || 'Unnamed User'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">{user.email}</td>
                      <td className="py-3 px-4">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">{user.reportCount}</td>
                      <td className="py-3 px-4">
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Invite User Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite User</DialogTitle>
            <DialogDescription>
              Send an invitation email to a new user. They will receive a link to join the platform.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  className="pl-9"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
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
              onClick={handleSendInvite}
              disabled={!inviteEmail || sendingInvite}
              className="bg-campus-primary hover:bg-campus-primary/90"
            >
              {sendingInvite ? "Sending..." : "Send Invitation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUserManagement;
