import { useLanguage } from '../context/LanguageContext';

/**
 * Translates database content dynamically
 * Supports multilingual fields in format: { en: 'English', ar: 'Arabic' }
 * or falls back to string if it's a simple string
 */
export function translateContent(content: any, language: 'en' | 'ar' = 'en'): string {
  if (!content) return '';
  
  // If content is an object with language keys
  if (typeof content === 'object' && !Array.isArray(content)) {
    // Check if it has language-specific keys
    if (content[language]) {
      return content[language];
    }
    // Fallback to English
    if (content.en) {
      return content.en;
    }
    // Fallback to Arabic if English not available
    if (content.ar) {
      return content.ar;
    }
    // If it's an object but not a translation object, try to stringify
    return JSON.stringify(content);
  }
  
  // If content is a string, return as is
  if (typeof content === 'string') {
    return content;
  }
  
  // For arrays, translate each item
  if (Array.isArray(content)) {
    return content.map(item => translateContent(item, language)).join(', ');
  }
  
  return String(content);
}

/**
 * Hook to translate database content
 */
export function useTranslator() {
  const { language } = useLanguage();
  
  const translate = (content: any): string => {
    return translateContent(content, language);
  };
  
  return { translate, language };
}

/**
 * Translates a service object
 */
export function translateService(service: any, language: 'en' | 'ar' = 'en') {
  if (!service) return service;
  
  return {
    ...service,
    name: translateContent(service.name, language),
    category: translateContent(service.category, language),
    description: translateContent(service.description, language),
    extraRequirements: service.extraRequirements?.map((req: any) => ({
      ...req,
      name: translateContent(req.name, language)
    })) || []
  };
}

/**
 * Translates an array of services
 */
export function translateServices(services: any[], language: 'en' | 'ar' = 'en') {
  return services.map(service => translateService(service, language));
}


