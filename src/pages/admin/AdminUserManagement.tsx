
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Search, UserPlus, UserCog, UserX } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  reportCount: number;
}

const AdminUserManagement = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
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

    const fetchUsers = async () => {
      try {
        setLoading(true);
        
        // In a real application, you would fetch from a users collection
        // For this demo, we'll extract unique users from reports
        const reportsRef = collection(db, 'reports');
        const reportsSnapshot = await getDocs(reportsRef);
        
        const userMap = new Map<string, UserData>();
        
        reportsSnapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.reportedBy && data.reporterName && data.reporterEmail) {
            if (!userMap.has(data.reportedBy)) {
              userMap.set(data.reportedBy, {
                id: data.reportedBy,
                name: data.reporterName,
                email: data.reporterEmail,
                role: data.reporterEmail === 'admin@pccoepune.org' ? 'Admin' : 'User',
                reportCount: 1
              });
            } else {
              const user = userMap.get(data.reportedBy)!;
              userMap.set(data.reportedBy, {
                ...user,
                reportCount: user.reportCount + 1
              });
            }
          }
        });
        
        // Add admin if not present
        if (!Array.from(userMap.values()).some(user => user.role === 'Admin')) {
          userMap.set('admin', {
            id: 'admin',
            name: 'Admin User',
            email: 'admin@pccoepune.org',
            role: 'Admin',
            reportCount: 0
          });
        }
        
        setUsers(Array.from(userMap.values()));
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
    
    fetchUsers();
  }, [currentUser, navigate, toast, isAdmin]);

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-campus-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Will redirect from useEffect
  }

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">User Management</h1>
        <Button
          variant="outline"
          onClick={() => navigate('/admin')}
        >
          Back to Dashboard
        </Button>
      </div>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Users</CardTitle>
          <div className="flex gap-2">
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button className="bg-campus-primary hover:bg-campus-primary/90">
              <UserPlus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Reports</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map(user => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'Admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {user.role}
                      </span>
                    </TableCell>
                    <TableCell>{user.reportCount}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm">
                        <UserCog className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" disabled={user.role === 'Admin'}>
                        <UserX className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUserManagement;
