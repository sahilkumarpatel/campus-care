import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { MoreVertical, Edit, Copy, Trash, ArrowLeft, MessageCircle } from 'lucide-react';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import supabase from '@/lib/supabase';
import CommentsList from '@/components/reports/comments/CommentsList';

interface Report {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  status: string;
  createdAt: string;
  imageUrl?: string | null;
  reportedBy: string;
  reporterName?: string;
  reporterEmail?: string;
}

const AdminDashboard = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [comment, setComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentUser, isAdmin } = useAuth();

  useEffect(() => {
    if (!isAdmin) {
      navigate('/login');
      return;
    }
    
    const fetchReports = async () => {
      try {
        setLoading(true);
        
        const { data: supabaseData, error: supabaseError } = await supabase
          .from('reports')
          .select('*');
          
        if (supabaseError) {
          console.error('Supabase error:', supabaseError);
          setError('Failed to load reports from Supabase.');
        }
        
        if (supabaseData) {
          const transformedReports = supabaseData.map(report => ({
            id: report.id,
            title: report.title,
            description: report.description,
            category: report.category,
            location: report.location,
            status: report.status,
            createdAt: report.created_at,
            imageUrl: report.image_url,
            reportedBy: report.reported_by,
            reporterName: report.reporter_name,
            reporterEmail: report.reporter_email,
          }));
          setReports(transformedReports);
        }
      } catch (err) {
        console.error('Error fetching reports:', err);
        setError('Failed to load reports.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchReports();

    // Set up real-time subscription for updates
    const reportsChannel = supabase
      .channel('reports_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'reports' 
      }, () => {
        console.log('Reports updated, refreshing data');
        fetchReports();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(reportsChannel);
    };
  }, [isAdmin, navigate, toast]);

  const filteredReports = reports.filter(report =>
    report.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (statusFilter === 'all' || report.status === statusFilter)
  );

  const sortedReports = [...filteredReports].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
  });

  const fetchComments = async (reportId: string) => {
    try {
      setLoadingComments(true);
      
      const { data, error } = await supabase
        .from('report_comments')
        .select('*')
        .eq('report_id', reportId)
        .order('created_at', { ascending: true });
        
      if (error) throw error;
      
      if (data) {
        setComments(data);
      }
    } catch (err) {
      console.error('Error fetching comments:', err);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleViewReport = async (report: Report) => {
    setSelectedReport(report);
    setIsViewModalOpen(true);
    await fetchComments(report.id);
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedReport(null);
    setComments([]);
  };

  const handleUpdateStatus = async (reportId: string, newStatus: 'submitted' | 'in-progress' | 'resolved') => {
    try {
      const { error } = await supabase
        .from('reports')
        .update({ status: newStatus })
        .eq('id', reportId);
      
      if (error) {
        console.error('Supabase error:', error);
        // Fallback to Firebase
        await updateDoc(doc(db, 'reports', reportId), {
          status: newStatus
        });
      }
      
      setSelectedReport(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          status: newStatus
        };
      });
      
      setReports(prevReports => 
        prevReports.map(report => 
          report.id === reportId ? { ...report, status: newStatus } : report
        )
      );
      
      // Send notification if status changed to in-progress or resolved
      if (newStatus === 'in-progress' || newStatus === 'resolved') {
        const report = reports.find(r => r.id === reportId);
        if (report && report.reportedBy) {
          const notificationTitle = newStatus === 'in-progress' 
            ? 'Your report is now in progress' 
            : 'Your report has been resolved';
          const notificationContent = newStatus === 'in-progress'
            ? `Your report "${report.title}" is now being processed.`
            : `Your report "${report.title}" has been marked as resolved.`;
          
          try {
            await supabase
              .from('notifications')
              .insert([{
                recipient: report.reportedBy,
                type: 'status_update',
                title: notificationTitle,
                content: notificationContent,
                report_id: reportId,
                user_id: report.reportedBy,
                read: false
              }]);
            
            console.log('Notification sent successfully');
          } catch (notificationError) {
            console.error('Error sending notification:', notificationError);
          }
        }
      }
      
      toast({
        title: "Status updated",
        description: `Report status updated to ${newStatus}`,
      });
      
      setIsViewModalOpen(false);
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const handleCommentSubmit = async () => {
    if (!selectedReport?.id || !comment.trim() || !currentUser) return;
    
    try {
      setSubmittingComment(true);
      
      const newComment = {
        report_id: selectedReport.id,
        content: comment.trim(),
        user_id: currentUser.uid,
        user_name: currentUser.displayName || 'Admin',
        is_admin: true,
        created_at: new Date().toISOString()
      };
      
      // Insert the comment
      const { data, error } = await supabase
        .from('report_comments')
        .insert([newComment])
        .select();
        
      if (error) {
        console.error('Error submitting comment:', error);
        throw error;
      }
      
      // Add to local state
      if (data && data.length > 0) {
        setComments(prev => [...prev, data[0]]);
      }
      
      // Send notification to the report owner
      if (selectedReport.reportedBy) {
        try {
          await supabase
            .from('notifications')
            .insert([{
              recipient: selectedReport.reportedBy,
              type: 'comment',
              title: 'New comment on your report',
              content: `An admin has commented on your report "${selectedReport.title}"`,
              report_id: selectedReport.id,
              user_id: selectedReport.reportedBy,
              read: false
            }]);
        } catch (notificationError) {
          console.error('Error sending notification:', notificationError);
        }
      }
      
      toast({
        title: "Comment submitted",
        description: "Your comment has been added to this report",
      });
      
      setComment('');
    } catch (error) {
      console.error('Error submitting comment:', error);
      toast({
        title: "Error",
        description: "Failed to submit comment",
        variant: "destructive",
      });
    } finally {
      setSubmittingComment(false);
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'status-badge status-submitted';
      case 'in-progress':
        return 'status-badge status-in-progress';
      case 'resolved':
        return 'status-badge status-resolved';
      default:
        return 'status-badge status-submitted';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-campus-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-4xl pt-20 px-4">
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-campus-error mb-4">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto pt-20">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage and oversee all submitted reports</p>
      </header>
      
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center mb-6">
        <div className="w-full md:w-64 relative">
          <Input
            type="search"
            placeholder="Search reports..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm whitespace-nowrap">Filter by:</span>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm whitespace-nowrap">Sort by:</span>
          <Select value={sortOrder} onValueChange={setSortOrder}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort order" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedReports.map((report) => (
              <TableRow key={report.id}>
                <TableCell>{report.title}</TableCell>
                <TableCell>{report.category}</TableCell>
                <TableCell>{report.location}</TableCell>
                <TableCell>
                  <span className={getStatusClass(report.status)}>
                    {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <ContextMenu>
                    <ContextMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                      <ContextMenuItem onClick={() => handleViewReport(report)}>
                        <Edit className="mr-2 h-4 w-4" /> View
                      </ContextMenuItem>
                      <ContextMenuItem>
                        <Copy className="mr-2 h-4 w-4" /> Copy Report ID
                      </ContextMenuItem>
                      <ContextMenuItem>
                        <Trash className="mr-2 h-4 w-4" /> Delete
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                </TableCell>
              </TableRow>
            ))}
            {sortedReports.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  No reports found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* View Report Dialog */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Report Details</DialogTitle>
            <DialogDescription>
              View and manage the details of the selected report.
            </DialogDescription>
          </DialogHeader>
          {selectedReport && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Title</Label>
                  <Input type="text" value={selectedReport.title} readOnly />
                </div>
                <div>
                  <Label>Category</Label>
                  <Input type="text" value={selectedReport.category} readOnly />
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={selectedReport.description} readOnly className="min-h-[100px]" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Location</Label>
                  <Input type="text" value={selectedReport.location} readOnly />
                </div>
                <div>
                  <Label>Reported By</Label>
                  <Input type="text" value={selectedReport.reporterName || 'Anonymous'} readOnly />
                </div>
              </div>
              <div>
                <Label>Reported At</Label>
                <Input
                  type="text"
                  value={selectedReport.createdAt ? formatDistanceToNow(new Date(selectedReport.createdAt), { addSuffix: true }) : 'Recently'}
                  readOnly
                />
              </div>
              {selectedReport.imageUrl && (
                <div>
                  <Label>Image</Label>
                  <img src={selectedReport.imageUrl} alt="Report" className="w-full rounded-md" />
                </div>
              )}
              <div>
                <Label>Status</Label>
                <Select
                  value={selectedReport.status}
                  onValueChange={(value) => selectedReport && handleUpdateStatus(selectedReport.id, value as 'submitted' | 'in-progress' | 'resolved')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="mt-4">
                <Label>Comments</Label>
                <div className="border rounded-md p-4 mb-4 bg-gray-50">
                  <CommentsList comments={comments} isLoading={loadingComments} />
                </div>
                
                <Label htmlFor="comment">Add a comment</Label>
                <Textarea
                  placeholder="Add a comment..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                />
                <Button 
                  className="mt-2 bg-campus-primary hover:bg-campus-primary/90"
                  disabled={!comment.trim() || submittingComment}
                  onClick={handleCommentSubmit}
                >
                  {submittingComment ? "Submitting..." : "Submit Comment"}
                </Button>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="secondary" onClick={handleCloseViewModal}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
