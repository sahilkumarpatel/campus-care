
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ReportLocationFieldProps {
  location: string;
  setLocation: (location: string) => void;
  disabled: boolean;
  error?: string;
}

export const ReportLocationField: React.FC<ReportLocationFieldProps> = ({
  location,
  setLocation,
  disabled,
  error
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="location" className="flex items-center">
        Location <span className="text-red-500 ml-1">*</span>
      </Label>
      <Input
        id="location"
        placeholder="Where is this issue located?"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        disabled={disabled}
        className={error ? "border-red-500" : ""}
      />
      {error && (
        <p className="text-sm font-medium text-red-500">{error}</p>
      )}
    </div>
  );
};
