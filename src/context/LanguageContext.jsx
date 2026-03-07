import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "pizzeria_language";

function normalizeLanguage(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "en") return "en";
  return "fr";
}

function getInitialLanguage() {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored) return normalizeLanguage(stored);
  return "fr";
}

export const LanguageContext = createContext({
  language: "fr",
  locale: "fr-FR",
  setLanguage: () => {},
  toggleLanguage: () => {},
  tr: (frText, enText) => (enText ? enText : frText),
});

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(getInitialLanguage);

  const setLanguage = useCallback((nextLanguage) => {
    setLanguageState(normalizeLanguage(nextLanguage));
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguageState((prev) => (prev === "fr" ? "en" : "fr"));
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  const tr = useCallback(
    (frText, enText) => (language === "en" ? enText || frText : frText),
    [language]
  );

  const value = useMemo(
    () => ({
      language,
      locale: language === "en" ? "en-US" : "fr-FR",
      setLanguage,
      toggleLanguage,
      tr,
    }),
    [language, setLanguage, toggleLanguage, tr]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}
