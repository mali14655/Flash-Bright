import { ReactNode, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Header from './Header';
import Breadcrumb from './Breadcrumb';
import Button from './ui/Button';
import { useLanguage } from '../context/LanguageContext';
import { useBreadcrumb } from '../context/BreadcrumbContext';
import logo from '../asssets/logo.jpeg';

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
      <footer className="bg-gray-900 text-white mt-auto">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            {/* Company Info */}
            <div>
              <Link to="/" className="flex items-center gap-3 mb-4">
                <img src={logo} alt="Flash Bright" className="h-10 w-10 rounded-lg object-cover" />
                <h3 className="text-lg font-bold text-primary-400">Flash Bright</h3>
              </Link>
              <p className="text-gray-400 text-sm leading-relaxed">
                Professional cleaning services at your doorstep. Quality guaranteed, satisfaction assured.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-base font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="/" className="text-gray-400 hover:text-primary-400 transition-colors">Home</a>
                </li>
                <li>
                  <a href="/services" className="text-gray-400 hover:text-primary-400 transition-colors">Services</a>
                </li>
                <li>
                  <a href="/about" className="text-gray-400 hover:text-primary-400 transition-colors">About Us</a>
                </li>
                <li>
                  <a href="/login" className="text-gray-400 hover:text-primary-400 transition-colors">Login</a>
                </li>
              </ul>
            </div>

            {/* Services */}
            <div>
              <h4 className="text-base font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="/services" className="text-gray-400 hover:text-primary-400 transition-colors">Home Cleaning</a>
                </li>
                <li>
                  <a href="/services" className="text-gray-400 hover:text-primary-400 transition-colors">Office Cleaning</a>
                </li>
                <li>
                  <a href="/services" className="text-gray-400 hover:text-primary-400 transition-colors">Deep Cleaning</a>
                </li>
                <li>
                  <a href="/services" className="text-gray-400 hover:text-primary-400 transition-colors">All Services</a>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-base font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Email: info@flashbright.com</li>
                <li>Phone: +971 XX XXX XXXX</li>
                <li className="pt-2">
                  <div className="flex gap-3">
                    <a href="#" className="text-gray-400 hover:text-primary-400 transition-colors" aria-label="Facebook">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    </a>
                    <a href="#" className="text-gray-400 hover:text-primary-400 transition-colors" aria-label="Instagram">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                    </a>
                    <a href="#" className="text-gray-400 hover:text-primary-400 transition-colors" aria-label="Twitter">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                      </svg>
                    </a>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-gray-400 text-sm">{t('footer.copyright')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

