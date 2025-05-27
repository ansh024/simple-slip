import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Translation resources
import translationEN from './locales/en.json';
import translationHI from './locales/hi.json';
import translationPA from './locales/pa.json';
import translationGU from './locales/gu.json';

const resources = {
  english: {
    translation: translationEN
  },
  hindi: {
    translation: translationHI
  },
  punjabi: {
    translation: translationPA
  },
  gujarati: {
    translation: translationGU
  }
};

i18n
  // detect user language
  .use(LanguageDetector)
  // pass the i18n instance to react-i18next
  .use(initReactI18next)
  // init i18next
  .init({
    resources,
    fallbackLng: 'english',
    debug: process.env.NODE_ENV === 'development',
    
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
    
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  });

export default i18n;
