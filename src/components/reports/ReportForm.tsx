
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, MapPin, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@supabase/supabase-js';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create Supabase client only if both URL and key are available
let supabase: any = null;
const isMissingSupabaseConfig = !supabaseUrl || !supabaseAnonKey;

if (!isMissingSupabaseConfig) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

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

  // Check Supabase configuration on component mount
  useEffect(() => {
    if (isMissingSupabaseConfig) {
      toast({
        title: "Configuration Error",
        description: "Supabase configuration is missing. Please contact the administrator.",
        variant: "destructive",
      });
    }
  }, [toast]);

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
    // Create a hidden input element to trigger camera
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment'; // This opens the camera directly on mobile devices
    
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

  const sendNotificationToAdmin = async (reportId: string, reportInfo: any) => {
    if (isMissingSupabaseConfig) return;
    
    try {
      // Save notification to Supabase
      const { data, error } = await supabase
        .from('notifications')
        .insert([
          { 
            recipient: 'admin',
            type: 'new_report',
            read: false,
            title: `New report: ${reportInfo.title}`,
            content: `A new report has been submitted by ${reportInfo.reporter_name}`,
            report_id: reportId,
            user_id: reportInfo.reported_by
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
    
    if (isMissingSupabaseConfig) {
      toast({
        title: "Configuration Error",
        description: "Supabase configuration is missing. Please contact the administrator.",
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
      
      // Upload image to Supabase storage if provided
      if (image) {
        const fileName = `${Date.now()}_${image.name}`;
        const { data: fileData, error: uploadError } = await supabase
          .storage
          .from('report_images')
          .upload(`reports/${currentUser?.uid}/${fileName}`, image);
        
        if (uploadError) {
          throw uploadError;
        }
        
        // Get the public URL for the uploaded image
        const { data: { publicUrl } } = supabase
          .storage
          .from('report_images')
          .getPublicUrl(`reports/${currentUser?.uid}/${fileName}`);
          
        imageUrl = publicUrl;
      }
      
      // Create report object
      const newReport = {
        title,
        description,
        category,
        location,
        image_url: imageUrl,
        status: 'submitted',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        reported_by: currentUser?.uid,
        reporter_name: currentUser?.displayName,
        reporter_email: currentUser?.email,
      };
      
      // Save report to Supabase
      const { data: savedReports, error: reportError } = await supabase
        .from('reports')
        .insert([newReport])
        .select();
      
      if (reportError) {
        throw reportError;
      }
      
      // Send notification to admin
      if (savedReports && savedReports.length > 0) {
        await sendNotificationToAdmin(savedReports[0].id, savedReports[0]);
      }
      
      toast({
        title: "Report submitted",
        description: "Your issue has been reported successfully!",
      });
      
      // Redirect to the user reports page
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
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Issue Title</Label>
              <Input
                id="title"
                placeholder="Brief title of the issue"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={isMissingSupabaseConfig}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Category</Label>
              <RadioGroup 
                value={category} 
                onValueChange={setCategory} 
                className="grid grid-cols-2 gap-2"
                disabled={isMissingSupabaseConfig}
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
                disabled={isMissingSupabaseConfig}
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
                  disabled={isMissingSupabaseConfig}
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  className="ml-2"
                  disabled={isMissingSupabaseConfig}
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Map
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="image">Attach Photo (Optional)</Label>
              <div className={`flex flex-col items-center justify-center border-2 border-dashed ${isMissingSupabaseConfig ? 'border-gray-200' : 'border-gray-300'} rounded-lg p-6 cursor-pointer hover:border-primary transition-colors ${isMissingSupabaseConfig ? 'opacity-60' : ''}`}>
                <input
                  type="file"
                  id="image"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  disabled={isMissingSupabaseConfig}
                />
                <label htmlFor="image" className={`cursor-pointer ${isMissingSupabaseConfig ? 'cursor-not-allowed' : ''}`}>
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
                  disabled={isMissingSupabaseConfig}
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
                disabled={isSubmitting || isMissingSupabaseConfig}
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
