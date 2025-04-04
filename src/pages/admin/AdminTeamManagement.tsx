
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Search, UserPlus, Pencil, Trash2, Users } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Mock data for teams (in a real app, this would come from Firebase)
const MOCK_TEAMS = [
  {
    id: '1',
    name: 'Maintenance Team',
    description: 'Handles infrastructure and maintenance issues',
    members: 4,
    categories: ['infrastructure', 'electrical', 'sanitation']
  },
  {
    id: '2',
    name: 'Parking Management',
    description: 'Manages parking-related issues',
    members: 2,
    categories: ['parking']
  },
  {
    id: '3',
    name: 'Administrative Team',
    description: 'Handles general administrative issues',
    members: 3,
    categories: ['other']
  }
];

const AdminTeamManagement = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [teams, setTeams] = useState(MOCK_TEAMS);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Check if user is admin
  const isAdmin = currentUser?.email === 'admin@pccoepune.org';
  
  React.useEffect(() => {
    if (!isAdmin) {
      toast({
        title: "Access Denied",
        description: "You do not have permission to view this page",
        variant: "destructive"
      });
      navigate('/dashboard');
    }
  }, [currentUser, navigate, toast, isAdmin]);

  const filteredTeams = teams.filter(team => 
    team.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    team.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isAdmin) {
    return null; // Will redirect from useEffect
  }

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Team Management</h1>
        <Button
          variant="outline"
          onClick={() => navigate('/admin')}
        >
          Back to Dashboard
        </Button>
      </div>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Teams</CardTitle>
          <div className="flex gap-2">
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search teams..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button className="bg-campus-primary hover:bg-campus-primary/90">
              <Users className="mr-2 h-4 w-4" />
              Add Team
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Categories</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTeams.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4">
                    No teams found
                  </TableCell>
                </TableRow>
              ) : (
                filteredTeams.map(team => (
                  <TableRow key={team.id}>
                    <TableCell className="font-medium">{team.name}</TableCell>
                    <TableCell>{team.description}</TableCell>
                    <TableCell>{team.members}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {team.categories.map(category => (
                          <span key={category} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {category}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <UserPlus className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminTeamManagement;
