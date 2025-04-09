
import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Camera } from 'lucide-react';

interface ReportImageFieldProps {
  image: File | null;
  setImage: (image: File | null) => void;
  imagePreview: string | null;
  setImagePreview: (preview: string | null) => void;
  disabled: boolean;
}

export const ReportImageField: React.FC<ReportImageFieldProps> = ({
  image,
  setImage,
  imagePreview,
  setImagePreview,
  disabled
}) => {
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

  return (
    <div className="space-y-2">
      <Label htmlFor="image">Attach Photo (Optional)</Label>
      <div className={`flex flex-col items-center justify-center border-2 border-dashed ${disabled ? 'border-gray-200' : 'border-gray-300'} rounded-lg p-6 cursor-pointer hover:border-primary transition-colors ${disabled ? 'opacity-60' : ''}`}>
        <input
          type="file"
          id="image"
          accept="image/*"
          onChange={handleImageChange}
          className="hidden"
          disabled={disabled}
        />
        <label htmlFor="image" className={`cursor-pointer ${disabled ? 'cursor-not-allowed' : ''}`}>
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
          disabled={disabled}
        >
          <Camera className="h-4 w-4 mr-2" />
          Take Photo
        </Button>
      </div>
    </div>
  );
};
