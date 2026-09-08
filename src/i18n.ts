import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '../public/locales/en/translation.json';
import bn from '../public/locales/bn/translation.json';
import type { Locale } from '@/types';

export const LOCALE_KEY = 'locale';

export function storedLocale(): Locale | null {
  if (typeof localStorage === 'undefined') return null;
  const v = localStorage.getItem(LOCALE_KEY);
  return v === 'bn' || v === 'en' ? v : null;
}

export function persistLocale(locale: Locale) {
  localStorage.setItem(LOCALE_KEY, locale);
  applyLocale(locale);
}

export function applyLocale(locale: Locale) {
  void i18n.changeLanguage(locale);
  if (typeof document !== 'undefined') document.documentElement.lang = locale;
}

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    bn: { translation: bn },
  },
  lng: storedLocale() ?? 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnEmptyString: false,
});

if (typeof document !== 'undefined') {
  document.documentElement.lang = storedLocale() ?? 'en';
}

export default i18n;
