
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Search, Filter, User, MailIcon } from 'lucide-react';
import ReportList from '@/components/reports/ReportList';
import { useToast } from '@/components/ui/use-toast';

const AdminReportList = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Check if user is admin
  const isAdmin = currentUser?.email === 'admin@pccoepune.org';
  
  React.useEffect(() => {
    if (!isAdmin) {
      toast({
        title: "Access Denied",
        description: "You do not have permission to view this page",
        variant: "destructive"
      });
      navigate('/dashboard');
    }
  }, [currentUser, navigate, toast, isAdmin]);

  if (!isAdmin) {
    return null; // Will redirect from useEffect
  }

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Manage Reports</h1>
        <Button
          variant="outline"
          onClick={() => navigate('/admin')}
        >
          Back to Dashboard
        </Button>
      </div>
      
      <Card className="relative">
        <CardHeader>
          <CardTitle>All Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <ReportList isAdminView={true} />
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminReportList;
