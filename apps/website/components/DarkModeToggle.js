import { useTheme } from './Theme';
import { FaSun, FaMoon } from 'react-icons/fa';

export default function DarkModeToggle() {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700"
    >
      {isDarkMode ? (
        <FaSun className="w-6 h-6" />
      ) : (
        <FaMoon className="w-6 h-6" />
      )}
    </button>
  );
}
