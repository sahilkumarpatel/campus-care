
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormItem, FormDescription, FormMessage } from '@/components/ui/form';

interface ReportTitleFieldProps {
  title: string;
  setTitle: (title: string) => void;
  disabled: boolean;
  error?: string;
}

export const ReportTitleField: React.FC<ReportTitleFieldProps> = ({
  title,
  setTitle,
  disabled,
  error
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="title" className="flex items-center">
        Issue Title <span className="text-red-500 ml-1">*</span>
      </Label>
      <Input
        id="title"
        placeholder="Brief title of the issue"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        disabled={disabled}
        className={error ? "border-red-500" : ""}
      />
      {error && (
        <p className="text-sm font-medium text-red-500">{error}</p>
      )}
    </div>
  );
};
