"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { INTERFACE_LANGUAGE_KEY, readViewerLanguage, viewerText } from "@/lib/viewer-language";
import type { ViewerLanguage, ViewerMessage } from "@/lib/viewer-language";
import { useStudySession } from "./study-context";

const ViewerLanguageContext = createContext({
  language: "en" as ViewerLanguage,
  setLanguage: (_: ViewerLanguage) => {},
  storageAvailable: true,
});

export function useViewerLanguage() {
  const context = useContext(ViewerLanguageContext);
  return { ...context, t: (key: ViewerMessage) => viewerText(context.language, key) };
}

export function ViewerLanguageProvider({ children }: { children: ReactNode }) {
  const [preferred, selectLanguage] = useState<ViewerLanguage>("en");
  const { session } = useStudySession();
  const language = session ? "en" : preferred;
  const [storageAvailable, setStorageAvailable] = useState(true);

  useEffect(() => {
    try {
      selectLanguage(readViewerLanguage(localStorage.getItem(INTERFACE_LANGUAGE_KEY)));
    } catch {
      setStorageAvailable(false);
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const previous = { lang: root.lang, dir: root.dir, title: document.title };
    root.lang = language;
    // Keep navigation and player placement stable across interface languages.
    root.dir = "ltr";
    document.title = viewerText(language, "pageTitle");
    return () => {
      root.lang = previous.lang;
      root.dir = previous.dir;
      if (document.title === viewerText(language, "pageTitle")) document.title = previous.title;
    };
  }, [language]);

  function setLanguage(next: ViewerLanguage) {
    selectLanguage(next);
    try {
      localStorage.setItem(INTERFACE_LANGUAGE_KEY, next);
      setStorageAvailable(true);
    } catch {
      setStorageAvailable(false);
    }
  }

  return (
    <ViewerLanguageContext.Provider value={{language, setLanguage, storageAvailable}}>
      <div className="watch-viewer" lang={language} dir="ltr">
        <a className="skip-link" href="#main">{viewerText(language, "skip")}</a>
        {children}
      </div>
    </ViewerLanguageContext.Provider>
  );
}
