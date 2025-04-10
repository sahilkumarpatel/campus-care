
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { ReportTitleField } from './form/ReportTitleField';
import { ReportCategoryField } from './form/ReportCategoryField';
import { ReportDescriptionField } from './form/ReportDescriptionField';
import { ReportLocationField } from './form/ReportLocationField';
import { ReportImageField } from './form/ReportImageField';
import { FormActions } from './form/FormActions';
import { FormErrorAlerts } from './form/FormErrorAlerts';
import { useReportSubmission } from './form/useReportSubmission';
import { categories } from './form/ReportFormConfig';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';

const ReportForm = () => {
  const {
    title,
    setTitle,
    description,
    setDescription,
    category,
    setCategory,
    location,
    setLocation,
    image,
    setImage,
    imagePreview,
    setImagePreview,
    isSubmitting,
    rlsError,
    tableError,
    storageError,
    isMissingSupabaseConfig,
    handleSubmit,
    refreshBucketCheck
  } = useReportSubmission();

  const [validationErrors, setValidationErrors] = React.useState<{
    title?: string;
    category?: string;
    description?: string;
    location?: string;
  }>({});

  // Determine if form fields should be disabled
  const formDisabled = isMissingSupabaseConfig || tableError || rlsError || storageError || isSubmitting;

  // Form validation handler
  const validateForm = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: any = {};
    
    if (!title.trim()) {
      errors.title = "Title is required";
    }
    
    if (!category) {
      errors.category = "Please select a category";
    }
    
    if (!description.trim()) {
      errors.description = "Description is required";
    }
    
    if (!location.trim()) {
      errors.location = "Location is required";
    }
    
    setValidationErrors(errors);
    
    if (Object.keys(errors).length === 0) {
      handleSubmit(e);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl pt-20 pb-10">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Report an Issue</CardTitle>
          <CardDescription>
            Fill in the details to report a problem on campus.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormErrorAlerts
            isMissingSupabaseConfig={isMissingSupabaseConfig}
            tableError={tableError}
            rlsError={rlsError}
            storageError={storageError}
            onRefreshBucketCheck={refreshBucketCheck}
          />
          
          {!formDisabled && (
            <Alert className="mb-6 bg-gray-50">
              <InfoIcon className="h-4 w-4" />
              <AlertDescription>
                All fields marked with * are required. Images are optional but help in identifying the issue.
              </AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={validateForm} className="space-y-6">
            <ReportTitleField 
              title={title}
              setTitle={setTitle}
              disabled={formDisabled}
              error={validationErrors.title}
            />
            
            <ReportCategoryField
              categories={categories}
              category={category}
              setCategory={setCategory}
              disabled={formDisabled}
              error={validationErrors.category}
            />
            
            <ReportDescriptionField
              description={description}
              setDescription={setDescription}
              disabled={formDisabled}
              error={validationErrors.description}
            />
            
            <ReportLocationField
              location={location}
              setLocation={setLocation}
              disabled={formDisabled}
              error={validationErrors.location}
            />
            
            <ReportImageField
              image={image}
              setImage={setImage}
              imagePreview={imagePreview}
              setImagePreview={setImagePreview}
              disabled={formDisabled}
            />
            
            <FormActions
              isSubmitting={isSubmitting}
              disabled={formDisabled}
            />
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportForm;
