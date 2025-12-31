import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import Layout from '../components/Layout';
import toast from 'react-hot-toast';
import { useLanguage } from '../context/LanguageContext';
import logo from '../asssets/logo.jpeg';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      toast.success(t('common.success'));
      navigate(`/${useAuthStore.getState().user?.role || 'customer'}`);
    } catch (error: any) {
      toast.error(error.message || t('common.error'));
    }
  };

  return (
    <Layout 
      showBackButton={true}
    >
      <div className="min-h-screen flex items-center justify-center px-4 py-8">
        <div className="container mx-auto max-w-md">
          <Card className="w-full p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img src={logo} alt="Flash Bright" className="h-16 w-16 rounded-lg object-cover" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('login.title')}</h1>
            <p className="text-gray-600">{t('login.subtitle')}</p>
          </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              {t('login.email')}
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="customer@demo.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              {t('login.password')}
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="password123"
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? t('login.signingIn') : t('login.signIn')}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          {t('login.noAccount')}{' '}
          <Link to="/register" className="text-primary-600 hover:underline font-medium">
            {t('login.signUp')}
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center mb-2">{t('login.demoAccounts')}</p>
          <div className="text-xs text-gray-600 space-y-1">
            <p>{t('login.customer')}: customer@demo.com</p>
            <p>{t('login.admin')}: admin@demo.com</p>
            <p>{t('login.partner')}: partner@demo.com</p>
            <p>{t('login.employee')}: employee@demo.com</p>
            <p className="text-center mt-2 font-medium">{t('login.passwordLabel')}: password123</p>
          </div>
        </div>
        </Card>
        </div>
      </div>
    </Layout>
  );
}

