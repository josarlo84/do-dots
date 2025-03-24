import { createContext, useContext, useState, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { PersonWithTasks, GlobalTask } from "@shared/schema";

interface AppContextType {
  selectedPersonId: number | null;
  setSelectedPersonId: (id: number | null) => void;
  people: PersonWithTasks[];
  isPeopleLoading: boolean;
  globalTasks: GlobalTask[];
  isGlobalTasksLoading: boolean;
  refreshData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [selectedPersonId, setSelectedPersonId] = useState<number | null>(null);
  
  const { 
    data: people = [], 
    isLoading: isPeopleLoading,
    refetch: refetchPeople
  } = useQuery({
    queryKey: ['/api/people'],
    staleTime: 10000, // 10 seconds
  });
  
  const { 
    data: globalTasks = [], 
    isLoading: isGlobalTasksLoading,
    refetch: refetchGlobalTasks
  } = useQuery({
    queryKey: ['/api/global-tasks'],
    staleTime: 10000, // 10 seconds
  });
  
  const refreshData = () => {
    refetchPeople();
    refetchGlobalTasks();
  };
  
  return (
    <AppContext.Provider value={{
      selectedPersonId,
      setSelectedPersonId,
      people,
      isPeopleLoading,
      globalTasks,
      isGlobalTasksLoading,
      refreshData
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
}
