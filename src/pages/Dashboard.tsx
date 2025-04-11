
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, ClipboardList, ChevronRight, BellRing, AlertCircle } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import ReportCard, { ReportType } from '@/components/reports/ReportCard';
import { useToast } from '@/components/ui/use-toast';
import supabase from '@/lib/supabase';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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
  const [supabaseError, setSupabaseError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser?.uid) return;
    
    // Listen for changes to reports
    const reportsChannel = supabase
      .channel('reports_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'reports',
        filter: `reported_by=eq.${currentUser.uid}`
      }, () => {
        console.log("Reports updated, fetching data...");
        fetchDashboardData();
        toast({
          title: "Report Updated",
          description: "One of your reports has been updated",
        });
      })
      .subscribe();
      
    // Listen for new notifications  
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
      setSupabaseError(null);
      
      const { data: reportsData, error } = await supabase
        .from('reports')
        .select('*')
        .eq('reported_by', currentUser.uid)
        .order('created_at', { ascending: false })
        .limit(3);
      
      if (error) {
        if (error.code === '42P01') {
          // Table doesn't exist error
          setSupabaseError("The reports table does not exist in your Supabase database. Please create it.");
          // Fall back to Firebase for now
          fetchFromFirebase();
          return;
        }
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
      } 
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Fall back to Firebase
      fetchFromFirebase();
    } finally {
      setLoading(false);
    }
  };

  const fetchFromFirebase = async () => {
    try {
      const reportsQuery = query(
        collection(db, 'reports'),
        where('reportedBy', '==', currentUser?.uid),
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
        where('reportedBy', '==', currentUser?.uid)
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
    } catch (firebaseError) {
      console.error('Error fetching from Firebase:', firebaseError);
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

      {supabaseError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Database Error</AlertTitle>
          <AlertDescription>
            {supabaseError}<br />
            <span className="font-medium">Solution:</span> You need to create the necessary tables in Supabase. 
            Go to your Supabase dashboard, select your project, go to SQL Editor, and run the following SQL:
            <pre className="mt-2 p-2 bg-gray-800 text-white text-xs rounded overflow-auto">
              {`CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  location TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'submitted',
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reported_by TEXT NOT NULL,
  reporter_name TEXT,
  reporter_email TEXT
);

-- Enable RLS
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Create policy for reading reports (users can see their own reports)
CREATE POLICY "Users can view their own reports" ON reports
  FOR SELECT USING (auth.uid() = reported_by);

-- Create policy for inserting reports (authenticated users can create reports)
CREATE POLICY "Users can create reports" ON reports
  FOR INSERT WITH CHECK (auth.uid() = reported_by);

-- Create notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient TEXT NOT NULL,
  type TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policy for reading notifications
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);
  
-- Create policy for inserting notifications
CREATE POLICY "Users can create notifications" ON notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);`}
            </pre>
          </AlertDescription>
        </Alert>
      )}

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
