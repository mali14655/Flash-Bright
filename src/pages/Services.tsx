import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, ArrowRight } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Layout from '../components/Layout';
import api from '../lib/api';
import { useLanguage } from '../context/LanguageContext';
import { translateServices, useTranslator } from '../lib/translator';

interface Service {
  _id: string;
  name: string;
  category: string;
  price: number;
  duration: number;
  description: string;
}

export default function Services() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { translate } = useTranslator();
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const response = await api.get('/services');
      // Translate services based on current language
      const translatedServices = translateServices(response.data, language);
      setServices(translatedServices);
    } catch (error) {
      console.error('Failed to load services');
    }
  };

  // Reload services when language changes
  useEffect(() => {
    loadServices();
  }, [language]);

  const handleServiceClick = (serviceId: string) => {
    navigate(`/service/${serviceId}`);
  };

  return (
    <Layout>
      {/* Services Section */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-4">{t('services.title')}</h2>
          <p className="text-center text-gray-600 mb-12">{t('services.subtitle')}</p>
          {services.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {services.map((service) => (
                <Card
                  key={service._id}
                  className="p-6 hover:shadow-lg transition-shadow cursor-pointer group"
                  onClick={() => handleServiceClick(service._id)}
                >
                  <h3 className="text-xl font-semibold mb-2 group-hover:text-primary-600 transition-colors">
                    {translate(service.name)}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">{translate(service.category)}</p>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-2xl font-bold text-primary-600">${service.price}</p>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="w-4 h-4 mr-1" />
                      {service.duration} {t('services.hours')}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full group-hover:bg-primary-600 group-hover:text-white transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleServiceClick(service._id);
                    }}
                  >
                    {t('services.viewDetails')}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500">{t('services.loading')}</p>
          )}
        </div>
      </section>
    </Layout>
  );
}

