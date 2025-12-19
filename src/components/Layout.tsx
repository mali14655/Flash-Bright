import { ReactNode, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Header from './Header';
import Breadcrumb from './Breadcrumb';
import Button from './ui/Button';
import { useLanguage } from '../context/LanguageContext';
import { useBreadcrumb } from '../context/BreadcrumbContext';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface LayoutProps {
  children: ReactNode;
  breadcrumbItems?: BreadcrumbItem[];
  showBackButton?: boolean;
  backButtonPath?: string;
  backButtonLabel?: string;
}

export default function Layout({ 
  children, 
  breadcrumbItems = [],
  showBackButton = false,
  backButtonPath
}: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const { breadcrumbs: contextBreadcrumbs, getBackPath } = useBreadcrumb();

  // Use context breadcrumbs if available, otherwise use provided breadcrumbItems
  const activeBreadcrumbs = contextBreadcrumbs.length > 0 ? contextBreadcrumbs : breadcrumbItems;

  const handleBack = () => {
    if (backButtonPath) {
      navigate(backButtonPath);
    } else {
      const backPath = getBackPath();
      if (backPath) {
        navigate(backPath);
      } else {
        navigate(-1);
      }
    }
  };

  // Don't show breadcrumb on home page
  const showBreadcrumb = activeBreadcrumbs.length > 0 || showBackButton;
  const isHomePage = location.pathname === '/';

  // Smooth scroll to top when route changes
  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex flex-col">
      <Header />
      
      {/* Breadcrumb Strip - Only show on non-home pages */}
      {!isHomePage && showBreadcrumb && (
        <div className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-4 py-2 md:py-3">
            <div className="flex items-center gap-2 md:gap-4 flex-wrap">
              {showBackButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm"
                >
                  <ArrowLeft className="w-3 h-3 md:w-4 md:h-4" />
                  <span>{t('common.back')}</span>
                </Button>
              )}
              {activeBreadcrumbs.length > 0 && (
                <div className="flex-1 min-w-0">
                  <Breadcrumb items={activeBreadcrumbs.map(b => ({ 
                    label: t(b.label), 
                    path: b.path 
                  }))} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">{t('footer.copyright')}</p>
        </div>
      </footer>
    </div>
  );
}

