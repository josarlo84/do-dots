import { Task } from "@shared/schema";
import TaskItem from "./TaskItem";

interface TaskListProps {
  tasks: Task[];
  onToggle: (task: Task) => void;
  onDelete: (task: Task) => void;
  showActions: boolean;
}

export default function TaskList({ tasks, onToggle, onDelete, showActions }: TaskListProps) {
  return (
    <div className="space-y-2">
      {tasks.map(task => (
        <TaskItem 
          key={`${task.type}-${task.id}`} 
          task={task} 
          onToggle={() => onToggle(task)} 
          onDelete={() => onDelete(task)}
          showActions={showActions}
        />
      ))}
    </div>
  );
}
