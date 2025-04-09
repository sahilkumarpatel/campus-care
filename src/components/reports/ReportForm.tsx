
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
    handleSubmit
  } = useReportSubmission();

  // Determine if form fields should be disabled
  const formDisabled = isMissingSupabaseConfig || tableError || rlsError || storageError || isSubmitting;

  return (
    <div className="container mx-auto max-w-2xl pt-20">
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
          />
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <ReportTitleField 
              title={title}
              setTitle={setTitle}
              disabled={formDisabled}
            />
            
            <ReportCategoryField
              categories={categories}
              category={category}
              setCategory={setCategory}
              disabled={formDisabled}
            />
            
            <ReportDescriptionField
              description={description}
              setDescription={setDescription}
              disabled={formDisabled}
            />
            
            <ReportLocationField
              location={location}
              setLocation={setLocation}
              disabled={formDisabled}
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
