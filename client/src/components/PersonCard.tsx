import { PersonWithTasks } from "@shared/schema";
import { Progress } from "@/components/ui/progress";
import { getInitials } from "@/lib/utils";

interface PersonCardProps {
  person: PersonWithTasks;
  onClick: () => void;
}

export default function PersonCard({ person, onClick }: PersonCardProps) {
  return (
    <div 
      className="border rounded-lg p-6 cursor-pointer hover:shadow-md transition"
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
            <span>{getInitials(person.name)}</span>
          </div>
          <div className="ml-4">
            <h3 className="font-medium text-gray-800">{person.name}</h3>
            <div className="text-sm text-gray-500">{person.role}</div>
          </div>
        </div>
        
        {/* Level 2 status indicator */}
        <div className="flex items-center">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            person.isLevel2 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {person.isLevel2 ? 'Level 2' : 'Level 1'}
          </span>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="mt-4">
        <Progress value={person.progress} className="h-2.5" />
      </div>
      <div className="mt-1 text-xs text-gray-500 text-right">
        {person.completedTasks}/{person.totalTasks} tasks
      </div>
    </div>
  );
}
