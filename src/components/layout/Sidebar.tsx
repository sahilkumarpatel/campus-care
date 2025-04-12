
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { Home, FileText, Settings, User, ChevronRight, Plus, ClipboardList, Shield, PieChart, Users } from 'lucide-react';

interface SidebarProps {
  isMobile?: boolean;
  closeMobileMenu?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isMobile = false, closeMobileMenu }) => {
  const location = useLocation();
  const { currentUser, isAdmin } = useAuth();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleNavClick = () => {
    if (isMobile && closeMobileMenu) {
      closeMobileMenu();
    }
  };

  const navItems = [
    { 
      name: 'Dashboard', 
      path: '/dashboard', 
      icon: <Home className="mr-2 h-5 w-5" /> 
    },
    { 
      name: 'New Report', 
      path: '/new-report', 
      icon: <Plus className="mr-2 h-5 w-5" /> 
    },
    { 
      name: 'My Reports', 
      path: '/my-reports', 
      icon: <ClipboardList className="mr-2 h-5 w-5" /> 
    },
    { 
      name: 'Profile', 
      path: '/profile', 
      icon: <User className="mr-2 h-5 w-5" /> 
    },
    { 
      name: 'Settings', 
      path: '/settings', 
      icon: <Settings className="mr-2 h-5 w-5" /> 
    },
  ];

  // Admin routes - Added back Manage Users and Manage Teams
  const adminRoutes = [
    { 
      name: 'Admin Dashboard', 
      path: '/admin', 
      icon: <Shield className="mr-2 h-5 w-5" /> 
    },
    { 
      name: 'Insights', 
      path: '/admin/insights', 
      icon: <PieChart className="mr-2 h-5 w-5" /> 
    },
    { 
      name: 'Manage Reports', 
      path: '/admin/reports', 
      icon: <FileText className="mr-2 h-5 w-5" /> 
    },
    { 
      name: 'Manage Users', 
      path: '/admin/users', 
      icon: <User className="mr-2 h-5 w-5" /> 
    },
    { 
      name: 'Manage Teams', 
      path: '/admin/teams', 
      icon: <Users className="mr-2 h-5 w-5" /> 
    },
  ];

  return (
    <div className={cn(
      "flex flex-col h-screen bg-white border-r border-gray-200",
      isMobile ? "w-full" : "w-64 pt-16"
    )}>
      <div className="flex flex-col overflow-y-auto flex-1 px-3 py-4">
        {/* Only show regular user navigation items if user is not an admin */}
        {!isAdmin && (
          <div className="mb-6">
            <h2 className="mb-2 px-4 text-xs font-semibold text-gray-500 uppercase">
              Main
            </h2>
            <nav className="flex flex-col space-y-1">
              {navItems.map((item) => (
                <Link 
                  key={item.path} 
                  to={item.path}
                  onClick={handleNavClick}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "w-full justify-start",
                      isActive(item.path)
                        ? "bg-campus-primary text-white hover:bg-campus-primary/90 hover:text-white"
                        : "hover:bg-campus-light hover:text-campus-primary"
                    )}
                  >
                    {item.icon}
                    {item.name}
                    {isActive(item.path) && (
                      <ChevronRight className="ml-auto h-4 w-4" />
                    )}
                  </Button>
                </Link>
              ))}
            </nav>
          </div>
        )}

        {isAdmin && (
          <div className="mb-6">
            <h2 className="mb-2 px-4 text-xs font-semibold text-gray-500 uppercase">
              Admin
            </h2>
            <nav className="flex flex-col space-y-1">
              {adminRoutes.map((item) => (
                <Link 
                  key={item.path} 
                  to={item.path}
                  onClick={handleNavClick}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "w-full justify-start",
                      isActive(item.path)
                        ? "bg-campus-primary text-white hover:bg-campus-primary/90 hover:text-white"
                        : "hover:bg-campus-light hover:text-campus-primary"
                    )}
                  >
                    {item.icon}
                    {item.name}
                    {isActive(item.path) && (
                      <ChevronRight className="ml-auto h-4 w-4" />
                    )}
                  </Button>
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
