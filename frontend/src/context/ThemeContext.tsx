import React, { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";

interface ThemeContextType {
  isDark: boolean;
  setIsDark: React.Dispatch<React.SetStateAction<boolean>>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [isDark, setIsDarkRaw] = useState<boolean>(() => {
    // Read from localStorage on initial render
    const saved = localStorage.getItem("tt_theme");
    return saved ? saved === "dark" : true;
  });

  const setIsDark: React.Dispatch<React.SetStateAction<boolean>> = (val) => {
    setIsDarkRaw((prev) => {
      const next = typeof val === "function" ? val(prev) : val;
      localStorage.setItem("tt_theme", next ? "dark" : "light");
      return next;
    });
  };

  // Optional: Listen for storage events if toggled in another tab
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "tt_theme") {
        setIsDarkRaw(e.newValue !== "light");
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  return (
    <ThemeContext.Provider value={{ isDark, setIsDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
