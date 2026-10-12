import { useEffect, useState } from "react";
import { Moon, Sun } from "@phosphor-icons/react";

type Theme = "light" | "dark";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() =>
    document.documentElement.dataset.theme === "dark" ? "dark" : "light"
  );
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem("theme", theme); } catch { /* Keep the theme usable without storage. */ }
  }, [theme]);
  useEffect(() => {
    const syncTheme = (event: StorageEvent) => {
      if (event.key === "theme" && (event.newValue === "light" || event.newValue === "dark")) {
        setTheme(event.newValue);
      }
    };
    window.addEventListener("storage", syncTheme);
    return () => window.removeEventListener("storage", syncTheme);
  }, []);
  return <button className="icon-button theme-toggle" title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"} aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"} onClick={() => setTheme(t => t === "light" ? "dark" : "light")}>
    {theme === "light" ? <Moon size={21} /> : <Sun size={21} />}
  </button>;
}
