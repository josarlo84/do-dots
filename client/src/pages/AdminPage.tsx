import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { PersonWithTasks, GlobalTask } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { getInitials } from "@/lib/utils";
import AddPersonModal from "@/components/AddPersonModal";
import AddGlobalTaskModal from "@/components/AddGlobalTaskModal";
import { ArrowLeft, Edit, Trash2, Plus } from "lucide-react";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function AdminPage() {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("people");
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [showAddGlobalTask, setShowAddGlobalTask] = useState(false);
  const [deletePersonId, setDeletePersonId] = useState<number | null>(null);
  const [deleteGlobalTaskId, setDeleteGlobalTaskId] = useState<number | null>(null);

  const { data: people = [], isLoading: isPeopleLoading } = useQuery<PersonWithTasks[]>({
    queryKey: ['/api/people'],
  });

  const { data: globalTasks = [], isLoading: isGlobalTasksLoading } = useQuery<GlobalTask[]>({
    queryKey: ['/api/global-tasks'],
  });

  const deletePersonMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/people/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/people'] });
      toast({
        title: "Person deleted",
        description: "Family member has been removed.",
      });
      setDeletePersonId(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete family member.",
        variant: "destructive",
      });
      setDeletePersonId(null);
    }
  });

  const deleteGlobalTaskMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/global-tasks/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/global-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/people'] });
      toast({
        title: "Task deleted",
        description: "Global task has been removed.",
      });
      setDeleteGlobalTaskId(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete global task.",
        variant: "destructive",
      });
      setDeleteGlobalTaskId(null);
    }
  });

  // Calculate completion rate for global tasks
  const calculateCompletionRate = (taskId: number) => {
    if (people.length === 0) return 0;
    
    let completedCount = 0;
    for (const person of people) {
      const task = person.globalTasks.find(t => t.id === taskId);
      if (task && task.completed) {
        completedCount++;
      }
    }
    
    return Math.round((completedCount / people.length) * 100);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <Button 
            variant="ghost" 
            className="flex items-center text-gray-600 hover:text-gray-800"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            Back to Main
          </Button>
          <h1 className="text-2xl font-semibold text-gray-800">Admin Dashboard</h1>
          <div className="w-24"></div> {/* Empty div for flex alignment */}
        </div>
        
        {/* Admin Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <div className="border-b border-gray-200">
            <TabsList className="bg-transparent border-b-0">
              <TabsTrigger 
                value="people" 
                className="py-3 px-6 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent"
              >
                People Management
              </TabsTrigger>
              <TabsTrigger 
                value="tasks" 
                className="py-3 px-6 ml-8 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent"
              >
                Global Tasks
              </TabsTrigger>
            </TabsList>
          </div>
          
          {/* People Management */}
          <TabsContent value="people">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-medium text-gray-800">Family Members</h2>
              <Button 
                onClick={() => setShowAddPerson(true)}
                className="bg-primary hover:bg-primary/90"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Person
              </Button>
            </div>
            
            <Card>
              <CardContent className="p-0">
                {isPeopleLoading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-gray-500">Loading people...</p>
                  </div>
                ) : people.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-gray-500 mb-4">No family members yet.</p>
                    <Button 
                      onClick={() => setShowAddPerson(true)}
                      className="bg-primary hover:bg-primary/90"
                    >
                      Add Family Member
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Level Status</TableHead>
                        <TableHead>Task Progress</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {people.map((person) => (
                        <TableRow key={person.id}>
                          <TableCell>
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                {getInitials(person.name)}
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">{person.name}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-gray-500">{person.role}</div>
                          </TableCell>
                          <TableCell>
                            <span 
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                person.isLevel2 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {person.isLevel2 ? 'Level 2' : 'Level 1'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Progress value={person.progress} className="w-32 h-2 mr-2" />
                              <div className="text-xs text-gray-500">{person.progress}%</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-primary hover:text-primary/90 h-8 px-2"
                              onClick={() => navigate(`/dashboard/${person.id}`)}
                            >
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700 h-8 px-2"
                              onClick={() => setDeletePersonId(person.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Global Tasks Management */}
          <TabsContent value="tasks">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-medium text-gray-800">Global Tasks</h2>
              <Button 
                onClick={() => setShowAddGlobalTask(true)}
                className="bg-primary hover:bg-primary/90"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Global Task
              </Button>
            </div>
            
            <Card>
              <CardContent className="p-0">
                {isGlobalTasksLoading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-gray-500">Loading tasks...</p>
                  </div>
                ) : globalTasks.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-gray-500 mb-4">No global tasks yet.</p>
                    <Button 
                      onClick={() => setShowAddGlobalTask(true)}
                      className="bg-primary hover:bg-primary/90"
                    >
                      Add Global Task
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Task</TableHead>
                        <TableHead>Completion Rate</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {globalTasks.map((task) => {
                        const completionRate = calculateCompletionRate(task.id);
                        
                        return (
                          <TableRow key={task.id}>
                            <TableCell>
                              <div className="text-sm font-medium text-gray-900">{task.title}</div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <Progress value={completionRate} className="w-32 h-2 mr-2" />
                                <div className="text-xs text-gray-500">{completionRate}%</div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-700 h-8 px-2"
                                onClick={() => setDeleteGlobalTaskId(task.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Add Person Modal */}
      <AddPersonModal 
        isOpen={showAddPerson} 
        onClose={() => setShowAddPerson(false)} 
        onSuccess={() => {
          setShowAddPerson(false);
          queryClient.invalidateQueries({ queryKey: ['/api/people'] });
        }}
      />
      
      {/* Add Global Task Modal */}
      <AddGlobalTaskModal 
        isOpen={showAddGlobalTask} 
        onClose={() => setShowAddGlobalTask(false)} 
        onSuccess={() => {
          setShowAddGlobalTask(false);
          queryClient.invalidateQueries({ queryKey: ['/api/global-tasks'] });
          queryClient.invalidateQueries({ queryKey: ['/api/people'] });
        }}
      />
      
      {/* Delete Person Confirmation */}
      <AlertDialog open={deletePersonId !== null} onOpenChange={() => setDeletePersonId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this family member and all their personal tasks.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-500 hover:bg-red-600"
              onClick={() => {
                if (deletePersonId !== null) {
                  deletePersonMutation.mutate(deletePersonId);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Delete Global Task Confirmation */}
      <AlertDialog open={deleteGlobalTaskId !== null} onOpenChange={() => setDeleteGlobalTaskId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this global task for all family members.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-500 hover:bg-red-600"
              onClick={() => {
                if (deleteGlobalTaskId !== null) {
                  deleteGlobalTaskMutation.mutate(deleteGlobalTaskId);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
