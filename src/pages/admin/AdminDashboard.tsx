
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, ClipboardList, Users, CheckCircle2, Bell } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { ReportType } from '@/components/reports/ReportCard';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Notification {
  id: string;
  title: string;
  content: string;
  type: string;
  read: boolean;
  created_at: string;
  report_id?: string;
}

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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);

  // Check if user is admin
  const isAdmin = currentUser?.email === 'admin@pccoepune.org';

  // Subscribe to real-time changes for reports and notifications
  useEffect(() => {
    if (!isAdmin) return;
    
    const reportsChannel = supabase
      .channel('reports_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'reports' 
      }, () => {
        fetchAdminData();
      })
      .subscribe();
      
    const notificationsChannel = supabase
      .channel('notifications_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'notifications' 
      }, () => {
        fetchNotifications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(reportsChannel);
      supabase.removeChannel(notificationsChannel);
    };
  }, [isAdmin]);

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

    fetchAdminData();
    fetchNotifications();
  }, [currentUser, navigate, toast, isAdmin]);

  const fetchNotifications = async () => {
    if (!isAdmin) return;
    
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient', 'admin')
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (error) throw error;
      
      if (data) {
        setNotifications(data as Notification[]);
        
        // Show toast for new unread notifications
        const unreadCount = data.filter(n => !n.read).length;
        if (unreadCount > 0) {
          toast({
            title: `${unreadCount} New Notification${unreadCount > 1 ? 's' : ''}`,
            description: "You have new notifications to review",
          });
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('recipient', 'admin')
        .eq('read', false);
        
      if (error) throw error;
      
      fetchNotifications();
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      
      // Fetch reports from Supabase
      const { data: reportsData, error: reportsError } = await supabase
        .from('reports')
        .select('*');
        
      if (reportsError) throw reportsError;
      
      if (reportsData) {
        // Calculate stats
        const totalReports = reportsData.length;
        const pendingReports = reportsData.filter(r => r.status !== 'resolved').length;
        const resolvedReports = reportsData.filter(r => r.status === 'resolved').length;
        
        // Get unique users
        const usersSet = new Set();
        reportsData.forEach(report => {
          if (report.reported_by) {
            usersSet.add(report.reported_by);
          }
        });
        
        setStats({
          totalReports,
          pendingReports,
          resolvedReports,
          totalUsers: usersSet.size
        });
        
        // Get recent reports
        const recentData = reportsData
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5);
          
        // Transform to ReportType
        const transformedReports: ReportType[] = recentData.map(report => ({
          id: report.id,
          title: report.title,
          description: report.description,
          category: report.category,
          location: report.location,
          status: report.status,
          createdAt: new Date(report.created_at),
          reportedBy: report.reported_by,
          reporterName: report.reporter_name,
          reporterEmail: report.reporter_email,
          imageUrl: report.image_url
        }));
        
        setRecentReports(transformedReports);
      }
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

  const handleNotificationClick = (notification: Notification) => {
    // Mark notification as read
    supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notification.id)
      .then(() => {
        // Navigate to report if report_id exists
        if (notification.report_id) {
          navigate(`/admin/reports/${notification.report_id}`);
        }
        // Refresh notifications
        fetchNotifications();
      });
  };

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

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <Button
              variant="outline"
              className="relative"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-red-500 text-white" variant="secondary">
                  {unreadCount}
                </Badge>
              )}
            </Button>
            
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                <div className="p-3 border-b flex justify-between items-center">
                  <h3 className="font-semibold">Notifications</h3>
                  {unreadCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={markAllNotificationsAsRead}>
                      Mark all as read
                    </Button>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">No notifications</div>
                ) : (
                  <div>
                    {notifications.map(notification => (
                      <div 
                        key={notification.id}
                        className={`p-3 border-b cursor-pointer hover:bg-gray-50 flex items-start gap-3 ${!notification.read ? 'bg-blue-50' : ''}`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <Bell className={`h-5 w-5 mt-0.5 ${!notification.read ? 'text-blue-500' : 'text-gray-500'}`} />
                        <div>
                          <p className="font-medium text-sm">{notification.title}</p>
                          <p className="text-xs text-gray-600">{notification.content}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(notification.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
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
