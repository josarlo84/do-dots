import { Task } from "@shared/schema";
import { cn } from "@/lib/utils";
import { Pencil, Trash2, Check, X } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface TaskItemProps {
  task: Task;
  onToggle: () => void;
  onDelete: () => void;
  showActions: boolean;
  onEdit?: (newTitle: string) => void;
}

export default function TaskItem({ task, onToggle, onDelete, showActions, onEdit }: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);
  
  const handleEdit = () => {
    if (onEdit && editedTitle.trim() !== '') {
      onEdit(editedTitle);
      setIsEditing(false);
    }
  };
  
  const handleCancel = () => {
    setEditedTitle(task.title);
    setIsEditing(false);
  };
  
  return (
    <div 
      className={cn(
        "flex items-center p-3 border rounded-lg bg-white hover:bg-gray-50 transition",
        !isEditing && "cursor-pointer"
      )}
      onClick={!isEditing ? onToggle : undefined}
    >
      <div className="mr-3">
        <div 
          className={cn(
            "w-6 h-6 rounded-md border-2 flex items-center justify-center",
            task.completed ? "bg-primary border-primary" : "border-gray-300"
          )}
        >
          {task.completed && (
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-4 w-4 text-white" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path 
                fillRule="evenodd" 
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                clipRule="evenodd" 
              />
            </svg>
          )}
        </div>
      </div>
      
      <div className="flex-grow">
        {isEditing ? (
          <Input
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            autoFocus
            className="py-0 h-7"
          />
        ) : (
          <p 
            className={cn(
              "text-gray-800",
              task.completed ? "line-through text-gray-500" : ""
            )}
          >
            {task.title}
          </p>
        )}
      </div>

      {showActions && (
        <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
          {isEditing ? (
            <>
              <button 
                className="text-green-500 hover:text-green-600 ml-2"
                onClick={handleEdit}
                title="Save"
              >
                <Check className="h-5 w-5" />
              </button>
              <button 
                className="text-gray-400 hover:text-gray-500 ml-2"
                onClick={handleCancel}
                title="Cancel"
              >
                <X className="h-5 w-5" />
              </button>
            </>
          ) : (
            <>
              <button 
                className="text-gray-400 hover:text-blue-500 ml-2"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
                title="Edit"
              >
                <Pencil className="h-5 w-5" />
              </button>
              {task.type === 'personal' && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button 
                      className="text-gray-400 hover:text-red-500 ml-2"
                      onClick={(e) => e.stopPropagation()}
                      title="Delete"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete the task. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        className="bg-red-500 hover:bg-red-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete();
                        }}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
