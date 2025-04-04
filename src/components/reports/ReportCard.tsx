
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export interface ReportType {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'submitted' | 'in-progress' | 'resolved';
  location: string;
  imageUrl?: string | null;
  createdAt: any;
  reportedBy: string;
  reporterName?: string;
}

interface ReportCardProps {
  report: ReportType;
  isAdminView?: boolean;
}

const ReportCard: React.FC<ReportCardProps> = ({ report, isAdminView = false }) => {
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'status-badge status-submitted';
      case 'in-progress':
        return 'status-badge status-in-progress';
      case 'resolved':
        return 'status-badge status-resolved';
      default:
        return 'status-badge status-submitted';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'Submitted';
      case 'in-progress':
        return 'In Progress';
      case 'resolved':
        return 'Resolved';
      default:
        return 'Submitted';
    }
  };

  const getCategoryIcon = (category: string) => {
    // In a real app, you'd return different icons based on the category
    return "🏢";
  };

  return (
    <Card className="h-full flex flex-col overflow-hidden hover:shadow-md transition-shadow">
      <CardHeader className="py-3 px-4 flex flex-row justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-xl">{getCategoryIcon(report.category)}</span>
          <h3 className="font-medium text-sm line-clamp-1">{report.title}</h3>
        </div>
        <span className={getStatusClass(report.status)}>
          {getStatusText(report.status)}
        </span>
      </CardHeader>
      <CardContent className="px-4 py-3 flex-1">
        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
          {report.description}
        </p>
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <span>Location:</span>
          <span className="font-medium">{report.location}</span>
        </div>
        {report.imageUrl && (
          <div className="mt-2 h-32 overflow-hidden rounded-md">
            <img 
              src={report.imageUrl} 
              alt={report.title} 
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </CardContent>
      <CardFooter className="px-4 py-3 border-t flex justify-between items-center bg-muted/20">
        <span className="text-xs text-muted-foreground">
          {report.createdAt?.toDate 
            ? formatDistanceToNow(report.createdAt.toDate(), { addSuffix: true }) 
            : 'Just now'}
        </span>
        <Button asChild variant="ghost" size="sm" className="text-xs p-0 h-auto hover:bg-transparent">
          <Link to={`/${isAdminView ? 'admin/reports' : 'my-reports'}/${report.id}`} className="flex items-center">
            View Details <ChevronRight className="ml-1 h-3 w-3" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ReportCard;
