import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { CalendarDay, PersonWithTasks } from "@shared/schema";
import { formatMonthYear } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import CalendarGrid from "@/components/CalendarGrid";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";

export default function CalendarPage() {
  const { id } = useParams<{ id: string }>();
  const personId = parseInt(id);
  const [_, navigate] = useLocation();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-indexed
  
  const { data: person } = useQuery<PersonWithTasks>({
    queryKey: [`/api/people/${personId}`],
  });
  
  const { data: calendarDays = [], isLoading } = useQuery<CalendarDay[]>({
    queryKey: [`/api/calendar/${personId}/${currentYear}/${currentMonth}`],
  });
  
  const navigateToPreviousMonth = () => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  };
  
  const navigateToNextMonth = () => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  };
  
  if (!person) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Person not found</p>
          <Button onClick={() => navigate('/')}>Return to Home</Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <Button 
            variant="ghost" 
            className="flex items-center text-gray-600 hover:text-gray-800"
            onClick={() => navigate(`/dashboard/${personId}`)}
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            Back to Dashboard
          </Button>
          
          <h2 className="text-xl font-semibold text-gray-800">Task Calendar</h2>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={navigateToPreviousMonth}
              className="rounded-full hover:bg-gray-200"
            >
              <ChevronLeft className="h-6 w-6" />
              <span className="sr-only">Previous month</span>
            </Button>
            <span className="text-lg font-medium text-gray-800">
              {formatMonthYear(currentDate)}
            </span>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={navigateToNextMonth}
              className="rounded-full hover:bg-gray-200"
            >
              <ChevronRight className="h-6 w-6" />
              <span className="sr-only">Next month</span>
            </Button>
          </div>
        </div>
        
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading calendar...</p>
          </div>
        ) : (
          <>
            <CalendarGrid days={calendarDays} />
            
            {/* Legend */}
            <div className="mt-6 flex items-center justify-center space-x-6">
              <div className="flex items-center">
                <span className="inline-block h-4 w-4 bg-primary rounded-full mr-2"></span>
                <span className="text-sm text-gray-600">Task Progress</span>
              </div>
              <div className="flex items-center">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-100 mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
                <span className="text-sm text-gray-600">Level 2 Achieved</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
