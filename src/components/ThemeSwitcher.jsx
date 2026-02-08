import React from "react";
import { useTheme, themes } from "../context/ThemeContext";
import { Moon, Sun } from "lucide-react";

const ThemeSwitcher = () => {
  const { currentTheme, isDarkMode, toggleDarkMode, changeTheme } = useTheme();

  return (
    <div className="p-4 bg-bg-surface rounded-2xl shadow-sm border border-bg-primary/10">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-sm">Theme Settings</h3>
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-xl bg-bg-primary hover:bg-primary/10 transition-colors"
        >
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      <div className="flex gap-2">
        {Object.keys(themes).map((themeName) => (
          <button
            key={themeName}
            onClick={() => changeTheme(themeName)}
            className={`
              w-8 h-8 rounded-full border-2 transition-all
              ${currentTheme === themeName ? "border-primary scale-110 shadow-lg" : "border-transparent hover:scale-105"}
            `}
            style={{ backgroundColor: themes[themeName].primary }}
          />
        ))}
      </div>
    </div>
  );
};

export default ThemeSwitcher;
