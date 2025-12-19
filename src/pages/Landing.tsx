import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Shield, Clock, Star, ArrowRight, Sparkle, Droplet } from 'lucide-react';
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

// Background images for carousel - using Unsplash cleaning service images
const backgroundImages = [
  'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1920&q=80', // Professional cleaning
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&q=80', // Clean home
  'https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?w=1920&q=80', // Sparkling clean
  'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1920&q=80', // Cleaning service
];

export default function Landing() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { translate } = useTranslator();
  const [services, setServices] = useState<Service[]>([]);
  const [currentBgIndex, setCurrentBgIndex] = useState(0);

  useEffect(() => {
    loadServices();
  }, []);

  // Change background image every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBgIndex((prev) => (prev + 1) % backgroundImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [backgroundImages.length]);


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

      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-[600px] md:min-h-[550px]">
        {/* Changing Background Images */}
        <div className="absolute inset-0">
          {backgroundImages.map((img, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                index === currentBgIndex ? 'opacity-100' : 'opacity-0'
              }`}
              style={{
                backgroundImage: `url(${img})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }}
            />
          ))}
          {/* Dark overlay for better text readability - stronger overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-black/75 via-black/70 to-black/75"></div>
          {/* Orange tint overlay */}
          <div className="absolute inset-0 bg-primary-600/15 mix-blend-overlay"></div>
        </div>

        {/* Content */}
        <div className="relative container mx-auto px-4 py-12 md:py-16 lg:py-20 text-center">
          {/* Floating icons animation - Hidden on mobile */}
          <div className="hidden md:block absolute top-20 left-10 animate-bounce-slow opacity-20">
            <Sparkle className="w-12 h-12 text-primary-400" />
          </div>
          <div className="hidden md:block absolute top-40 right-20 animate-bounce-slow animation-delay-1000 opacity-20">
            <Droplet className="w-10 h-10 text-primary-400" />
          </div>
          <div className="hidden md:block absolute bottom-20 left-1/4 animate-bounce-slow animation-delay-2000 opacity-20">
            <Sparkles className="w-14 h-14 text-primary-300" />
          </div>

          {/* Main Content with animations */}
          <div className="space-y-4 md:space-y-5 animate-fade-in-up">
            <div className="inline-block animate-pulse-slow">
              <span className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-white/90 backdrop-blur-sm text-primary-700 rounded-full text-xs md:text-sm font-semibold shadow-lg">
                <Sparkle className="w-3 h-3 md:w-4 md:h-4" />
                {t('hero.tagline')}
              </span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight animate-fade-in-up animation-delay-200 drop-shadow-2xl [text-shadow:_2px_2px_8px_rgb(0_0_0_/_80%)] px-2">
              {t('hero.title')}
              <br />
              <span className="text-white [text-shadow:_2px_2px_8px_rgb(0_0_0_/_80%)]">
                {t('hero.subtitle')}
              </span>
            </h1>
            
            <p className="text-base sm:text-lg md:text-xl text-white mb-3 max-w-3xl mx-auto leading-relaxed animate-fade-in-up animation-delay-400 [text-shadow:_1px_1px_4px_rgb(0_0_0_/_90%)] px-4">
              {t('hero.description')} <span className="font-semibold text-primary-200 [text-shadow:_1px_1px_4px_rgb(0_0_0_/_90%)]">Flash Bright</span>
              <br />
              {t('hero.description2')}
            </p>
            
            <p className="text-sm sm:text-base text-white max-w-2xl mx-auto animate-fade-in-up animation-delay-600 [text-shadow:_1px_1px_4px_rgb(0_0_0_/_90%)] px-4">
              {t('hero.cta')}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-2 animate-fade-in-up animation-delay-800 px-4">
              <Link to="/register" className="w-full sm:w-auto">
                <Button size="lg" className="group relative overflow-hidden shadow-xl w-full sm:w-auto">
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {t('hero.getStarted')}
                    <ArrowRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <span className="absolute inset-0 bg-gradient-to-r from-primary-600 to-primary-500 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                </Button>
              </Link>
              <Link to="/login" className="w-full sm:w-auto">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="!border-2 !border-white !bg-white/10 backdrop-blur-md !text-white hover:!bg-white/30 hover:!border-white shadow-xl font-semibold w-full sm:w-auto"
                >
                  {t('hero.signIn')}
                </Button>
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap justify-center items-center gap-3 md:gap-6 pt-4 text-xs sm:text-sm text-white animate-fade-in-up animation-delay-1000 [text-shadow:_1px_1px_3px_rgb(0_0_0_/_90%)] px-4">
              <div className="flex items-center gap-1.5 md:gap-2 bg-white/20 backdrop-blur-md px-2 md:px-3 py-1 md:py-1.5 rounded-full border border-white/30">
                <Shield className="w-4 h-4 text-primary-200" />
                <span className="font-medium">{t('hero.verified')}</span>
              </div>
              <div className="flex items-center gap-1.5 md:gap-2 bg-white/20 backdrop-blur-md px-2 md:px-3 py-1 md:py-1.5 rounded-full border border-white/30">
                <Star className="w-4 h-4 text-yellow-200" />
                <span className="font-medium">{t('hero.rated')}</span>
              </div>
              <div className="flex items-center gap-1.5 md:gap-2 bg-white/20 backdrop-blur-md px-2 md:px-3 py-1 md:py-1.5 rounded-full border border-white/30">
                <Clock className="w-4 h-4 text-primary-200" />
                <span className="font-medium">{t('hero.available')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Wave separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg className="relative block w-full h-16" viewBox="0 0 1200 120" preserveAspectRatio="none" fill="white">
            <path d="M0,0 C300,100 600,50 900,80 C1050,95 1125,100 1200,90 L1200,120 L0,120 Z"></path>
          </svg>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">
          {t('common.whyChooseUs')}
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">{t('common.wideRange')}</h3>
            <p className="text-gray-600">{t('common.wideRangeText')}</p>
          </div>
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">{t('common.verified')}</h3>
            <p className="text-gray-600">{t('common.verifiedText')}</p>
          </div>
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">{t('common.flexible')}</h3>
            <p className="text-gray-600">{t('common.flexibleText')}</p>
          </div>
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="w-8 h-8 text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">{t('common.quality')}</h3>
            <p className="text-gray-600">{t('common.qualityText')}</p>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">{t('services.title')}</h2>
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
                      {service.duration} hrs
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
                    View Details & Book
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

