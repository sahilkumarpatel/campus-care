
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { PlusCircle, Search, Users, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Team {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  createdAt: string;
}

const AdminTeamManagement = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showTeamDialog, setShowTeamDialog] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamDescription, setTeamDescription] = useState('');
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [savingTeam, setSavingTeam] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);
  
  // Check if user is admin
  const isAdmin = currentUser?.email === 'admin@pccoepune.org';
  
  useEffect(() => {
    if (!isAdmin) {
      toast({
        title: "Access Denied",
        description: "You do not have permission to view this page",
        variant: "destructive"
      });
      navigate('/dashboard');
      return;
    }
    
    fetchTeams();
  }, [isAdmin, navigate, toast]);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      
      // For demo purposes, we'll use mock data
      const mockTeams: Team[] = [
        {
          id: '1',
          name: 'Maintenance Team',
          description: 'Responsible for facility maintenance and repairs',
          memberCount: 8,
          createdAt: '2023-07-15T10:00:00Z'
        },
        {
          id: '2',
          name: 'IT Support',
          description: 'Technical support and infrastructure maintenance',
          memberCount: 5,
          createdAt: '2023-08-20T14:30:00Z'
        },
        {
          id: '3',
          name: 'Campus Security',
          description: 'Security and safety management',
          memberCount: 12,
          createdAt: '2023-06-10T09:15:00Z'
        },
        {
          id: '4',
          name: 'Administrative Staff',
          description: 'Administrative support and management',
          memberCount: 7,
          createdAt: '2023-09-05T11:45:00Z'
        }
      ];
      
      setTeams(mockTeams);
    } catch (error) {
      console.error('Error fetching teams:', error);
      toast({
        title: "Error",
        description: "Failed to load team data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditTeam = (team: Team) => {
    setEditingTeam(team);
    setTeamName(team.name);
    setTeamDescription(team.description);
    setShowTeamDialog(true);
  };

  const handleDeleteTeam = (team: Team) => {
    setTeamToDelete(team);
    setShowDeleteDialog(true);
  };

  const handleAddTeam = () => {
    setEditingTeam(null);
    setTeamName('');
    setTeamDescription('');
    setShowTeamDialog(true);
  };

  const handleSaveTeam = async () => {
    if (!teamName.trim()) {
      toast({
        title: "Missing Information",
        description: "Team name is required",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setSavingTeam(true);
      
      if (editingTeam) {
        // Update existing team
        const updatedTeams = teams.map(team => 
          team.id === editingTeam.id 
            ? { ...team, name: teamName, description: teamDescription }
            : team
        );
        
        setTeams(updatedTeams);
        
        toast({
          title: "Team Updated",
          description: `Team "${teamName}" has been updated`,
        });
      } else {
        // Create new team
        const newTeam: Team = {
          id: `${Date.now()}`, // Generate a simple ID for demo
          name: teamName,
          description: teamDescription,
          memberCount: 0,
          createdAt: new Date().toISOString()
        };
        
        setTeams([newTeam, ...teams]);
        
        toast({
          title: "Team Created",
          description: `Team "${teamName}" has been created`,
        });
      }
      
      setShowTeamDialog(false);
      setTeamName('');
      setTeamDescription('');
      setEditingTeam(null);
    } catch (error) {
      console.error('Error saving team:', error);
      toast({
        title: "Error",
        description: "Failed to save team",
        variant: "destructive"
      });
    } finally {
      setSavingTeam(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!teamToDelete) return;
    
    try {
      // Remove the team from the array
      const filteredTeams = teams.filter(team => team.id !== teamToDelete.id);
      setTeams(filteredTeams);
      
      toast({
        title: "Team Deleted",
        description: `Team "${teamToDelete.name}" has been deleted`,
      });
      
      setShowDeleteDialog(false);
      setTeamToDelete(null);
    } catch (error) {
      console.error('Error deleting team:', error);
      toast({
        title: "Error",
        description: "Failed to delete team",
        variant: "destructive"
      });
    }
  };

  const filteredTeams = teams.filter(team => 
    team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    team.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-campus-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Manage Teams</h1>
        <Button 
          onClick={handleAddTeam}
          className="bg-campus-primary hover:bg-campus-primary/90"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Team
        </Button>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div className="w-full md:w-64 relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>
          <Input
            type="search"
            placeholder="Search teams..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Team List</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTeams.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No teams found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left font-medium py-3 px-4">Team Name</th>
                    <th className="text-left font-medium py-3 px-4">Description</th>
                    <th className="text-left font-medium py-3 px-4">Members</th>
                    <th className="text-left font-medium py-3 px-4">Created</th>
                    <th className="text-left font-medium py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTeams.map(team => (
                    <tr key={team.id} className="border-b hover:bg-muted/20">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
                            <Users className="h-4 w-4" />
                          </div>
                          <span className="font-medium">{team.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">{team.description}</td>
                      <td className="py-3 px-4">{team.memberCount}</td>
                      <td className="py-3 px-4">
                        {new Date(team.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditTeam(team)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Team
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/admin/teams/${team.id}`)}>
                              <Users className="mr-2 h-4 w-4" />
                              Manage Members
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-red-500 focus:text-red-500"
                              onClick={() => handleDeleteTeam(team)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Team
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Add/Edit Team Dialog */}
      <Dialog open={showTeamDialog} onOpenChange={setShowTeamDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTeam ? 'Edit Team' : 'Add New Team'}</DialogTitle>
            <DialogDescription>
              {editingTeam 
                ? 'Update team information and settings' 
                : 'Create a new team for managing reports and assignments'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Team Name</Label>
              <Input
                id="name"
                placeholder="e.g., Maintenance Team"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="What does this team do?"
                value={teamDescription}
                onChange={(e) => setTeamDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowTeamDialog(false)}
              disabled={savingTeam}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveTeam}
              disabled={!teamName || savingTeam}
              className="bg-campus-primary hover:bg-campus-primary/90"
            >
              {savingTeam ? "Saving..." : editingTeam ? "Update Team" : "Create Team"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Team</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the team "{teamToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTeamManagement;
