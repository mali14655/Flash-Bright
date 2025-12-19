import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface BreadcrumbItem {
  label: string;
  path: string;
}

interface BreadcrumbContextType {
  breadcrumbs: BreadcrumbItem[];
  addBreadcrumb: (label: string, path: string) => void;
  clearBreadcrumbs: () => void;
  getBackPath: () => string | null;
}

const BreadcrumbContext = createContext<BreadcrumbContextType | undefined>(undefined);

// Route configuration for breadcrumb labels
const routeLabels: Record<string, string> = {
  '/': 'nav.home',
  '/services': 'breadcrumb.services',
  '/about': 'breadcrumb.about',
  '/login': 'breadcrumb.login',
  '/register': 'breadcrumb.register',
};

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const [navigationHistory, setNavigationHistory] = useState<string[]>(['/']);
  const location = useLocation();
  const navigate = useNavigate();

  // Track navigation history
  useEffect(() => {
    setNavigationHistory((prev) => {
      // Don't add if it's the same page
      if (prev[prev.length - 1] === location.pathname) {
        return prev;
      }
      // Add new path to history
      return [...prev, location.pathname];
    });
  }, [location.pathname]);

  // Build breadcrumbs based on current path and history
  useEffect(() => {
    const path = location.pathname;
    
    // Don't show breadcrumbs on home page
    if (path === '/') {
      setBreadcrumbs([]);
      return;
    }

    const newBreadcrumbs: BreadcrumbItem[] = [];
    
    // Always start with Home
    newBreadcrumbs.push({ label: 'breadcrumb.home', path: '/' });

    // Handle different routes
    if (path === '/services') {
      newBreadcrumbs.push({ label: 'breadcrumb.services', path: '/services' });
    } else if (path === '/about') {
      newBreadcrumbs.push({ label: 'breadcrumb.about', path: '/about' });
    } else if (path === '/login') {
      newBreadcrumbs.push({ label: 'breadcrumb.login', path: '/login' });
    } else if (path === '/register') {
      newBreadcrumbs.push({ label: 'breadcrumb.register', path: '/register' });
    } else if (path.startsWith('/service/')) {
      // Service detail page
      // Check if user came from services page or home page
      const previousPath = navigationHistory[navigationHistory.length - 2];
      
      if (previousPath === '/services') {
        // Came from services page
        newBreadcrumbs.push({ label: 'breadcrumb.services', path: '/services' });
      }
      // If came from home, we don't add services in between
      // The service name will be added by the page component via addBreadcrumb
      // Don't overwrite existing breadcrumbs for service pages - let addBreadcrumb handle it
      setBreadcrumbs(newBreadcrumbs);
      return;
    }

    setBreadcrumbs(newBreadcrumbs);
  }, [location.pathname, navigationHistory]);

  const addBreadcrumb = (label: string, path: string) => {
    setBreadcrumbs((prev) => {
      // Check if breadcrumb already exists - update label if it does
      const existingIndex = prev.findIndex((b) => b.path === path);
      if (existingIndex !== -1) {
        // Update existing breadcrumb label
        const updated = [...prev];
        updated[existingIndex] = { label, path };
        return updated;
      }
      // Add new breadcrumb
      return [...prev, { label, path }];
    });
  };

  const clearBreadcrumbs = () => {
    setBreadcrumbs([]);
  };

  const getBackPath = (): string | null => {
    if (navigationHistory.length < 2) {
      return '/';
    }
    // Get the previous path from history
    const previousPath = navigationHistory[navigationHistory.length - 2];
    return previousPath;
  };

  return (
    <BreadcrumbContext.Provider
      value={{
        breadcrumbs,
        addBreadcrumb,
        clearBreadcrumbs,
        getBackPath,
      }}
    >
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumb() {
  const context = useContext(BreadcrumbContext);
  if (context === undefined) {
    throw new Error('useBreadcrumb must be used within a BreadcrumbProvider');
  }
  return context;
}

