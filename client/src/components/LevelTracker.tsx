import { Progress } from "@/components/ui/progress";

interface LevelTrackerProps {
  completedTasks: number;
  totalTasks: number;
  isLevel2: boolean;
}

export default function LevelTracker({ completedTasks, totalTasks, isLevel2 }: LevelTrackerProps) {
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  return (
    <div className="mt-3 mb-2">
      <div className="flex justify-between items-center mb-1">
        <div className="text-sm font-medium text-gray-700">Level 2 Progress</div>
        <div className="text-sm text-gray-500">
          {completedTasks}/{totalTasks} tasks
        </div>
      </div>
      <Progress 
        value={progress} 
        className={`h-3 ${isLevel2 ? 'bg-green-200' : ''}`}
      />
      
      {/* Level Indicator */}
      <div className="flex justify-end mt-1">
        <span 
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            isLevel2 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}
        >
          {isLevel2 ? 'Level 2' : 'Level 1'}
        </span>
      </div>
    </div>
  );
}
