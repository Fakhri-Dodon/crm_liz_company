import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// 1. Import file JSON kamu di sini
import idTranslation from './locales/id.json';
import enTranslation from './locales/en.json';

const resources = {
  en: {
    translation: enTranslation
  },
  id: {
    translation: idTranslation
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('i18nextLng') || 'id',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;