
import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface FormActionsProps {
  isSubmitting: boolean;
  disabled: boolean;
}

export const FormActions: React.FC<FormActionsProps> = ({
  isSubmitting,
  disabled
}) => {
  const navigate = useNavigate();
  
  return (
    <div className="flex justify-end space-x-2">
      <Button
        type="button"
        variant="outline"
        onClick={() => navigate('/dashboard')}
        disabled={isSubmitting}
      >
        Cancel
      </Button>
      <Button 
        type="submit" 
        className="bg-campus-primary hover:bg-campus-primary/90"
        disabled={isSubmitting || disabled}
      >
        {isSubmitting ? "Submitting..." : "Submit Report"}
      </Button>
    </div>
  );
};
