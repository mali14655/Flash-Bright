import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Layout from '../components/Layout';
import api from '../lib/api';
import { useLanguage } from '../context/LanguageContext';
import { translateServices, useTranslator } from '../lib/translator';
import { useBreadcrumb } from '../context/BreadcrumbContext';
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
  const { language } = useLanguage();
  const { translate } = useTranslator();
  const { addBreadcrumb } = useBreadcrumb();
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

  // Update breadcrumb when subcategory loads
  useEffect(() => {
    if (subCategory && id) {
      const subCategoryName = typeof subCategory.name === 'object' 
        ? translate(subCategory.name) 
        : subCategory.name;
      
      // Add subcategory breadcrumb
      addBreadcrumb(subCategoryName, `/subcategory/${id}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subCategory, id, language]);

  const handleServiceClick = (serviceId: string) => {
    navigate(`/service/${serviceId}`);
  };

  // Calculate minimum price for a service
  const getMinimumPrice = (service: Service): number => {
    if (service.pricing_model === 'fixed') {
      return service.fixed_price || service.price || 0;
    } else {
      // For configurable pricing, minimum is base_fee (if exists) or hourly_rate_per_pro * 1 * 1
      const baseFee = service.base_fee || 0;
      const hourlyRate = service.hourly_rate_per_pro || service.price || 0;
      // Minimum would be base_fee + (hourly_rate * 1 professional * 1 hour)
      // But if base_fee doesn't exist, just use hourly_rate as minimum
      return baseFee > 0 ? baseFee + hourlyRate : hourlyRate;
    }
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
    <Layout showBackButton={true}>
      {/* Sub-Category Header */}
      <section className="bg-gradient-to-b from-white to-gray-50 py-6">
        <div className="container mx-auto px-4">
          <div className="mb-4">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              {typeof subCategory.name === 'object' 
                ? translate(subCategory.name) 
                : subCategory.name}
            </h1>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="bg-gradient-to-b from-gray-50 to-white py-8">
        <div className="container mx-auto px-4">
          {services.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5 md:gap-6 max-w-7xl mx-auto">
              {services.map((service) => {
                const minPrice = getMinimumPrice(service);
                return (
                  <Card
                    key={service._id}
                    className="overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer group border border-gray-200 bg-white flex flex-col"
                    onClick={() => handleServiceClick(service._id)}
                  >
                    {/* Service Image - 4:3 Aspect Ratio */}
                    <div className="relative w-full aspect-[4/3] overflow-hidden bg-gradient-to-br from-primary-100 to-primary-50">
                      {service.image ? (
                        <img 
                          src={service.image} 
                          alt={translate(service.name)}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="absolute inset-0 w-full h-full flex items-center justify-center">
                          <Sparkles className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-primary-400 opacity-50" />
                        </div>
                      )}
                      {/* Overlay gradient on hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                      {/* Pricing model badge - top left (smaller) */}
                      <div className="absolute top-2 left-2 z-10">
                        <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md font-medium backdrop-blur-sm ${
                          service.pricing_model === 'fixed' 
                            ? 'bg-green-500/90 text-white' 
                            : 'bg-blue-500/90 text-white'
                        }`}>
                          {service.pricing_model === 'fixed' ? 'Fixed' : 'Hourly'}
                        </span>
                      </div>
                      
                      {/* Price badge - bottom right with compact glassmorphism */}
                      <div className="absolute bottom-2 right-2 z-10">
                        <div className="bg-black/40 backdrop-blur-md border border-white/30 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg shadow-xl">
                          <div className="text-[8px] sm:text-[9px] text-white/80 font-medium mb-0.5 leading-tight">
                            starts from
                          </div>
                          <div className="flex items-baseline gap-0.5">
                            <span className="text-[9px] sm:text-[10px] text-white/90 font-medium">AED</span>
                            <span className="text-xs sm:text-sm font-bold text-white drop-shadow-md">
                              {minPrice.toFixed(0)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Service Info */}
                    <div className="p-3 sm:p-4 md:p-5 flex flex-col flex-grow">
                      <h3 className="text-sm sm:text-base md:text-lg font-bold text-gray-900 mb-3 sm:mb-4 group-hover:text-primary-600 transition-colors line-clamp-2 min-h-[2.5rem] sm:min-h-[3rem] md:min-h-[3.5rem]">
                        {translate(service.name)}
                      </h3>
                      
                      {/* View Details Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs sm:text-sm font-semibold border-primary-200 text-primary-600 hover:bg-primary-600 hover:text-white hover:border-primary-600 transition-all duration-200 mt-auto"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleServiceClick(service._id);
                        }}
                      >
                        <span className="hidden sm:inline">View Details</span>
                        <span className="sm:hidden">View</span>
                        <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 ml-1 sm:ml-1.5" />
                      </Button>
                    </div>
                  </Card>
                );
              })}
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
