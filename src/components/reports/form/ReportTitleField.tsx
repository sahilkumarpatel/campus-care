
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ReportTitleFieldProps {
  title: string;
  setTitle: (title: string) => void;
  disabled: boolean;
}

export const ReportTitleField: React.FC<ReportTitleFieldProps> = ({
  title,
  setTitle,
  disabled
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="title">Issue Title</Label>
      <Input
        id="title"
        placeholder="Brief title of the issue"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        disabled={disabled}
      />
    </div>
  );
};
