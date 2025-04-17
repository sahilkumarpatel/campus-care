
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const Settings = () => {
  return (
    <div className="container mx-auto max-w-2xl pt-20">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your application preferences</p>
      </header>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Configure how you receive updates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-notifications">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive email updates about your reports
              </p>
            </div>
            <Switch id="email-notifications" defaultChecked />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="status-updates">Status Updates</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when your report status changes
              </p>
            </div>
            <Switch id="status-updates" defaultChecked />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="comments-notifications">Comments Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when someone comments on your report
              </p>
            </div>
            <Switch id="comments-notifications" defaultChecked />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
