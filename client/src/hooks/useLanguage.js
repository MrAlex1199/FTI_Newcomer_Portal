import { useContext } from 'react';
import { LanguageContext } from './LanguageContext.jsx';

export default function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
}
