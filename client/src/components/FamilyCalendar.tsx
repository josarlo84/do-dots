import { useQuery } from "@tanstack/react-query";
import { format, subMonths, addMonths } from "date-fns";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CalendarDay } from "@shared/schema";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMonthYear } from "@/lib/utils";

interface FamilyCalendarProps {
  onSelectPerson: (id: number) => void;
}

type PersonCalendarData = {
  personId: number;
  name: string;
  days: CalendarDay[];
};

export default function FamilyCalendar({ onSelectPerson }: FamilyCalendarProps) {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(today);
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1; // JavaScript months are 0-indexed

  // Use a POST request instead to avoid URL parameter issues
  const { data, isLoading, isError } = useQuery<PersonCalendarData[]>({
    queryKey: ['/api/people'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handlePreviousMonth = () => {
    setCurrentDate(prevDate => subMonths(prevDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prevDate => addMonths(prevDate, 1));
  };

  const getCalendarSummary = (person: PersonCalendarData) => {
    if (!person || !person.days) return { completedDays: 0, level2Days: 0 };
    
    const completedDays = person.days.filter(day => 
      day.isCurrentMonth && day.completedTasks > 0
    ).length;
    
    const level2Days = person.days.filter(day => 
      day.isCurrentMonth && day.isLevel2
    ).length;
    
    return { completedDays, level2Days };
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Family Calendar</h3>
          <div className="flex space-x-2">
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-8 w-28 rounded" />
            <Skeleton className="h-8 w-8 rounded" />
          </div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center justify-between p-3 border rounded">
              <Skeleton className="h-6 w-24 rounded" />
              <div className="flex space-x-2">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-medium mb-4">Family Calendar</h3>
        <div className="text-center py-6 text-gray-500">
          Unable to load calendar data. Please try again later.
        </div>
      </div>
    );
  }

  const peopleCalendarData = data;

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Family Calendar</h3>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handlePreviousMonth}
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-medium">{formatMonthYear(currentDate)}</span>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleNextMonth}
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {peopleCalendarData.length === 0 ? (
        <div className="text-center py-6 text-gray-500">
          No family members added yet.
        </div>
      ) : (
        <div className="space-y-3">
          {peopleCalendarData.map(person => {
            const { completedDays, level2Days } = getCalendarSummary(person);
            
            return (
              <div 
                key={person.personId}
                className="flex items-center justify-between p-3 border rounded cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => onSelectPerson(person.personId)}
              >
                <span className="font-medium">{person.name}</span>
                <div className="flex space-x-2">
                  <Badge variant="outline" className="bg-blue-50">
                    {completedDays} days with tasks
                  </Badge>
                  <Badge variant="outline" className="bg-green-50">
                    {level2Days} Level 2 days
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}