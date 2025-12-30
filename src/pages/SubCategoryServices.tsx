import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, ArrowRight, Sparkles } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Layout from '../components/Layout';
import api from '../lib/api';
import { useLanguage } from '../context/LanguageContext';
import { translateServices, useTranslator } from '../lib/translator';
import toast from 'react-hot-toast';

interface Service {
  _id: string;
  name: string;
  category: string;
  pricing_model?: 'fixed' | 'configurable';
  fixed_price?: number;
  base_fee?: number;
  hourly_rate_per_pro?: number;
  price: number;
  duration: number;
  description: string;
  image?: string;
}

interface SubCategory {
  _id: string;
  name: string;
  description: string;
  image: string;
  categoryId: string | { _id: string; name: string };
}

export default function SubCategoryServices() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { translate } = useTranslator();
  const [services, setServices] = useState<Service[]>([]);
  const [subCategory, setSubCategory] = useState<SubCategory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadSubCategoryAndServices();
    }
  }, [id]);

  const loadSubCategoryAndServices = async () => {
    try {
      setLoading(true);
      // Load subcategory
      const subCatResponse = await api.get(`/categories/subcategories/${id}`);
      setSubCategory(subCatResponse.data);
      
      // Load all services and filter by subCategoryId
      const servicesResponse = await api.get('/services');
      const filteredServices = servicesResponse.data.filter((service: any) => 
        service.subCategoryId === id || service.subCategoryId?._id === id
      );
      const translatedServices = translateServices(filteredServices, language);
      setServices(translatedServices);
    } catch (error) {
      console.error('Failed to load subcategory and services');
      toast.error('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const handleServiceClick = (serviceId: string) => {
    navigate(`/service/${serviceId}`);
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </Layout>
    );
  }

  if (!subCategory) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-gray-600">Sub-category not found</p>
          <Button onClick={() => navigate('/')} className="mt-4">Go Home</Button>
        </div>
      </Layout>
    );
  }

  const categoryName = typeof subCategory.categoryId === 'object' 
    ? subCategory.categoryId.name 
    : 'Category';

  return (
    <Layout>
      {/* Sub-Category Header */}
      <section className="bg-gradient-to-b from-white to-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <button
              onClick={() => navigate('/')}
              className="text-primary-600 hover:text-primary-700 mb-4 flex items-center gap-2"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
              Back to Home
            </button>
            <div className="flex items-center gap-4 mb-4">
              <span className="text-sm text-gray-600">{categoryName}</span>
              <span className="text-gray-400">/</span>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                {typeof subCategory.name === 'object' 
                  ? translate(subCategory.name) 
                  : subCategory.name}
              </h1>
            </div>
            {subCategory.description && (
              <p className="text-lg text-gray-600 max-w-3xl">
                {typeof subCategory.description === 'object' 
                  ? translate(subCategory.description) 
                  : subCategory.description}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="bg-gradient-to-b from-gray-50 to-white py-16">
        <div className="container mx-auto px-4">
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
                      <div className="flex items-center gap-1">
                        <span className="text-lg font-bold text-primary-600">
                          AED {service.pricing_model === 'fixed' 
                            ? (service.fixed_price || service.price)
                            : (service.base_fee || service.price)}
                        </span>
                      </div>
                    </div>
                    {/* Pricing model badge */}
                    <div className="absolute top-3 left-3">
                      <span className={`text-xs px-2 py-1 rounded ${
                        service.pricing_model === 'fixed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {service.pricing_model === 'fixed' ? 'Fixed' : 'Hourly'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Service Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2 group-hover:text-primary-600 transition-colors">
                      {translate(service.name)}
                    </h3>
                    {service.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {translate(service.description)}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="w-4 h-4 mr-1" />
                        {service.duration} {service.duration === 1 ? 'hr' : 'hrs'}
                      </div>
                      <ArrowRight className="w-5 h-5 text-primary-600 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-gray-600 text-lg mb-4">No services available in this sub-category yet.</p>
              <Button onClick={() => navigate('/')}>Browse Other Categories</Button>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
