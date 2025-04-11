
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { useToast } from '@/components/ui/use-toast';
import supabase from '@/lib/supabase';

const AdminInsights = () => {
  const { currentUser, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState({
    totalReports: 0,
    pendingReports: 0,
    resolvedReports: 0,
    inProgressReports: 0,
  });

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
        const inProgressReports = data.filter(r => r.status === 'in-progress').length;
        const resolvedReports = data.filter(r => r.status === 'resolved').length;
        const pendingReports = data.filter(r => r.status === 'submitted').length;
        
        setStatsData({
          totalReports,
          pendingReports,
          resolvedReports,
          inProgressReports
        });
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

  // Prepare status data for bar chart
  const statusData = [
    { name: 'Total', value: statsData.totalReports, color: '#0088FE' },
    { name: 'Submitted', value: statsData.pendingReports, color: '#FFBB28' },
    { name: 'In Progress', value: statsData.inProgressReports, color: '#00C49F' },
    { name: 'Resolved', value: statsData.resolvedReports, color: '#FF8042' }
  ];

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Insights Dashboard</h1>
      </div>
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <div className="text-3xl font-bold">{statsData.pendingReports}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{statsData.inProgressReports}</div>
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
      
      {/* Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Reports by Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={statusData}
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
                <Bar dataKey="value" name="Number of Reports" fill="#8884d8">
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
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
                  data={statusData.filter(item => item.name !== 'Total')}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {statusData.filter(item => item.name !== 'Total').map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminInsights;
