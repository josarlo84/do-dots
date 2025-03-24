import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { PersonWithTasks, Task } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import LevelTracker from "@/components/LevelTracker";
import TaskList from "@/components/TaskList";
import AddTaskModal from "@/components/AddTaskModal";
import ThemeSelector from "@/components/ThemeSelector";
import { getThemeBgClass } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar } from "lucide-react";

export default function DashboardPage() {
  const { id } = useParams<{ id: string }>();
  const personId = parseInt(id);
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [showAddTask, setShowAddTask] = useState(false);

  const { data: person, isLoading, error } = useQuery<PersonWithTasks>({
    queryKey: [`/api/people/${personId}`],
  });

  const taskCompletionMutation = useMutation({
    mutationFn: async ({ taskId, taskType, completed }: { taskId: number; taskType: string; completed: boolean }) => {
      return apiRequest('POST', '/api/task-completions', {
        personId,
        taskId,
        taskType,
        completed,
        date: new Date()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/people/${personId}`] });
      toast({
        title: "Task updated",
        description: "Task completion status has been updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update task status.",
        variant: "destructive",
      });
    }
  });

  const personalTaskMutation = useMutation({
    mutationFn: async ({ id, action }: { id: number; action: "delete" }) => {
      if (action === "delete") {
        return apiRequest('DELETE', `/api/personal-tasks/${id}`, undefined);
      }
      throw new Error("Unsupported action");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/people/${personId}`] });
      toast({
        title: "Task deleted",
        description: "Personal task has been removed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete task.",
        variant: "destructive",
      });
    }
  });

  const themeMutation = useMutation({
    mutationFn: async (theme: string) => {
      return apiRequest('PATCH', `/api/people/${personId}`, { theme });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/people/${personId}`] });
      toast({
        title: "Theme updated",
        description: "Dashboard theme has been changed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update theme.",
        variant: "destructive",
      });
    }
  });

  const handleToggleTask = (task: Task) => {
    taskCompletionMutation.mutate({
      taskId: task.id,
      taskType: task.type,
      completed: !task.completed
    });
  };

  const handleDeleteTask = (task: Task) => {
    if (task.type === 'personal') {
      personalTaskMutation.mutate({ id: task.id, action: "delete" });
    }
  };

  const handleThemeChange = (theme: string) => {
    themeMutation.mutate(theme);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="mt-4 text-gray-500">Loading dashboard...</p>
      </div>
    );
  }

  if (error || !person) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
        <div className="bg-red-100 p-3 rounded-full mb-4">
          <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">Something went wrong</h2>
        <p className="text-gray-600 mb-6">Unable to load dashboard information.</p>
        <Button onClick={() => navigate('/')}>Return to Home</Button>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col ${getThemeBgClass(person.theme)}`}>
      {/* Level 2 Tracker - Sticky Header */}
      <div className={`sticky top-0 z-10 border-b shadow-sm ${getThemeBgClass(person.theme)}`}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              className="flex items-center text-gray-600 hover:text-gray-800 p-0"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="h-5 w-5 mr-1" />
              Back
            </Button>
            
            <div className="text-center flex-1">
              <h2 className="text-lg font-semibold text-gray-800">{person.name}</h2>
            </div>
            
            <Button 
              variant="ghost" 
              className="flex items-center text-gray-600 hover:text-gray-800 p-0"
              onClick={() => navigate(`/calendar/${personId}`)}
            >
              <Calendar className="h-5 w-5 mr-1" />
              Calendar
            </Button>
          </div>
          
          <LevelTracker 
            completedTasks={person.completedTasks} 
            totalTasks={person.totalTasks} 
            isLevel2={person.isLevel2} 
          />
        </div>
      </div>
        
      {/* Task Lists */}
      <div className="container mx-auto px-4 py-6 flex-grow">
        {/* Global Tasks Section */}
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Global Tasks</h3>
          {person.globalTasks.length === 0 ? (
            <div className="text-center py-6 border rounded-lg bg-white bg-opacity-70">
              <p className="text-gray-500">No global tasks assigned yet.</p>
            </div>
          ) : (
            <TaskList 
              tasks={person.globalTasks} 
              onToggle={handleToggleTask} 
              showActions={false}
              onDelete={() => {}}
            />
          )}
        </div>
          
        {/* Individual Tasks Section */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-800">Personal Tasks</h3>
            <Button 
              variant="default" 
              size="sm"
              className="bg-primary hover:bg-primary/90"
              onClick={() => setShowAddTask(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add Task
            </Button>
          </div>
            
          {person.personalTasks.length === 0 ? (
            <div className="text-center py-8 border rounded-lg bg-white bg-opacity-70">
              <p className="text-gray-500">No personal tasks yet. Add one to get started!</p>
            </div>
          ) : (
            <TaskList 
              tasks={person.personalTasks} 
              onToggle={handleToggleTask}
              showActions={true}
              onDelete={handleDeleteTask}
            />
          )}
        </div>
      </div>
        
      {/* Theme Selector */}
      <div className="border-t py-4">
        <ThemeSelector selectedTheme={person.theme} onChange={handleThemeChange} />
      </div>

      {/* Add Task Modal */}
      <AddTaskModal 
        personId={personId}
        isOpen={showAddTask} 
        onClose={() => setShowAddTask(false)} 
        onSuccess={() => {
          setShowAddTask(false);
          queryClient.invalidateQueries({ queryKey: [`/api/people/${personId}`] });
        }}
      />
    </div>
  );
}
