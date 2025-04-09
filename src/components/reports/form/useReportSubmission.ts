
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import supabase, { isSupabaseConfigured } from '@/lib/supabase';

export const useReportSubmission = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rlsError, setRlsError] = useState(false);
  const [tableError, setTableError] = useState(false);
  const [storageError, setStorageError] = useState(false);

  const isMissingSupabaseConfig = !isSupabaseConfigured;

  // Check if bucket exists on component mount
  useEffect(() => {
    const checkBucketExists = async () => {
      try {
        const { data: buckets, error } = await supabase
          .storage
          .listBuckets();
        
        const bucketExists = buckets?.some(bucket => bucket.name === 'report123');
        if (!bucketExists) {
          setStorageError(true);
          toast({
            title: "Storage Error",
            description: "The 'report123' storage bucket does not exist.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error checking bucket:', error);
      }
    };

    if (isSupabaseConfigured) {
      checkBucketExists();
    }
  }, [toast]);
  
  useEffect(() => {
    if (isMissingSupabaseConfig) {
      toast({
        title: "Configuration Error",
        description: "Supabase API key is missing. Please set the VITE_SUPABASE_ANON_KEY environment variable.",
        variant: "destructive",
      });
    }
  }, [toast, isMissingSupabaseConfig]);

  const sendNotificationToAdmin = async (reportId: string, report: any) => {
    if (isMissingSupabaseConfig) return;
    
    try {
      // First check if notifications table exists
      const { data, error } = await supabase
        .from('notifications')
        .insert([
          { 
            recipient: 'admin',
            type: 'new_report',
            read: false,
            title: `New report: ${report.title}`,
            content: `A new report has been submitted by ${report.reporter_name || 'a user'}`,
            report_id: reportId,
            user_id: report.reported_by
          }
        ]);
        
      if (error) {
        console.error('Error sending notification:', error);
        if (error.message.includes('relation "notifications" does not exist')) {
          console.warn('Notifications table does not exist. Skipping notification.');
        }
      } else {
        console.log('Notification sent to admin');
      }
    } catch (error) {
      console.error('Failed to send admin notification:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRlsError(false);
    setTableError(false);
    setStorageError(false);
    
    if (isMissingSupabaseConfig) {
      toast({
        title: "Configuration Error",
        description: "Supabase API key is missing.",
        variant: "destructive",
      });
      return;
    }
    
    if (!title || !description || !category || !location) {
      toast({
        title: "Missing fields",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      let imageUrl = null;
      
      if (image) {
        const fileName = `${Date.now()}_${image.name}`;
        const { data: fileData, error: uploadError } = await supabase
          .storage
          .from('report123')
          .upload(`reports/${currentUser?.uid || 'anonymous'}/${fileName}`, image);
        
        if (uploadError) {
          console.error('Error uploading image:', uploadError);
          if (uploadError.message.includes('bucket not found')) {
            setStorageError(true);
            toast({
              title: "Storage Error",
              description: "The storage bucket 'report123' does not exist. Please create it in your Supabase dashboard.",
              variant: "destructive",
            });
            setIsSubmitting(false);
            return;
          }
          throw uploadError;
        }
        
        const { data: { publicUrl } } = supabase
          .storage
          .from('report123')
          .getPublicUrl(`reports/${currentUser?.uid || 'anonymous'}/${fileName}`);
          
        imageUrl = publicUrl;
      }
      
      // Using the current Supabase API
      try {
        if (currentUser && !await supabase.auth.getUser()) {
          // If user exists in Firebase but not in Supabase, sign in anonymously
          await supabase.auth.signInAnonymously();
        }
      } catch (authError) {
        console.error("Auth error:", authError);
        // Continue without authentication - relying on RLS policies for public access
      }
      
      const newReport = {
        title,
        description,
        category,
        location,
        image_url: imageUrl,
        status: 'submitted',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        reported_by: currentUser?.uid || 'anonymous',
        reporter_name: currentUser?.displayName || 'Anonymous User',
        reporter_email: currentUser?.email || 'no-email@example.com',
      };
      
      const { data: savedReports, error: reportError } = await supabase
        .from('reports')
        .insert([newReport])
        .select();
      
      if (reportError) {
        console.error('Error inserting report:', reportError);
        
        // Table doesn't exist error
        if (reportError.message && reportError.message.includes('relation "reports" does not exist')) {
          setTableError(true);
          throw new Error('The reports table does not exist in the database.');
        }
        
        // Row-Level Security policy error
        if (reportError.message && (
            reportError.message.includes('row-level security policy') || 
            reportError.message.includes('new row violates row-level security')
          )) {
          setRlsError(true);
          throw new Error('Permission denied: Row-level security policy violation.');
        }
        
        throw reportError;
      }
      
      if (savedReports && savedReports.length > 0) {
        await sendNotificationToAdmin(savedReports[0].id, savedReports[0]);
      }
      
      toast({
        title: "Report submitted",
        description: "Your issue has been reported successfully!",
      });
      
      navigate('/my-reports');
    } catch (error: any) {
      console.error('Error submitting report:', error);
      toast({
        title: "Error",
        description: `Failed to submit report: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    title,
    setTitle,
    description,
    setDescription,
    category,
    setCategory,
    location,
    setLocation,
    image,
    setImage,
    imagePreview,
    setImagePreview,
    isSubmitting,
    rlsError,
    tableError,
    storageError,
    isMissingSupabaseConfig,
    handleSubmit
  };
};
