
import React from 'react';
import ReportList from '@/components/reports/ReportList';

const MyReports = () => {
  return (
    <div className="container mx-auto">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">My Reports</h1>
        <p className="text-muted-foreground">View and track all your submitted issue reports</p>
      </header>
      
      <ReportList />
    </div>
  );
};

export default MyReports;
