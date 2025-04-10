
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { isSupabaseConfigured } from '@/lib/supabase';

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
  const [bucketChecked, setBucketChecked] = useState(false);
  const [isMissingSupabaseConfig, setIsMissingSupabaseConfig] = useState(!isSupabaseConfigured);

  // Function to check if the bucket exists - using useCallback to prevent recreating the function on each render
  const checkBucketExists = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    
    try {
      console.log('Checking if report123 bucket exists...');
      setBucketChecked(false);
      
      // First try direct access to the bucket
      const { data: objects, error: objectsError } = await supabase
        .storage
        .from('report123')
        .list('', { limit: 1 });
      
      if (!objectsError) {
        console.log('Successfully accessed report123 bucket');
        setStorageError(false);
        setBucketChecked(true);
        return;
      }
      
      // Fallback to listing all buckets
      const { data: buckets, error } = await supabase
        .storage
        .listBuckets();
      
      if (error) {
        console.error('Error listing buckets:', error);
        setStorageError(true);
        setBucketChecked(true);
        return;
      }
      
      console.log('Available buckets:', buckets);
      const bucketExists = buckets?.some(bucket => bucket.name === 'report123');
      
      setStorageError(!bucketExists);
      setBucketChecked(true);
      
      if (!bucketExists) {
        toast({
          title: "Storage Error",
          description: "The 'report123' storage bucket does not exist.",
          variant: "destructive",
        });
      } else {
        console.log('report123 bucket exists!');
        // Clear any previous storage error
        setStorageError(false);
      }
    } catch (error) {
      console.error('Error checking bucket:', error);
      setStorageError(true);
      setBucketChecked(true);
    }
  }, [toast, isSupabaseConfigured]);
  
  // Check if bucket exists on component mount
  useEffect(() => {
    checkBucketExists();
  }, [checkBucketExists]);
  
  // Function to manually refresh bucket check
  const refreshBucketCheck = async () => {
    setBucketChecked(false);
    setStorageError(true); // Set to true initially, will be updated in checkBucketExists
    toast({
      title: "Checking storage bucket",
      description: "Verifying access to the report123 bucket...",
    });
    await checkBucketExists();
  };

  const sendNotificationToAdmin = async (reportId: string, report: any) => {
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
    
    if (!title || !description || !category || !location) {
      toast({
        title: "Missing fields",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    // If bucket hasn't been checked yet, check it before proceeding
    if (!bucketChecked) {
      await checkBucketExists();
    }
    
    // If still has storage error after check, try one more time
    if (storageError) {
      toast({
        title: "Verifying storage access",
        description: "Checking access to the storage bucket before submission...",
      });
      await refreshBucketCheck();
      
      // If still has error after refresh, prevent submission
      if (storageError) {
        toast({
          title: "Storage Access Failed",
          description: "Cannot access the storage bucket. Please verify it exists in your Supabase dashboard.",
          variant: "destructive",
        });
        return;
      }
    }

    setIsSubmitting(true);
    
    try {
      let imageUrl = null;
      
      if (image) {
        const fileName = `${Date.now()}_${image.name}`;
        const filePath = `reports/${currentUser?.uid || 'anonymous'}/${fileName}`;
        
        try {
          const { data: fileData, error: uploadError } = await supabase
            .storage
            .from('report123')
            .upload(filePath, image);
          
          if (uploadError) {
            console.error('Error uploading image:', uploadError);
            if (uploadError.message.includes('bucket not found') || uploadError.message.includes('The resource was not found')) {
              setStorageError(true);
              throw new Error("Storage bucket 'report123' not found. Please create it in your Supabase dashboard.");
            }
            throw uploadError;
          }
          
          // Get public URL only if upload succeeds
          const { data: { publicUrl } } = supabase
            .storage
            .from('report123')
            .getPublicUrl(filePath);
            
          imageUrl = publicUrl;
          console.log('Image uploaded successfully:', imageUrl);
        } catch (imageError: any) {
          console.error('Image upload failed:', imageError);
          toast({
            title: "Image Upload Failed",
            description: imageError.message || "Failed to upload image. Your report will be submitted without an image.",
            variant: "destructive",
          });
          // Continue without image
        }
      }
      
      // Using the current Supabase API
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (currentUser && !user) {
          // If user exists in Firebase but not in Supabase, sign in anonymously
          console.log('Signing in anonymously to Supabase');
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
      
      console.log('Submitting report:', newReport);
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
        console.log('Report saved successfully:', savedReports[0]);
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
    handleSubmit,
    refreshBucketCheck
  };
};
