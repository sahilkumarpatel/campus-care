import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import supabase, { toUUID } from '@/lib/supabase';
import CommentsList from '@/components/reports/comments/CommentsList';

const ReportDetail = () => {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentUser, isAdmin } = useAuth();
  
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [comment, setComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancellingReport, setCancellingReport] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  
  useEffect(() => {
    const fetchReport = async () => {
      if (!reportId) return;
      
      try {
        setLoading(true);
        
        // Try Supabase first
        const { data, error } = await supabase
          .from('reports')
          .select('*')
          .eq('id', reportId)
          .single();
          
        if (error) {
          // Fall back to Firebase
          const reportDoc = await getDoc(doc(db, 'reports', reportId));
          
          if (reportDoc.exists()) {
            setReport({
              id: reportDoc.id,
              ...reportDoc.data()
            });
          } else {
            setError('Report not found');
          }
        } else if (data) {
          // Transform Supabase data
          setReport({
            id: data.id,
            title: data.title,
            description: data.description,
            category: data.category,
            location: data.location,
            status: data.status,
            createdAt: new Date(data.created_at),
            reportedBy: data.reported_by,
            reporterName: data.reporter_name,
            reporterEmail: data.reporter_email,
            imageUrl: data.image_url
          });
        }
      } catch (err) {
        console.error('Error fetching report:', err);
        setError('Failed to load report details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchReport();
    if (reportId) {
      fetchComments();
      
      // Set up real-time subscription for comments
      const commentsChannel = supabase
        .channel('report_comments_changes')
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'report_comments',
          filter: `report_id=eq.${reportId}`
        }, () => {
          console.log('New comment received, refreshing comments');
          fetchComments();
        })
        .subscribe();
        
      // Set up real-time subscription for report status changes
      const reportChannel = supabase
        .channel('report_status_changes')
        .on('postgres_changes', { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'reports',
          filter: `id=eq.${reportId}`
        }, (payload) => {
          console.log('Report updated:', payload);
          if (payload.new && payload.new.status !== payload.old.status) {
            // Update the report status in the UI
            setReport(prev => ({
              ...prev,
              status: payload.new.status
            }));
            
            toast({
              title: "Status Updated",
              description: `This report has been marked as ${payload.new.status}`,
            });
          }
        })
        .subscribe();
        
      return () => {
        supabase.removeChannel(commentsChannel);
        supabase.removeChannel(reportChannel);
      };
    }
  }, [reportId, toast]);

  const fetchComments = async () => {
    if (!reportId) return;

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
      toast({
        title: "Error",
        description: "Failed to load comments",
        variant: "destructive"
      });
    } finally {
      setLoadingComments(false);
    }
  };

  const sendNotification = async (status: string) => {
    if (!report || !report.reportedBy) return;
    
    try {
      const notificationType = status === 'in-progress' ? 'status_update' : 'resolved';
      const notificationTitle = status === 'in-progress' 
        ? 'Your report is now in progress' 
        : 'Your report has been resolved';
      const notificationContent = status === 'in-progress'
        ? `Your report "${report.title}" is now being processed.`
        : `Your report "${report.title}" has been marked as resolved.`;
      
      // Create notification in Supabase
      await supabase
        .from('notifications')
        .insert({
          recipient: report.reportedBy,
          type: notificationType,
          title: notificationTitle,
          content: notificationContent,
          report_id: reportId,
          read: false
        });
      
      console.log('Notification sent successfully');
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!reportId) return;
    
    try {
      // Try updating in Supabase
      const { error } = await supabase
        .from('reports')
        .update({ status: newStatus })
        .eq('id', reportId);
        
      if (error) {
        // Fall back to Firebase
        await updateDoc(doc(db, 'reports', reportId), {
          status: newStatus
        });
      }
      
      setReport((prev: any) => ({
        ...prev,
        status: newStatus
      }));
      
      // Send notification to user when admin changes status to in-progress or resolved
      if (isAdmin && (newStatus === 'in-progress' || newStatus === 'resolved')) {
        await sendNotification(newStatus);
      }
      
      toast({
        title: "Status updated",
        description: `Report status updated to ${newStatus}`,
      });
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
    if (!reportId || !comment.trim() || !currentUser) return;
    
    try {
      setSubmittingComment(true);
      
      // Create the comment object
      const newComment = {
        report_id: reportId,
        content: comment.trim(),
        user_id: currentUser.uid,
        user_name: currentUser.displayName || 'Anonymous',
        is_admin: isAdmin || false,
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
      
      // Add the new comment to the state
      if (data && data.length > 0) {
        setComments(prev => [...prev, data[0]]);
      }
      
      // If admin is adding comment, notify the user
      if (isAdmin && report.reportedBy) {
        try {
          await supabase
            .from('notifications')
            .insert([{
              recipient: report.reportedBy,
              type: 'comment',
              title: 'New comment on your report',
              content: `An admin has commented on your report "${report.title}"`,
              report_id: reportId,
              user_id: report.reportedBy,
              read: false
            }]);
        } catch (notificationError) {
          console.error('Error sending notification:', notificationError);
          // Don't fail the comment submission if notification fails
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

  const handleCancelReport = async () => {
    if (!reportId || !cancelReason.trim()) return;
    
    try {
      setCancellingReport(true);
      
      // In a real app, you'd update the report status and add the cancellation reason
      // For demo purposes, we'll just show success toast
      
      toast({
        title: "Report cancelled",
        description: "Your report has been cancelled successfully",
      });
      
      setShowCancelDialog(false);
      setCancelReason('');
      
      // Navigate back to my reports after a brief delay
      setTimeout(() => {
        navigate('/my-reports');
      }, 1500);
    } catch (error) {
      console.error('Error cancelling report:', error);
      toast({
        title: "Error",
        description: "Failed to cancel report",
        variant: "destructive",
      });
      setCancellingReport(false);
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

  if (error || !report) {
    return (
      <div className="container mx-auto max-w-4xl pt-20 px-4">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-campus-error mb-4">{error || 'Report not found'}</p>
            <Button 
              onClick={() => navigate('/my-reports')}
              className="bg-campus-primary hover:bg-campus-primary/90"
            >
              View All Reports
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl pt-20 px-4">
      <Button 
        variant="ghost" 
        onClick={() => navigate(-1)}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader className="border-b">
              <div className="flex justify-between items-start">
                <CardTitle>{report.title}</CardTitle>
                <span className={getStatusClass(report.status)}>
                  {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Category</h3>
                <p>{report.category.charAt(0).toUpperCase() + report.category.slice(1)}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Description</h3>
                <p>{report.description}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Location</h3>
                <p>{report.location}</p>
              </div>
              
              {report.imageUrl && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Attached Photo</h3>
                  <img 
                    src={report.imageUrl} 
                    alt="Report" 
                    className="rounded-md mt-2 max-h-96 object-contain"
                  />
                </div>
              )}
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Reported By</h3>
                <p>{report.reporterName || 'Anonymous'}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Reported</h3>
                <p>
                  {report.createdAt 
                    ? formatDistanceToNow(new Date(report.createdAt), { addSuffix: true }) 
                    : 'Recently'}
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="mt-6">
            <CardHeader className="border-b">
              <CardTitle className="text-lg">Comments</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <CommentsList comments={comments} isLoading={loadingComments} />
              
              <div className="mt-4">
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
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-1">
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="text-lg">Status</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Current Status</h3>
                  <p className={`inline-block ${getStatusClass(report.status)} text-base`}>
                    {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                  </p>
                </div>
                
                {isAdmin && (
                  <div className="mt-6">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Update Status</h3>
                    <div className="space-y-2">
                      <Button 
                        variant="outline" 
                        className="w-full justify-start"
                        disabled={report.status === 'submitted'}
                        onClick={() => handleUpdateStatus('submitted')}
                      >
                        <span className="status-badge status-submitted mr-2">Submitted</span>
                        Mark as Submitted
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="w-full justify-start"
                        disabled={report.status === 'in-progress'}
                        onClick={() => handleUpdateStatus('in-progress')}
                      >
                        <span className="status-badge status-in-progress mr-2">In Progress</span>
                        Mark as In Progress
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="w-full justify-start"
                        disabled={report.status === 'resolved'}
                        onClick={() => handleUpdateStatus('resolved')}
                      >
                        <span className="status-badge status-resolved mr-2">Resolved</span>
                        Mark as Resolved
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="border-t bg-muted/20 flex justify-center">
              {!isAdmin && report.status !== 'resolved' && (
                <Button 
                  variant="outline" 
                  className="w-full mt-2 text-red-500 hover:text-red-600"
                  onClick={() => setShowCancelDialog(true)}
                >
                  Cancel Report
                </Button>
              )}
              {!isAdmin && report.status === 'resolved' && (
                <Button variant="outline" className="w-full mt-2">
                  Provide Feedback
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
      
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Report</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this report? This action will mark the report as withdrawn.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="cancel-reason">Reason for cancellation (optional)</Label>
            <Textarea
              id="cancel-reason"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Please provide a reason for cancelling this report"
              className="mt-2"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
              disabled={cancellingReport}
            >
              Keep Report
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelReport}
              disabled={cancellingReport}
            >
              {cancellingReport ? "Cancelling..." : "Cancel Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReportDetail;
