
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, ClipboardList, ChevronRight } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import ReportCard, { ReportType } from '@/components/reports/ReportCard';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [recentReports, setRecentReports] = useState<ReportType[]>([]);
  const [reportCounts, setReportCounts] = useState({
    total: 0,
    submitted: 0,
    inProgress: 0,
    resolved: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!currentUser) return;
      
      try {
        // Get recent reports
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
        
        // Count reports by status
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
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
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
      <header className="mb-6">
        <h1 className="text-3xl font-bold">Welcome, {currentUser?.displayName?.split(' ')[0]}!</h1>
        <p className="text-muted-foreground">Monitor and manage your campus issues reports</p>
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
