import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import ReactCountryFlag from 'react-country-flag';
import { Menu, X } from 'lucide-react';
import Button from './ui/Button';
import { useLanguage } from '../context/LanguageContext';
import logo from '../asssets/logo.jpeg';

export default function Header() {
  const { t, language, setLanguage } = useLanguage();
  const location = useLocation();
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Close language menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.language-selector')) {
        setShowLangMenu(false);
      }
    };
    if (showLangMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showLangMenu]);

  // Close mobile menu when route changes
  useEffect(() => {
    setShowMobileMenu(false);
  }, [location.pathname]);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 md:py-4">
        <div className="flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2 md:gap-3" onClick={() => setShowMobileMenu(false)}>
            <img src={logo} alt="Flash Bright" className="h-8 w-8 md:h-10 md:w-10 rounded-lg object-cover" />
            <span className="text-lg md:text-2xl font-bold text-primary-600">Flash Bright</span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden lg:flex gap-4 xl:gap-6 items-center">
            <Link 
              to="/" 
              className={`transition-colors ${
                isActive('/') 
                  ? 'text-primary-600 font-semibold' 
                  : 'text-gray-700 hover:text-primary-600'
              }`}
            >
              {t('nav.home')}
            </Link>
            <Link 
              to="/services" 
              className={`transition-colors ${
                isActive('/services') 
                  ? 'text-primary-600 font-semibold' 
                  : 'text-gray-700 hover:text-primary-600'
              }`}
            >
              {t('nav.services')}
            </Link>
            <Link 
              to="/about" 
              className={`transition-colors ${
                isActive('/about') 
                  ? 'text-primary-600 font-semibold' 
                  : 'text-gray-700 hover:text-primary-600'
              }`}
            >
              {t('nav.about')}
            </Link>
            
            {/* Language Selector */}
            <div className="relative language-selector">
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1.5 md:py-2 rounded-md hover:bg-gray-100 transition-colors border border-gray-200"
              >
                <ReactCountryFlag
                  countryCode={language === 'en' ? 'GB' : 'AE'}
                  svg
                  style={{
                    width: '18px',
                    height: '18px',
                  }}
                  title={language === 'en' ? 'English' : 'العربية'}
                />
                <span className="text-xs md:text-sm font-medium text-gray-700 hidden sm:inline">{language === 'en' ? 'EN' : 'AR'}</span>
              </button>
              {showLangMenu && (
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg border border-gray-200 overflow-hidden z-50">
                  <button
                    onClick={() => {
                      setLanguage('en');
                      setShowLangMenu(false);
                    }}
                    className={`w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-primary-50 transition-colors ${
                      language === 'en' ? 'bg-primary-50 text-primary-600 font-semibold' : 'text-gray-700'
                    }`}
                  >
                    <ReactCountryFlag
                      countryCode="GB"
                      svg
                      style={{
                        width: '18px',
                        height: '18px',
                      }}
                      title="English"
                    />
                    <span>English</span>
                  </button>
                  <button
                    onClick={() => {
                      setLanguage('ar');
                      setShowLangMenu(false);
                    }}
                    className={`w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-primary-50 transition-colors ${
                      language === 'ar' ? 'bg-primary-50 text-primary-600 font-semibold' : 'text-gray-700'
                    }`}
                  >
                    <ReactCountryFlag
                      countryCode="AE"
                      svg
                      style={{
                        width: '18px',
                        height: '18px',
                      }}
                      title="العربية"
                    />
                    <span>العربية</span>
                  </button>
                </div>
              )}
            </div>

            <Link to="/login">
              <Button variant="ghost" className="text-sm">{t('nav.login')}</Button>
            </Link>
            <Link to="/register">
              <Button className="text-sm">{t('nav.signup')}</Button>
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="lg:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            {showMobileMenu ? (
              <X className="w-6 h-6 text-gray-700" />
            ) : (
              <Menu className="w-6 h-6 text-gray-700" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        <div 
          className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            showMobileMenu ? 'max-h-[600px] opacity-100 mt-4 pb-4 border-t border-gray-200 pt-4' : 'max-h-0 opacity-0 mt-0 pb-0 pt-0'
          }`}
        >
          <div className="flex flex-col gap-3">
            <Link 
              to="/" 
              onClick={() => setShowMobileMenu(false)}
              className={`px-3 py-2 rounded-md transition-colors ${
                isActive('/') 
                  ? 'text-primary-600 font-semibold bg-primary-50' 
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {t('nav.home')}
            </Link>
            <Link 
              to="/services" 
              onClick={() => setShowMobileMenu(false)}
              className={`px-3 py-2 rounded-md transition-colors ${
                isActive('/services') 
                  ? 'text-primary-600 font-semibold bg-primary-50' 
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {t('nav.services')}
            </Link>
            <Link 
              to="/about" 
              onClick={() => setShowMobileMenu(false)}
              className={`px-3 py-2 rounded-md transition-colors ${
                isActive('/about') 
                  ? 'text-primary-600 font-semibold bg-primary-50' 
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {t('nav.about')}
            </Link>
            
            <div className="px-3 py-2">
              <div className="relative language-selector">
                <button
                  onClick={() => setShowLangMenu(!showLangMenu)}
                  className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors border border-gray-200 w-full justify-between"
                >
                  <div className="flex items-center gap-2">
                    <ReactCountryFlag
                      countryCode={language === 'en' ? 'GB' : 'AE'}
                      svg
                      style={{
                        width: '18px',
                        height: '18px',
                      }}
                      title={language === 'en' ? 'English' : 'العربية'}
                    />
                    <span className="text-sm font-medium text-gray-700">{language === 'en' ? 'English' : 'العربية'}</span>
                  </div>
                  <span className="text-xs text-gray-500">{language === 'en' ? 'EN' : 'AR'}</span>
                </button>
                {showLangMenu && (
                  <div className="absolute left-0 right-0 mt-2 bg-white rounded-md shadow-lg border border-gray-200 overflow-hidden z-50">
                    <button
                      onClick={() => {
                        setLanguage('en');
                        setShowLangMenu(false);
                      }}
                      className={`w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-primary-50 transition-colors ${
                        language === 'en' ? 'bg-primary-50 text-primary-600 font-semibold' : 'text-gray-700'
                      }`}
                    >
                      <ReactCountryFlag
                        countryCode="GB"
                        svg
                        style={{
                          width: '18px',
                          height: '18px',
                        }}
                        title="English"
                      />
                      <span>English</span>
                    </button>
                    <button
                      onClick={() => {
                        setLanguage('ar');
                        setShowLangMenu(false);
                      }}
                      className={`w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-primary-50 transition-colors ${
                        language === 'ar' ? 'bg-primary-50 text-primary-600 font-semibold' : 'text-gray-700'
                      }`}
                    >
                      <ReactCountryFlag
                        countryCode="AE"
                        svg
                        style={{
                          width: '18px',
                          height: '18px',
                        }}
                        title="العربية"
                      />
                      <span>العربية</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2 px-3 pt-2">
              <Link to="/login" onClick={() => setShowMobileMenu(false)}>
                <Button variant="ghost" className="w-full justify-center">{t('nav.login')}</Button>
              </Link>
              <Link to="/register" onClick={() => setShowMobileMenu(false)}>
                <Button className="w-full justify-center">{t('nav.signup')}</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

