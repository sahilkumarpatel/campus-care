
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, MapPin, AlertCircle, ShieldAlert, Info } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import supabase, { isSupabaseConfigured } from '@/lib/supabase';

const categories = [
  { value: 'parking', label: 'Parking Issue' },
  { value: 'infrastructure', label: 'Infrastructure' },
  { value: 'electrical', label: 'Electrical Problem' },
  { value: 'sanitation', label: 'Sanitation' },
  { value: 'other', label: 'Other' }
];

const ReportForm = () => {
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

  const isMissingSupabaseConfig = !isSupabaseConfigured;

  useEffect(() => {
    if (isMissingSupabaseConfig) {
      toast({
        title: "Configuration Error",
        description: "Supabase API key is missing. Please set the VITE_SUPABASE_ANON_KEY environment variable.",
        variant: "destructive",
      });
    }
  }, [toast, isMissingSupabaseConfig]);

  // Check if tables exist on component mount
  useEffect(() => {
    const checkTablesExist = async () => {
      try {
        // Check if the reports table exists
        const { count, error } = await supabase
          .from('reports')
          .select('*', { count: 'exact', head: true });
        
        if (error && error.message.includes('relation "reports" does not exist')) {
          setTableError(true);
        }
      } catch (error) {
        console.error('Error checking tables:', error);
      }
    };

    if (isSupabaseConfigured) {
      checkTablesExist();
    }
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const takePicture = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    
    input.onchange = (e: any) => {
      const file = e.target?.files?.[0];
      if (file) {
        setImage(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    };
    
    input.click();
  };

  const sendNotificationToAdmin = async (reportId: string, report: any) => {
    if (isMissingSupabaseConfig) return;
    
    try {
      // First check if notifications table exists
      const { error: checkError } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true });
      
      if (checkError && checkError.message.includes('relation "notifications" does not exist')) {
        console.error('Notifications table does not exist');
        return;
      }
      
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
      }
    } catch (error) {
      console.error('Failed to send admin notification:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRlsError(false);
    
    if (isMissingSupabaseConfig) {
      toast({
        title: "Configuration Error",
        description: "Supabase API key is missing. Please set the VITE_SUPABASE_ANON_KEY environment variable.",
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
          throw new Error('The reports table does not exist in the database. Please create it in your Supabase dashboard.');
        }
        
        // Row-Level Security policy error
        if (reportError.message && (
            reportError.message.includes('row-level security policy') || 
            reportError.message.includes('new row violates row-level security')
          )) {
          setRlsError(true);
          throw new Error('Permission denied: Row-level security policy violation. Contact administrator to set up proper permissions.');
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

  return (
    <div className="container mx-auto max-w-2xl pt-20">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Report an Issue</CardTitle>
          <CardDescription>
            Fill in the details to report a problem on campus.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isMissingSupabaseConfig && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Configuration Error</AlertTitle>
              <AlertDescription>
                Supabase configuration is missing. Please contact the administrator to set up the required environment variables.
              </AlertDescription>
            </Alert>
          )}
          
          {tableError && (
            <Alert variant="destructive" className="mb-6">
              <Info className="h-4 w-4" />
              <AlertTitle>Database Setup Required</AlertTitle>
              <AlertDescription>
                <p>The required database tables don't exist. Please create the following tables in your Supabase dashboard:</p>
                <ol className="list-decimal ml-5 mt-2 space-y-1">
                  <li><strong>reports</strong> table with columns: id, title, description, category, location, image_url, status, created_at, updated_at, reported_by, reporter_name, reporter_email</li>
                  <li><strong>notifications</strong> table with columns: id, recipient, type, read, title, content, report_id, user_id, created_at</li>
                </ol>
              </AlertDescription>
            </Alert>
          )}
          
          {rlsError && (
            <Alert variant="destructive" className="mb-6">
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle>Permission Error</AlertTitle>
              <AlertDescription>
                <p>You don't have permission to submit reports. The Supabase database needs Row-Level Security (RLS) policies 
                configured to allow insertions. Please go to your Supabase dashboard and add the following RLS policy for the reports table:</p>
                <pre className="bg-gray-100 p-2 rounded mt-2 text-xs overflow-auto">
                  CREATE POLICY "Enable inserts for authenticated users" ON reports<br/>
                  FOR INSERT TO authenticated, anon<br/>
                  WITH CHECK (true);
                </pre>
                <p className="mt-2">Or for public access:</p>
                <pre className="bg-gray-100 p-2 rounded mt-2 text-xs overflow-auto">
                  CREATE POLICY "Enable public inserts" ON reports<br/>
                  FOR INSERT TO anon<br/>
                  WITH CHECK (true);
                </pre>
              </AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Issue Title</Label>
              <Input
                id="title"
                placeholder="Brief title of the issue"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={isMissingSupabaseConfig || tableError || rlsError}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Category</Label>
              <RadioGroup 
                value={category} 
                onValueChange={setCategory} 
                className="grid grid-cols-2 gap-2"
                disabled={isMissingSupabaseConfig || tableError || rlsError}
              >
                {categories.map((cat) => (
                  <div key={cat.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={cat.value} id={cat.value} />
                    <Label htmlFor={cat.value} className="cursor-pointer">{cat.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Detailed description of the issue..."
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                disabled={isMissingSupabaseConfig || tableError || rlsError}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <div className="flex">
                <Input
                  id="location"
                  placeholder="Building name, room number, etc."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                  className="flex-1"
                  disabled={isMissingSupabaseConfig || tableError || rlsError}
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  className="ml-2"
                  disabled={isMissingSupabaseConfig || tableError || rlsError}
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Map
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="image">Attach Photo (Optional)</Label>
              <div className={`flex flex-col items-center justify-center border-2 border-dashed ${isMissingSupabaseConfig || tableError || rlsError ? 'border-gray-200' : 'border-gray-300'} rounded-lg p-6 cursor-pointer hover:border-primary transition-colors ${isMissingSupabaseConfig || tableError || rlsError ? 'opacity-60' : ''}`}>
                <input
                  type="file"
                  id="image"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  disabled={isMissingSupabaseConfig || tableError || rlsError}
                />
                <label htmlFor="image" className={`cursor-pointer ${isMissingSupabaseConfig || tableError || rlsError ? 'cursor-not-allowed' : ''}`}>
                  {imagePreview ? (
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="max-h-64 rounded-lg object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center">
                      <Camera className="h-12 w-12 text-muted-foreground mb-2" />
                      <span className="text-muted-foreground">Click to upload or take a photo</span>
                    </div>
                  )}
                </label>
              </div>
              <div className="flex justify-center mt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={takePicture}
                  className="flex items-center"
                  disabled={isMissingSupabaseConfig || tableError || rlsError}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Take Photo
                </Button>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/dashboard')}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-campus-primary hover:bg-campus-primary/90"
                disabled={isSubmitting || isMissingSupabaseConfig || tableError || rlsError}
              >
                {isSubmitting ? "Submitting..." : "Submit Report"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportForm;
