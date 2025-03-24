import { Task } from "@shared/schema";
import TaskItem from "./TaskItem";

interface TaskListProps {
  tasks: Task[];
  onToggle: (task: Task) => void;
  onDelete: (task: Task) => void;
  showActions: boolean;
  onEdit?: (task: Task, newTitle: string) => void;
}

export default function TaskList({ tasks, onToggle, onDelete, showActions, onEdit }: TaskListProps) {
  return (
    <div className="space-y-2">
      {tasks.map(task => (
        <TaskItem 
          key={`${task.type}-${task.id}`} 
          task={task} 
          onToggle={() => onToggle(task)} 
          onDelete={() => onDelete(task)}
          showActions={showActions}
          onEdit={onEdit ? (newTitle) => onEdit(task, newTitle) : undefined}
        />
      ))}
    </div>
  );
}
