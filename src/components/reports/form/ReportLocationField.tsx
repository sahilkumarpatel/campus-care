
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';

interface ReportLocationFieldProps {
  location: string;
  setLocation: (location: string) => void;
  disabled: boolean;
}

export const ReportLocationField: React.FC<ReportLocationFieldProps> = ({
  location,
  setLocation,
  disabled
}) => {
  return (
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
          disabled={disabled}
        />
        <Button 
          type="button" 
          variant="outline" 
          className="ml-2"
          disabled={disabled}
        >
          <MapPin className="h-4 w-4 mr-2" />
          Map
        </Button>
      </div>
    </div>
  );
};
