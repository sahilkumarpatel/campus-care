
import React from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface Category {
  value: string;
  label: string;
}

interface ReportCategoryFieldProps {
  categories: Category[];
  category: string;
  setCategory: (category: string) => void;
  disabled: boolean;
}

export const ReportCategoryField: React.FC<ReportCategoryFieldProps> = ({
  categories,
  category,
  setCategory,
  disabled
}) => {
  return (
    <div className="space-y-2">
      <Label>Category</Label>
      <RadioGroup 
        value={category} 
        onValueChange={setCategory} 
        className="grid grid-cols-2 gap-2"
        disabled={disabled}
      >
        {categories.map((cat) => (
          <div key={cat.value} className="flex items-center space-x-2">
            <RadioGroupItem value={cat.value} id={cat.value} />
            <Label htmlFor={cat.value} className="cursor-pointer">{cat.label}</Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
};
