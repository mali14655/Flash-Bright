import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import Layout from '../components/Layout';
import toast from 'react-hot-toast';
import { useLanguage } from '../context/LanguageContext';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'customer',
    registrationCode: '',
  });
  const { register, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await register(
        formData.email,
        formData.password,
        formData.name,
        formData.role,
        formData.role === 'partner' ? formData.registrationCode : undefined
      );
      toast.success(t('common.success'));
      navigate(`/${formData.role}`);
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('register.title')}</h1>
            <p className="text-gray-600">{t('register.subtitle')}</p>
          </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              {t('register.fullName')}
            </label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              {t('register.email')}
            </label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              {t('register.password')}
            </label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              minLength={6}
            />
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
              {t('register.role')}
            </label>
            <select
              id="role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value, registrationCode: '' })}
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              required
            >
              <option value="customer">{t('register.customer')}</option>
              <option value="partner">{t('register.partner')}</option>
              <option value="employee">{t('register.employee')}</option>
            </select>
          </div>

          {formData.role === 'partner' && (
            <div>
              <label htmlFor="registrationCode" className="block text-sm font-medium text-gray-700 mb-1">
                {t('register.registrationCode')}
              </label>
              <Input
                id="registrationCode"
                type="text"
                value={formData.registrationCode}
                onChange={(e) => setFormData({ ...formData, registrationCode: e.target.value.toUpperCase() })}
                required
              />
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? t('register.creatingAccount') : t('register.signUp')}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          {t('register.haveAccount')}{' '}
          <Link to="/login" className="text-primary-600 hover:underline font-medium">
            {t('register.signIn')}
          </Link>
        </div>
        </Card>
        </div>
      </div>
    </Layout>
  );
}

