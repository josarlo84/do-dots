import { useAppContext } from "@/contexts/AppContext";
import { useLocation } from "wouter";
import PersonCard from "@/components/PersonCard";
import { Button } from "@/components/ui/button";

export default function MainPage() {
  const { people, isPeopleLoading, setSelectedPersonId } = useAppContext();
  const [_, navigate] = useLocation();

  const handlePersonSelect = (id: number) => {
    setSelectedPersonId(id);
    navigate(`/dashboard/${id}`);
  };

  const navigateToAdmin = () => {
    navigate('/admin');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <header className="mb-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-800">DoDots Family System</h1>
          <Button 
            variant="default"
            className="bg-gray-800 hover:bg-gray-700"
            onClick={navigateToAdmin}
          >
            Admin
          </Button>
        </div>
        <p className="text-gray-600 mt-2">Select a family member to view their dashboard.</p>
      </header>

      {/* Person cards grid */}
      {isPeopleLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border rounded-lg p-6 h-32 animate-pulse bg-gray-100"></div>
          ))}
        </div>
      ) : people.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-gray-50">
          <p className="text-gray-500 mb-4">No family members yet.</p>
          <Button onClick={navigateToAdmin}>
            Add Family Members in Admin
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {people.map((person) => (
            <PersonCard 
              key={person.id} 
              person={person} 
              onClick={() => handlePersonSelect(person.id)} 
            />
          ))}
        </div>
      )}
    </div>
  );
}
