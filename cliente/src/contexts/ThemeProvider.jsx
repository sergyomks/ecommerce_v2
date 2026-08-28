import { useEffect, useState } from "react";
import { ThemeContext } from "./ThemeContext";

const leerTemaGuardado = () => {
  if (typeof window === "undefined") return "light";
  return localStorage.getItem("theme") || "light";
};

const aplicarTema = (value) => {
  const root = window.document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(value);
  root.style.colorScheme = value;
  localStorage.setItem("theme", value);
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(leerTemaGuardado);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      aplicarTema(next);
      return next;
    });
  };

  useEffect(() => {
    aplicarTema(theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
