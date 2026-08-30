import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { enumLabels, humanize, translate } from '../i18n/messages.js';

const STORAGE_KEY = 'fti-language';
const SUPPORTED = ['th', 'en'];
export const LanguageContext = createContext(null);

function readLanguage() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return SUPPORTED.includes(saved) ? saved : 'th';
  } catch {
    return 'th';
  }
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(readLanguage);
  const setLanguage = useCallback((next) => {
    if (!SUPPORTED.includes(next)) return;
    setLanguageState(next);
    try { window.localStorage.setItem(STORAGE_KEY, next); } catch { /* storage can be unavailable */ }
  }, []);
  useEffect(() => { document.documentElement.lang = language; }, [language]);
  const value = useMemo(() => ({
    language,
    setLanguage,
    t: (key, variables) => translate(language, key, variables),
    label: (value) => {
      const key = enumLabels.roles[value] || enumLabels.status[value] || enumLabels.sections[value] || enumLabels.announcementCategories[value] || enumLabels.itHelpTopics[value] || value;
      return translate(language, key) === key ? humanize(value) : translate(language, key);
    },
    locale: language === 'th' ? 'th-TH' : 'en-US',
  }), [language, setLanguage]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
