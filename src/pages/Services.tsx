import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, ArrowRight, Sparkles } from 'lucide-react';
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
  image?: string;
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
      {/* Services Section - Professional Cards */}
      <section className="bg-gradient-to-b from-white to-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{t('services.title')}</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">{t('services.subtitle')}</p>
          </div>
          
          {services.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 max-w-7xl mx-auto">
              {services.map((service) => (
                <Card
                  key={service._id}
                  className="overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer group border border-gray-200 bg-white"
                  onClick={() => handleServiceClick(service._id)}
                >
                    {/* Service Image */}
                    <div className="relative h-40 md:h-48 overflow-hidden bg-gradient-to-br from-primary-100 to-primary-50">
                      {service.image ? (
                        <img 
                          src={service.image} 
                          alt={translate(service.name)}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          onError={(e) => {
                            // Fallback if image fails to load
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="absolute inset-0 w-full h-full flex items-center justify-center">
                          <Sparkles className="w-16 h-16 text-primary-400 opacity-50" />
                        </div>
                      )}
                      {/* Overlay gradient on hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                      {/* Price badge */}
                      <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg z-10">
                        <span className="text-lg font-bold text-primary-600">${service.price}</span>
                        <span className="text-xs text-gray-500 ml-1">{t('services.from')}</span>
                      </div>
                    </div>
                  
                  {/* Service Info */}
                  <div className="p-4 md:p-5">
                    <h3 className="text-base md:text-lg font-bold text-gray-900 mb-1.5 group-hover:text-primary-600 transition-colors line-clamp-2 min-h-[3rem]">
                      {translate(service.name)}
                    </h3>
                    <p className="text-xs md:text-sm text-gray-500 mb-3 line-clamp-1">
                      {translate(service.category)}
                    </p>
                    
                    {/* Duration */}
                    <div className="flex items-center gap-1.5 text-xs text-gray-600 mb-4">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{service.duration} {t('services.hours')}</span>
                    </div>
                    
                    {/* View Details Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-sm font-semibold border-primary-200 text-primary-600 hover:bg-primary-600 hover:text-white hover:border-primary-600 transition-all duration-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleServiceClick(service._id);
                      }}
                    >
                      {t('services.viewDetails')}
                      <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">{t('services.loading')}</p>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}

