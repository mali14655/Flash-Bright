import { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import Button from './ui/Button';
import { LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import logo from '../asssets/logo.jpeg';

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
}

export default function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const getRoleColor = () => {
    switch (user?.role) {
      case 'admin':
        return 'bg-purple-600';
      case 'partner':
        return 'bg-primary-600';
      case 'employee':
        return 'bg-green-600';
      default:
        return 'bg-primary-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className={`${getRoleColor()} text-white shadow-lg`}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link to="/" className="flex items-center gap-2 hover:opacity-80">
                <img src={logo} alt="Flash Bright" className="h-8 w-8 rounded-lg object-cover" />
                <span className="font-bold text-lg">Flash Bright</span>
              </Link>
              <span className="text-sm opacity-90">|</span>
              <span className="text-sm font-medium capitalize">{title} Dashboard</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm">
                {user?.name} ({user?.role})
              </span>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-white hover:bg-white/20">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}

