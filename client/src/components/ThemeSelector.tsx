import { themeOptions } from "@/lib/utils";

interface ThemeSelectorProps {
  selectedTheme: string;
  onChange: (theme: string) => void;
}

export default function ThemeSelector({ selectedTheme, onChange }: ThemeSelectorProps) {
  return (
    <div className="container mx-auto px-4">
      <div className="flex items-center justify-center">
        <span className="text-sm text-gray-600 mr-3">Dashboard Theme:</span>
        <div className="flex space-x-2">
          {themeOptions.map((option) => (
            <button 
              key={option.id}
              onClick={() => onChange(option.id)} 
              className={`w-6 h-6 rounded-full border-2 ${option.bgClass} ${
                selectedTheme === option.id ? 'ring-2 ring-primary ring-offset-2' : ''
              }`}
              aria-label={`Set theme to ${option.name}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
