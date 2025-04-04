
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { collection, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ReportType } from '@/components/reports/ReportCard';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, ClipboardList, Users, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';

const AdminDashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stats, setStats] = useState({
    totalReports: 0,
    pendingReports: 0,
    resolvedReports: 0,
    totalUsers: 0
  });
  const [recentReports, setRecentReports] = useState<ReportType[]>([]);
  const [loading, setLoading] = useState(true);

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

    const fetchAdminData = async () => {
      try {
        setLoading(true);
        
        // Fetch total reports count
        const reportsRef = collection(db, 'reports');
        const reportsSnapshot = await getDocs(reportsRef);
        const totalReports = reportsSnapshot.size;
        
        // Fetch pending reports count
        const pendingQuery = query(reportsRef, where('status', '!=', 'resolved'));
        const pendingSnapshot = await getDocs(pendingQuery);
        const pendingReports = pendingSnapshot.size;
        
        // Fetch resolved reports count
        const resolvedQuery = query(reportsRef, where('status', '==', 'resolved'));
        const resolvedSnapshot = await getDocs(resolvedQuery);
        const resolvedReports = resolvedSnapshot.size;
        
        // Fetch recent reports
        const recentQuery = query(reportsRef, orderBy('createdAt', 'desc'), limit(5));
        const recentSnapshot = await getDocs(recentQuery);
        const recentReportsData = recentSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }) as ReportType);
        
        // Fetch users count (in a real app, this would be users collection)
        // For now, just count unique reportedBy values
        const usersSet = new Set();
        reportsSnapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.reportedBy) {
            usersSet.add(data.reportedBy);
          }
        });
        
        setStats({
          totalReports,
          pendingReports,
          resolvedReports,
          totalUsers: usersSet.size
        });
        
        setRecentReports(recentReportsData);
      } catch (error) {
        console.error('Error fetching admin data:', error);
        toast({
          title: "Error",
          description: "Failed to load admin dashboard data",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchAdminData();
  }, [currentUser, navigate, toast, isAdmin]);

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
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      </div>
      
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <ClipboardList className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Reports</p>
                <h3 className="text-2xl font-bold">{stats.totalReports}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="bg-yellow-100 p-3 rounded-full">
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Issues</p>
                <h3 className="text-2xl font-bold">{stats.pendingReports}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Resolved Issues</p>
                <h3 className="text-2xl font-bold">{stats.resolvedReports}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="bg-purple-100 p-3 rounded-full">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <h3 className="text-2xl font-bold">{stats.totalUsers}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Recent reports */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
        </CardHeader>
        <CardContent>
          {recentReports.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No reports found</p>
          ) : (
            <div className="space-y-4">
              {recentReports.map(report => (
                <div key={report.id} className="flex items-center justify-between border-b pb-4">
                  <div>
                    <h4 className="font-medium">{report.title}</h4>
                    <p className="text-sm text-muted-foreground line-clamp-1">{report.description}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`status-badge status-${report.status}`}>
                        {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {report.location}
                      </span>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate(`/admin/reports/${report.id}`)}
                  >
                    View
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button 
          onClick={() => navigate('/admin/reports')}
          className="h-auto py-4 bg-campus-primary hover:bg-campus-primary/90"
        >
          <ClipboardList className="mr-2 h-5 w-5" />
          Manage Reports
        </Button>
        
        <Button 
          onClick={() => navigate('/admin/users')}
          className="h-auto py-4 bg-campus-primary hover:bg-campus-primary/90"
        >
          <Users className="mr-2 h-5 w-5" />
          Manage Users
        </Button>
        
        <Button 
          onClick={() => navigate('/admin/teams')}
          className="h-auto py-4 bg-campus-primary hover:bg-campus-primary/90"
        >
          <Users className="mr-2 h-5 w-5" />
          Manage Teams
        </Button>
      </div>
    </div>
  );
};

export default AdminDashboard;
