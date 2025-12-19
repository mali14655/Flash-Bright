import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  const { language } = useLanguage();
  const isRTL = language === 'ar';

  if (items.length === 0) return null;

  return (
    <nav 
      className={`flex items-center text-xs text-gray-500 ${isRTL ? 'space-x-reverse' : 'space-x-1'} overflow-x-auto`} 
      aria-label="Breadcrumb"
    >
      <Link
        to="/"
        className="flex items-center hover:text-primary-600 transition-colors flex-shrink-0"
      >
        <Home className="w-3 h-3 md:w-4 md:h-4" />
      </Link>
      {items.map((item, index) => (
        <div key={index} className="flex items-center flex-shrink-0">
          <ChevronRight className={`w-3 h-3 text-gray-300 ${isRTL ? 'mx-1 rotate-180' : 'mx-1'}`} />
          {item.path ? (
            <Link
              to={item.path}
              className="hover:text-primary-600 transition-colors whitespace-nowrap"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-600 whitespace-nowrap truncate max-w-[150px] md:max-w-none">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}

