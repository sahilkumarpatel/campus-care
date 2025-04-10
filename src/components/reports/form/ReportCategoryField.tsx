
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ReportCategoryFieldProps {
  categories: string[];
  category: string;
  setCategory: (category: string) => void;
  disabled: boolean;
  error?: string;
}

export const ReportCategoryField: React.FC<ReportCategoryFieldProps> = ({
  categories,
  category,
  setCategory,
  disabled,
  error
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="category" className="flex items-center">
        Category <span className="text-red-500 ml-1">*</span>
      </Label>
      <Select
        value={category}
        onValueChange={setCategory}
        disabled={disabled}
      >
        <SelectTrigger id="category" className={error ? "border-red-500" : ""}>
          <SelectValue placeholder="Select a category" />
        </SelectTrigger>
        <SelectContent>
          {categories.map((cat) => (
            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && (
        <p className="text-sm font-medium text-red-500">{error}</p>
      )}
    </div>
  );
};
