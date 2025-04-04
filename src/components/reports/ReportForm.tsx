
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, MapPin, Upload } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { db, storage } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
      
      // Upload image if provided
      if (image) {
        const storageRef = ref(storage, `reports/${currentUser?.uid}/${Date.now()}_${image.name}`);
        const snapshot = await uploadBytes(storageRef, image);
        imageUrl = await getDownloadURL(snapshot.ref);
      }
      
      // Save report to Firestore
      await addDoc(collection(db, 'reports'), {
        title,
        description,
        category,
        location,
        imageUrl,
        status: 'submitted',
        createdAt: serverTimestamp(),
        reportedBy: currentUser?.uid,
        reporterName: currentUser?.displayName,
        reporterEmail: currentUser?.email,
      });
      
      toast({
        title: "Report submitted",
        description: "Your issue has been reported successfully!",
      });
      
      navigate('/my-reports');
    } catch (error) {
      console.error('Error submitting report:', error);
      toast({
        title: "Error",
        description: "Failed to submit report. Please try again.",
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
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Issue Title</Label>
              <Input
                id="title"
                placeholder="Brief title of the issue"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label>Category</Label>
              <RadioGroup value={category} onValueChange={setCategory} className="grid grid-cols-2 gap-2">
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
                />
                <Button type="button" variant="outline" className="ml-2">
                  <MapPin className="h-4 w-4 mr-2" />
                  Map
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="image">Attach Photo (Optional)</Label>
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-primary transition-colors">
                <input
                  type="file"
                  id="image"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <label htmlFor="image" className="cursor-pointer">
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
                disabled={isSubmitting}
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
