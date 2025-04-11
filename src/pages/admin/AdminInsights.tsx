
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { useToast } from '@/components/ui/use-toast';
import supabase from '@/lib/supabase';
import { format, subDays } from 'date-fns';

const AdminInsights = () => {
  const { currentUser, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState({
    totalReports: 0,
    pendingReports: 0,
    resolvedReports: 0,
    submittedReports: 0
  });
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [timelineData, setTimelineData] = useState<any[]>([]);

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

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
    
    fetchInsightsData();
  }, [isAdmin, navigate, toast]);

  const fetchInsightsData = async () => {
    try {
      setLoading(true);
      
      // Fetch all reports
      const { data, error } = await supabase
        .from('reports')
        .select('*');
        
      if (error) throw error;
      
      if (data) {
        // Calculate basic stats
        const totalReports = data.length;
        const pendingReports = data.filter(r => r.status === 'in-progress').length;
        const resolvedReports = data.filter(r => r.status === 'resolved').length;
        const submittedReports = data.filter(r => r.status === 'submitted').length;
        
        setStatsData({
          totalReports,
          pendingReports,
          resolvedReports,
          submittedReports
        });
        
        // Generate category data
        const categories: Record<string, number> = {};
        data.forEach(report => {
          if (categories[report.category]) {
            categories[report.category]++;
          } else {
            categories[report.category] = 1;
          }
        });
        
        const categoryChartData = Object.keys(categories).map(category => ({
          name: category.charAt(0).toUpperCase() + category.slice(1),
          value: categories[category]
        }));
        
        setCategoryData(categoryChartData);
        
        // Generate timeline data (last 7 days)
        const last7Days = Array(7).fill(0).map((_, i) => {
          const date = subDays(new Date(), 6 - i);
          const formattedDate = format(date, 'yyyy-MM-dd');
          
          return {
            date: formattedDate,
            dateLabel: format(date, 'MMM dd'),
            reports: 0,
            resolved: 0
          };
        });
        
        data.forEach(report => {
          const reportDate = format(new Date(report.created_at), 'yyyy-MM-dd');
          const dayIndex = last7Days.findIndex(day => day.date === reportDate);
          
          if (dayIndex !== -1) {
            last7Days[dayIndex].reports++;
            
            if (report.status === 'resolved') {
              last7Days[dayIndex].resolved++;
            }
          }
        });
        
        setTimelineData(last7Days);
      }
    } catch (error) {
      console.error('Error fetching insights data:', error);
      toast({
        title: "Error",
        description: "Failed to load insights data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-campus-primary"></div>
      </div>
    );
  }

  // Prepare status data for pie chart
  const statusData = [
    { name: 'Submitted', value: statsData.submittedReports },
    { name: 'In Progress', value: statsData.pendingReports },
    { name: 'Resolved', value: statsData.resolvedReports }
  ];

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Insights Dashboard</h1>
      </div>
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{statsData.totalReports}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Pending Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{statsData.pendingReports + statsData.submittedReports}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Resolved Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{statsData.resolvedReports}</div>
          </CardContent>
        </Card>
      </div>
      
      {/* Status Distribution Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Report Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      {/* Category Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Reports by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={categoryData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" name="Number of Reports" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      {/* Timeline Line Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Reports Timeline (Last 7 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={timelineData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="dateLabel" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="reports"
                  name="New Reports"
                  stroke="#8884d8"
                  activeDot={{ r: 8 }}
                />
                <Line
                  type="monotone"
                  dataKey="resolved"
                  name="Resolved Reports"
                  stroke="#82ca9d"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminInsights;
