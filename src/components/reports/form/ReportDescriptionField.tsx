
import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface ReportDescriptionFieldProps {
  description: string;
  setDescription: (description: string) => void;
  disabled: boolean;
  error?: string;
}

export const ReportDescriptionField: React.FC<ReportDescriptionFieldProps> = ({
  description,
  setDescription,
  disabled,
  error
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="description" className="flex items-center">
        Description <span className="text-red-500 ml-1">*</span>
      </Label>
      <Textarea
        id="description"
        placeholder="Provide details about the issue..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={4}
        disabled={disabled}
        className={error ? "border-red-500" : ""}
      />
      {error && (
        <p className="text-sm font-medium text-red-500">{error}</p>
      )}
    </div>
  );
};
