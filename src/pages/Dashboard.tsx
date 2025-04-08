import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, ClipboardList, ChevronRight, BellRing } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import ReportCard, { ReportType } from '@/components/reports/ReportCard';
import { useToast } from '@/components/ui/use-toast';
import supabase from '@/lib/supabase';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [recentReports, setRecentReports] = useState<ReportType[]>([]);
  const [reportCounts, setReportCounts] = useState({
    total: 0,
    submitted: 0,
    inProgress: 0,
    resolved: 0
  });
  const [loading, setLoading] = useState(true);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);

  useEffect(() => {
    if (!currentUser?.uid) return;
    
    const reportsChannel = supabase
      .channel('reports_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'reports',
        filter: `reported_by=eq.${currentUser.uid}`
      }, () => {
        fetchDashboardData();
        toast({
          title: "Report Updated",
          description: "One of your reports has been updated",
        });
      })
      .subscribe();
      
    const notificationsChannel = supabase
      .channel('user_notifications')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications',
        filter: `user_id=eq.${currentUser.uid}`
      }, () => {
        setHasNewNotifications(true);
        toast({
          title: "New Notification",
          description: "You have a new notification",
        });
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(reportsChannel);
      supabase.removeChannel(notificationsChannel);
    };
  }, [currentUser?.uid, toast]);

  const fetchDashboardData = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      
      const { data: reportsData, error } = await supabase
        .from('reports')
        .select('*')
        .eq('reported_by', currentUser.uid)
        .order('created_at', { ascending: false })
        .limit(3);
      
      if (error) {
        throw error;
      }
      
      if (reportsData) {
        const reports: ReportType[] = reportsData.map(report => ({
          id: report.id,
          title: report.title,
          description: report.description,
          category: report.category,
          status: report.status,
          location: report.location,
          imageUrl: report.image_url,
          createdAt: new Date(report.created_at),
          reportedBy: report.reported_by,
          reporterName: report.reporter_name
        }));
        
        setRecentReports(reports);
        
        const { data: countData, error: countError } = await supabase
          .from('reports')
          .select('status')
          .eq('reported_by', currentUser.uid);
          
        if (countError) {
          throw countError;
        }
        
        if (countData) {
          const counts = {
            total: countData.length,
            submitted: countData.filter(r => r.status === 'submitted').length,
            inProgress: countData.filter(r => r.status === 'in-progress').length,
            resolved: countData.filter(r => r.status === 'resolved').length
          };
          
          setReportCounts(counts);
        }
      } else {
        const reportsQuery = query(
          collection(db, 'reports'),
          where('reportedBy', '==', currentUser.uid),
          orderBy('createdAt', 'desc'),
          limit(3)
        );
        
        const querySnapshot = await getDocs(reportsQuery);
        const reports: ReportType[] = [];
        querySnapshot.forEach((doc) => {
          reports.push({
            id: doc.id,
            ...doc.data()
          } as ReportType);
        });
        
        setRecentReports(reports);
        
        const allReportsQuery = query(
          collection(db, 'reports'),
          where('reportedBy', '==', currentUser.uid)
        );
        
        const allReportsSnapshot = await getDocs(allReportsQuery);
        
        const counts = {
          total: allReportsSnapshot.size,
          submitted: 0,
          inProgress: 0,
          resolved: 0
        };
        
        allReportsSnapshot.forEach((doc) => {
          const status = doc.data().status;
          if (status === 'submitted') counts.submitted++;
          else if (status === 'in-progress') counts.inProgress++;
          else if (status === 'resolved') counts.resolved++;
        });
        
        setReportCounts(counts);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-campus-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto pt-20">
      <header className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Welcome, {currentUser?.displayName?.split(' ')[0]}!</h1>
          <p className="text-muted-foreground">Monitor and manage your campus issues reports</p>
        </div>
        
        {hasNewNotifications && (
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={() => setHasNewNotifications(false)}
          >
            <BellRing className="h-4 w-4 text-red-500" />
            <span>New Updates</span>
          </Button>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{reportCounts.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-500">Submitted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{reportCounts.submitted}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-campus-warning">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{reportCounts.inProgress}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-campus-success">Resolved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{reportCounts.resolved}</div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <Link to="/new-report">
              <CardContent className="p-6 flex items-center space-x-4">
                <div className="h-12 w-12 rounded-full bg-campus-primary/10 flex items-center justify-center">
                  <Plus className="h-6 w-6 text-campus-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Report an Issue</h3>
                  <p className="text-sm text-muted-foreground">File a new campus problem report</p>
                </div>
              </CardContent>
            </Link>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow">
            <Link to="/my-reports">
              <CardContent className="p-6 flex items-center space-x-4">
                <div className="h-12 w-12 rounded-full bg-campus-primary/10 flex items-center justify-center">
                  <ClipboardList className="h-6 w-6 text-campus-primary" />
                </div>
                <div>
                  <h3 className="font-medium">My Reports</h3>
                  <p className="text-sm text-muted-foreground">View and track your submitted reports</p>
                </div>
              </CardContent>
            </Link>
          </Card>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Recent Reports</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/my-reports" className="flex items-center">
              View All <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
        
        {recentReports.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No Reports Yet</CardTitle>
              <CardDescription>Start by creating your first issue report</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="bg-campus-primary hover:bg-campus-primary/90">
                <Link to="/new-report">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Report
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentReports.map((report) => (
              <ReportCard key={report.id} report={report} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
