
import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface ReportDescriptionFieldProps {
  description: string;
  setDescription: (description: string) => void;
  disabled: boolean;
}

export const ReportDescriptionField: React.FC<ReportDescriptionFieldProps> = ({
  description,
  setDescription,
  disabled
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="description">Description</Label>
      <Textarea
        id="description"
        placeholder="Detailed description of the issue..."
        rows={4}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        required
        disabled={disabled}
      />
    </div>
  );
};
