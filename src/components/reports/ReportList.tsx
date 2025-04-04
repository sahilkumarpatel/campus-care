
import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs, CollectionReference, Query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import ReportCard, { ReportType } from './ReportCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, FilterX } from 'lucide-react';

interface ReportListProps {
  isAdminView?: boolean;
}

const ReportList: React.FC<ReportListProps> = ({ isAdminView = false }) => {
  const { currentUser } = useAuth();
  const [reports, setReports] = useState<ReportType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        
        // Create base collection reference
        const reportsCollectionRef = collection(db, 'reports');
        
        // Create appropriate query based on view type
        let reportsQuery: Query;
        
        if (!isAdminView && currentUser) {
          // For user view, filter by current user
          reportsQuery = query(
            reportsCollectionRef, 
            where('reportedBy', '==', currentUser.uid),
            orderBy('createdAt', 'desc')
          );
        } else if (isAdminView) {
          // For admin view, just order by createdAt
          reportsQuery = query(
            reportsCollectionRef,
            orderBy('createdAt', 'desc')
          );
        } else {
          // Default query if no conditions met
          reportsQuery = query(reportsCollectionRef, orderBy('createdAt', 'desc'));
        }
        
        const querySnapshot = await getDocs(reportsQuery);
        
        const fetchedReports: ReportType[] = [];
        querySnapshot.forEach((doc) => {
          fetchedReports.push({
            id: doc.id,
            ...doc.data()
          } as ReportType);
        });
        
        setReports(fetchedReports);
      } catch (err) {
        console.error('Error fetching reports:', err);
        setError('Failed to load reports. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchReports();
  }, [currentUser, isAdminView]);

  // Apply filters to reports
  const filteredReports = reports.filter(report => {
    // Apply search term filter
    const matchesSearch = 
      report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.location.toLowerCase().includes(searchTerm.toLowerCase());
      
    // Apply status filter
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-campus-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-campus-error">{error}</p>
        <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="pt-16 pb-8">
      <div className="mb-6 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="w-full md:w-64 relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>
          <Input
            type="search"
            placeholder="Search reports..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-2">
            <Label htmlFor="status-filter" className="text-sm whitespace-nowrap">
              Filter by:
            </Label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-campus-primary focus:border-campus-primary block p-2"
            >
              <option value="all">All Status</option>
              <option value="submitted">Submitted</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
          {(searchTerm || statusFilter !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="text-muted-foreground"
            >
              <FilterX className="h-4 w-4 mr-1" />
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {filteredReports.length === 0 ? (
        <div className="text-center p-8 bg-white rounded-lg border border-gray-100 shadow-sm">
          <p className="text-muted-foreground">No reports found.</p>
          {!isAdminView && (
            <Button className="mt-4 bg-campus-primary hover:bg-campus-primary/90">
              Create New Report
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReports.map((report) => (
            <ReportCard 
              key={report.id} 
              report={report} 
              isAdminView={isAdminView} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ReportList;
