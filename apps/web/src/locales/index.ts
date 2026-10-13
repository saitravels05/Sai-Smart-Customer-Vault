import { SupportedLanguage, TranslationDictionary } from '@sai/shared-types';
import { en } from './en';
import { ta } from './ta';

export const dictionaries: Record<SupportedLanguage, TranslationDictionary> = {
  en,
  ta,
};

export { en, ta };
