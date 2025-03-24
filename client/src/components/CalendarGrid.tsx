import { CalendarDay } from "@shared/schema";
import { Progress } from "@/components/ui/progress";
import { CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface CalendarGridProps {
  days: CalendarDay[];
}

export default function CalendarGrid({ days }: CalendarGridProps) {
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Day headers */}
      <div className="grid grid-cols-7 bg-gray-100">
        {dayNames.map((day) => (
          <div key={day} className="py-2 text-center text-sm font-medium text-gray-600">
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar cells */}
      <div className="grid grid-cols-7 border-t">
        {days.map((day, index) => (
          <div 
            key={index}
            className={cn(
              "min-h-[100px] border-b border-r p-1 relative",
              !day.isCurrentMonth && "bg-gray-50"
            )}
          >
            <div className="text-sm font-medium mb-1 text-gray-600">
              {day.date.getDate()}
            </div>
            
            {/* If Level 2 achieved on this day */}
            {day.isLevel2 && (
              <div className="absolute top-1 right-1">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-100">
                  <CheckIcon className="h-3 w-3 text-green-600" />
                </span>
              </div>
            )}
            
            {/* Task completion indicators */}
            {day.totalTasks > 0 && (
              <div className="space-y-1 mt-2">
                <div className="text-xs text-gray-600">
                  {day.completedTasks}/{day.totalTasks} completed
                </div>
                <Progress 
                  value={day.totalTasks > 0 ? (day.completedTasks / day.totalTasks) * 100 : 0} 
                  className="h-1"
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
