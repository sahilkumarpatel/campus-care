
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import ReportCard, { ReportType } from './ReportCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, FilterX } from 'lucide-react';
import supabase, { isSupabaseConfigured } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';

interface ReportListProps {
  isAdminView?: boolean;
  initialSearchTerm?: string;
  initialStatusFilter?: string;
  initialSortOrder?: string;
}

const ReportList: React.FC<ReportListProps> = ({ 
  isAdminView = false, 
  initialSearchTerm = '',
  initialStatusFilter = 'all',
  initialSortOrder = 'newest'
}) => {
  const { currentUser } = useAuth();
  const [reports, setReports] = useState<ReportType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [statusFilter, setStatusFilter] = useState<string>(initialStatusFilter);
  const [sortOrder, setSortOrder] = useState(initialSortOrder);

  // Update local state when props change
  useEffect(() => {
    setSearchTerm(initialSearchTerm);
    setStatusFilter(initialStatusFilter);
    setSortOrder(initialSortOrder);
  }, [initialSearchTerm, initialStatusFilter, initialSortOrder]);

  // Subscribe to real-time changes
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setError('Supabase API key is missing. Please set the VITE_SUPABASE_ANON_KEY environment variable.');
      setLoading(false);
      return;
    }

    const channel = supabase
      .channel('reports_channel')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'reports' 
      }, (payload) => {
        fetchReports();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchReports = async () => {
    if (!isSupabaseConfigured) {
      setError('Supabase API key is missing. Please set the VITE_SUPABASE_ANON_KEY environment variable.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      let query = supabase
        .from('reports')
        .select('*');
      
      // For user view, filter by current user
      if (!isAdminView && currentUser) {
        query = query.eq('reported_by', currentUser.uid);
      }
      
      // Order by created_at
      query = query.order('created_at', { ascending: sortOrder === 'oldest' });
      
      const { data, error: supabaseError } = await query;
      
      if (supabaseError) {
        throw supabaseError;
      }
      
      if (data) {
        // Transform Supabase data to match ReportType
        const transformedReports: ReportType[] = data.map(report => ({
          id: report.id,
          title: report.title,
          description: report.description,
          category: report.category,
          location: report.location,
          status: report.status,
          createdAt: new Date(report.created_at),
          reportedBy: report.reported_by,
          reporterName: report.reporter_name,
          reporterEmail: report.reporter_email,
          imageUrl: report.image_url
        }));
        
        setReports(transformedReports);
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError('Failed to load reports. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [currentUser, isAdminView, sortOrder]);

  // Apply filters to reports
  const filteredReports = reports.filter(report => {
    // Apply search term filter
    const matchesSearch = 
      report.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.location?.toLowerCase().includes(searchTerm.toLowerCase());
      
    // Apply status filter
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setSortOrder('newest');
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
        <Button variant="outline" className="mt-4" onClick={() => fetchReports()}>
          Try Again
        </Button>
      </div>
    );
  }

  // Skip the filter UI if the parent component provides filters
  const shouldShowFilters = !initialSearchTerm && initialStatusFilter === 'all' && initialSortOrder === 'newest';

  return (
    <div className="pb-8">
      {shouldShowFilters && (
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
            <div className="flex items-center gap-2">
              <Label htmlFor="sort-order" className="text-sm whitespace-nowrap">
                Sort by:
              </Label>
              <select
                id="sort-order"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-campus-primary focus:border-campus-primary block p-2"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
            {(searchTerm || statusFilter !== 'all' || sortOrder !== 'newest') && (
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
      )}

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
