import React, { createContext, useState, useContext, useEffect } from "react";

export const themes = {
  green: {
    primary: "rgb(63, 105, 0)",
    onPrimary: "rgb(255, 255, 255)",
    bgPrimary: "rgb(246, 246, 246)",
    bgSurface: "rgb(255, 255, 255)",
    textPrimary: "rgb(27, 28, 24)",
    textSecondary: "rgb(68, 72, 61)",
    dark: {
      primary: "rgb(151, 217, 69)",
      bgPrimary: "rgb(18, 22, 17)",
      bgSurface: "rgb(28, 34, 26)",
      textPrimary: "rgb(227, 227, 219)",
      textSecondary: "rgb(197, 200, 186)",
    },
  },
  blue: {
    primary: "rgb(0, 99, 154)",
    onPrimary: "rgb(255, 255, 255)",
    bgPrimary: "rgb(246, 246, 246)",
    bgSurface: "rgb(255, 255, 255)",
    textPrimary: "rgb(26, 27, 30)",
    textSecondary: "rgb(68, 71, 78)",
    dark: {
      primary: "rgb(170, 199, 255)",
      bgPrimary: "rgb(17, 20, 24)",
      bgSurface: "rgb(27, 32, 38)",
      textPrimary: "rgb(227, 226, 230)",
      textSecondary: "rgb(196, 198, 208)",
    },
  },
  purple: {
    primary: "rgb(108, 87, 122)",
    onPrimary: "rgb(255, 255, 255)",
    bgPrimary: "rgb(246, 246, 246)",
    bgSurface: "rgb(255, 255, 255)",
    textPrimary: "rgb(27, 28, 24)",
    textSecondary: "rgb(68, 72, 61)",
    dark: {
      primary: "rgb(239, 176, 255)",
      bgPrimary: "rgb(18, 22, 17)",
      bgSurface: "rgb(28, 34, 26)",
      textPrimary: "rgb(227, 227, 219)",
      textSecondary: "rgb(197, 200, 186)",
    },
  },
  red: {
    primary: "rgb(149, 43, 41)",
    onPrimary: "rgb(255, 255, 255)",
    bgPrimary: "rgb(246, 246, 246)",
    bgSurface: "rgb(255, 255, 255)",
    textPrimary: "rgb(32, 26, 24)",
    textSecondary: "rgb(83, 67, 63)",
    dark: {
      primary: "rgb(255, 181, 160)",
      bgPrimary: "rgb(23, 18, 17)",
      bgSurface: "rgb(33, 22, 21)",
      textPrimary: "rgb(237, 224, 220)",
      textSecondary: "rgb(216, 194, 188)",
    },
  },
  orange: {
    primary: "rgb(139, 80, 0)",
    onPrimary: "rgb(255, 255, 255)",
    bgPrimary: "rgb(246, 246, 246)",
    bgSurface: "rgb(255, 255, 255)",
    textPrimary: "rgb(32, 27, 22)",
    textSecondary: "rgb(81, 69, 58)",
    dark: {
      primary: "rgb(255, 184, 114)",
      bgPrimary: "rgb(24, 21, 18)",
      bgSurface: "rgb(34, 30, 26)",
      textPrimary: "rgb(235, 224, 217)",
      textSecondary: "rgb(213, 195, 181)",
    },
  },
  yellow: {
    primary: "rgb(110, 93, 0)",
    onPrimary: "rgb(255, 255, 255)",
    bgPrimary: "rgb(246, 246, 246)",
    bgSurface: "rgb(255, 255, 255)",
    textPrimary: "rgb(29, 27, 22)",
    textSecondary: "rgb(75, 71, 57)",
    dark: {
      primary: "rgb(229, 197, 36)",
      bgPrimary: "rgb(20, 18, 14)",
      bgSurface: "rgb(30, 27, 21)",
      textPrimary: "rgb(231, 226, 217)",
      textSecondary: "rgb(205, 198, 180)",
    },
  },
};

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState(
    localStorage.getItem("prism-theme") || "green",
  );
  const [isDarkMode, setIsDarkMode] = useState(
    localStorage.getItem("prism-dark") === "true",
  );

  useEffect(() => {
    const themeData = themes[currentTheme];
    const colors = isDarkMode ? themeData.dark : themeData;

    const root = document.documentElement;
    root.style.setProperty("--primary", colors.primary);
    root.style.setProperty("--on-primary", themeData.onPrimary);
    root.style.setProperty("--bg-primary", colors.bgPrimary);
    root.style.setProperty("--bg-surface", colors.bgSurface);
    root.style.setProperty("--text-primary", colors.textPrimary);
    root.style.setProperty("--text-secondary", colors.textSecondary);

    if (isDarkMode) {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }

    localStorage.setItem("prism-theme", currentTheme);
    localStorage.setItem("prism-dark", isDarkMode);
  }, [currentTheme, isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);
  const changeTheme = (themeName) => setCurrentTheme(themeName);

  return (
    <ThemeContext.Provider
      value={{ currentTheme, isDarkMode, toggleDarkMode, changeTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
