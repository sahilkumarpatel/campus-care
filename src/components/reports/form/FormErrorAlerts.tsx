
import React from 'react';
import { AlertCircle, Info, ShieldAlert, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface FormErrorAlertsProps {
  isMissingSupabaseConfig: boolean;
  tableError: boolean;
  rlsError: boolean;
  storageError: boolean;
  onRefreshBucketCheck?: () => void;
}

export const FormErrorAlerts: React.FC<FormErrorAlertsProps> = ({
  isMissingSupabaseConfig,
  tableError,
  rlsError,
  storageError,
  onRefreshBucketCheck
}) => {
  return (
    <>
      {isMissingSupabaseConfig && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Configuration Error</AlertTitle>
          <AlertDescription>
            Supabase configuration is missing. Please contact the administrator to set up the required environment variables.
          </AlertDescription>
        </Alert>
      )}
      
      {tableError && (
        <Alert variant="destructive" className="mb-6">
          <Info className="h-4 w-4" />
          <AlertTitle>Database Setup Required</AlertTitle>
          <AlertDescription>
            <p>The required database tables don't exist. Please create the following tables in your Supabase dashboard:</p>
            <ol className="list-decimal ml-5 mt-2 space-y-1">
              <li><strong>reports</strong> table with columns: id, title, description, category, location, image_url, status, created_at, updated_at, reported_by, reporter_name, reporter_email</li>
              <li><strong>notifications</strong> table with columns: id, recipient, type, read, title, content, report_id, user_id, created_at</li>
            </ol>
          </AlertDescription>
        </Alert>
      )}
      
      {rlsError && (
        <Alert variant="destructive" className="mb-6">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Permission Error</AlertTitle>
          <AlertDescription>
            <p>You don't have permission to submit reports. The Supabase database needs Row-Level Security (RLS) policies 
            configured to allow insertions. Please go to your Supabase dashboard and add the following RLS policy for the reports table:</p>
            <pre className="bg-gray-100 p-2 rounded mt-2 text-xs overflow-auto">
              CREATE POLICY "Enable inserts for authenticated users" ON reports<br/>
              FOR INSERT TO authenticated, anon<br/>
              WITH CHECK (true);
            </pre>
            <p className="mt-2">Or for public access:</p>
            <pre className="bg-gray-100 p-2 rounded mt-2 text-xs overflow-auto">
              CREATE POLICY "Enable public inserts" ON reports<br/>
              FOR INSERT TO anon<br/>
              WITH CHECK (true);
            </pre>
          </AlertDescription>
        </Alert>
      )}
      
      {storageError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Storage Error</AlertTitle>
          <AlertDescription>
            <p>Unable to access the storage bucket 'report123'. If you've already created it, click the refresh button below:</p>
            
            {onRefreshBucketCheck && (
              <Button 
                variant="outline"
                size="sm"
                className="mt-2 flex items-center gap-1"
                onClick={onRefreshBucketCheck}
              >
                <RefreshCw className="h-3 w-3" />
                Refresh Bucket Check
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}
    </>
  );
};
