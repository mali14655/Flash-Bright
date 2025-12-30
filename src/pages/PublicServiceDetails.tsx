import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Layout from '../components/Layout';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { Clock, DollarSign, CheckCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useBreadcrumb } from '../context/BreadcrumbContext';
import { translateService, useTranslator } from '../lib/translator';

interface Service {
  _id: string;
  name: string | { en: string; ar?: string };
  category: string | { en: string; ar?: string };
  pricing_model?: 'fixed' | 'configurable';
  // Fixed pricing fields
  fixed_price?: number;
  fixed_duration_mins?: number;
  // Configurable pricing fields
  hourly_rate_per_pro?: number;
  base_fee?: number;
  base_duration_mins?: number;
  // Materials array
  materials: Array<{ name: string; price: number }>;
  material_fee?: number;
  material_instructions?: string | { en: string; ar?: string };
  // Legacy fields
  price: number;
  duration: number;
  description: string | { en: string; ar?: string };
  image: string;
  perHourFee: number;
  perPersonFee: number;
}

export default function PublicServiceDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const { translate } = useTranslator();
  const { addBreadcrumb } = useBreadcrumb();
  const [service, setService] = useState<Service | null>(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingData, setBookingData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    scheduledDate: '',
    address: '',
    paymentMethod: 'online',
    notes: '',
    // Legacy fields
    hours: 1,
    numberOfPeople: 1,
    // New dual pricing fields
    selected_professionals: 1,
    selected_hours: 1,
    needs_materials: false,
  });
  const [totalAmount, setTotalAmount] = useState(0);
  const [priceBreakdown, setPriceBreakdown] = useState({
    base_fee: 0,
    hourly_rate: 0,
    material_fee: 0,
    total: 0
  });

  useEffect(() => {
    loadService();
  }, [id]);

  useEffect(() => {
    if (service) {
      calculateTotal();
    }
  }, [service, bookingData.hours, bookingData.numberOfPeople, 
      bookingData.selected_professionals, bookingData.selected_hours, bookingData.needs_materials]);

  const loadService = async () => {
    try {
      const response = await api.get(`/services/${id}`);
      // Translate service based on current language
      const translatedService = translateService(response.data, language);
      setService(translatedService);
      
      // Add service name to breadcrumb
      const serviceName = translate(translatedService.name);
      addBreadcrumb(serviceName, `/service/${id}`);
    } catch (error) {
      toast.error('Failed to load service details');
      navigate('/');
    }
  };

  // Re-translate when language changes and update breadcrumb
  useEffect(() => {
    if (service && id) {
      const serviceName = translate(service.name);
      addBreadcrumb(serviceName, `/service/${id}`);
    }
  }, [language, service, id, translate, addBreadcrumb]);

  const calculateTotal = async () => {
    if (!service) return;
    
    const pricingModel = service.pricing_model || 'fixed';
    
    if (pricingModel === 'fixed') {
      // Fixed pricing: use fixed_price
      const fixedPrice = service.fixed_price || service.price || 0;
      let total = fixedPrice;
      
      // Add materials if needs_materials is true
      let materialsTotal = 0;
      if (bookingData.needs_materials && service.materials && Array.isArray(service.materials)) {
        materialsTotal = service.materials.reduce((sum, material) => sum + (material.price || 0), 0);
        total += materialsTotal;
      }
      
      setTotalAmount(total);
      setPriceBreakdown({
        base_fee: fixedPrice,
        hourly_rate: 0,
        material_fee: materialsTotal,
        total
      });
    } else {
      // Configurable pricing: calculate using API
      try {
        const response = await api.post('/bookings/calculate', {
          serviceId: service._id,
          selected_professionals: bookingData.selected_professionals,
          selected_hours: bookingData.selected_hours,
          needs_materials: bookingData.needs_materials
        });
        
        const breakdown = response.data.breakdown;
        let total = breakdown.total;
        
        setTotalAmount(total);
        setPriceBreakdown({
          ...breakdown,
          total
        });
      } catch (error) {
        console.error('Failed to calculate price:', error);
        // Fallback to legacy calculation
        let total = service.base_fee || service.price || 0;
        const hourlyRate = service.hourly_rate_per_pro || service.perHourFee || 0;
        total += hourlyRate * bookingData.selected_professionals * bookingData.selected_hours;
        
        if (bookingData.needs_materials && service.material_fee) {
          total += service.material_fee;
        }
        
        setTotalAmount(total);
      }
    }
  };

  const handleBookService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Materials list (always included, even if not selected)
      const materialsList = service?.materials || [];

      await api.post('/bookings', {
        serviceId: id,
        customerName: bookingData.customerName,
        customerEmail: bookingData.customerEmail,
        customerPhone: bookingData.customerPhone,
        scheduledDate: bookingData.scheduledDate,
        address: bookingData.address,
        paymentMethod: bookingData.paymentMethod,
        notes: bookingData.notes,
        // Legacy fields
        hours: bookingData.selected_hours || bookingData.hours,
        numberOfPeople: bookingData.selected_professionals || bookingData.numberOfPeople,
        materials_list: materialsList,
        // New dual pricing fields
        selected_professionals: bookingData.selected_professionals || bookingData.numberOfPeople,
        selected_hours: bookingData.selected_hours || bookingData.hours,
        needs_materials: bookingData.needs_materials,
      });
      toast.success('Booking created successfully! Your request has been sent to admin.');
      setShowBookingForm(false);
      setBookingData({
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        scheduledDate: '',
        address: '',
        paymentMethod: 'online',
        notes: '',
        hours: 1,
        numberOfPeople: 1,
        selected_professionals: 1,
        selected_hours: 1,
        needs_materials: false,
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create booking');
    }
  };

  if (!service) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-lg">{t('common.loading')}</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout 
      showBackButton={true}
      backButtonLabel={t('services.backToServices')}
    >
      <div className="container mx-auto px-4 py-8 max-w-4xl">

        <Card className="p-6 mb-6">
          {service.image && (
            <div className="relative w-full h-64 md:h-96 overflow-hidden rounded-lg mb-6 bg-gradient-to-br from-primary-100 to-primary-50">
              <img 
                src={service.image} 
                alt={translate(service.name)} 
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </div>
          )}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{translate(service.name)}</h1>
            <p className="text-primary-600 font-medium">{translate(service.category)}</p>
          </div>

          {/* Pricing Model Badge */}
          {service.pricing_model && (
            <div className="mb-4">
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                service.pricing_model === 'fixed' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {service.pricing_model === 'fixed' ? 'Fixed Package' : 'Hourly Rate'}
              </span>
            </div>
          )}

          {/* Service Pricing Display */}
          {service.pricing_model === 'fixed' ? (
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Fixed Price</p>
                  <p className="text-2xl font-bold text-gray-900">AED {service.fixed_price || service.price}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Duration</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {service.fixed_duration_mins ? `${service.fixed_duration_mins} mins` : `${service.duration} hours`}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold mb-3">Pricing Structure</h3>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Base Fee:</span> AED {service.base_fee || service.price || 0}</p>
                <p><span className="font-medium">Hourly Rate:</span> AED {service.hourly_rate_per_pro || service.perHourFee || 0} per professional/hour</p>
                <p className="text-gray-600 italic">Total = Base Fee + (Hourly Rate × Professionals × Hours)</p>
              </div>
            </div>
          )}

          {service.description && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">{t('services.description')}</h2>
              <p className="text-gray-700">{translate(service.description)}</p>
            </div>
          )}

          {!showBookingForm ? (
            <Button size="lg" onClick={() => setShowBookingForm(true)} className="w-full">
              {t('services.bookService')}
            </Button>
          ) : (
            <Card className="p-6 bg-gray-50 mt-6">
              <h2 className="text-xl font-semibold mb-4">{t('services.bookServiceTitle')}</h2>
              <form onSubmit={handleBookService} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{t('services.yourName')} *</label>
                  <Input
                    type="text"
                    value={bookingData.customerName}
                    onChange={(e) => setBookingData({ ...bookingData, customerName: e.target.value })}
                    required
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('services.email')} *</label>
                  <Input
                    type="email"
                    value={bookingData.customerEmail}
                    onChange={(e) => setBookingData({ ...bookingData, customerEmail: e.target.value })}
                    required
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('services.phone')}</label>
                  <Input
                    type="tel"
                    value={bookingData.customerPhone}
                    onChange={(e) => setBookingData({ ...bookingData, customerPhone: e.target.value })}
                    placeholder="+1234567890"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('services.scheduledDate')} *</label>
                  <Input
                    type="datetime-local"
                    value={bookingData.scheduledDate}
                    onChange={(e) => setBookingData({ ...bookingData, scheduledDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('services.serviceAddress')} *</label>
                  <Input
                    type="text"
                    value={bookingData.address}
                    onChange={(e) => setBookingData({ ...bookingData, address: e.target.value })}
                    placeholder="Enter your full address"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('services.paymentMethod')} *</label>
                  <select
                    value={bookingData.paymentMethod}
                    onChange={(e) => setBookingData({ ...bookingData, paymentMethod: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                    required
                  >
                    <option value="online">{t('services.onlinePayment')}</option>
                    <option value="cash">{t('services.cashPayment')}</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {bookingData.paymentMethod === 'online'
                      ? t('services.payOnline')
                      : t('services.payCash')}
                  </p>
                </div>
                {/* Configurable Pricing Fields */}
                {service.pricing_model === 'configurable' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1">Number of Professionals *</label>
                      <div className="flex gap-4 mb-2">
                        {[1, 2, 3].map((num) => (
                          <label key={num} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="professionals"
                              value={num}
                              checked={bookingData.selected_professionals === num}
                              onChange={() => setBookingData({ 
                                ...bookingData, 
                                selected_professionals: num,
                                numberOfPeople: num // Legacy support
                              })}
                              className="w-4 h-4"
                            />
                            <span>{num}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Number of Hours *</label>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-600">2</span>
                        <input
                          type="range"
                          min="2"
                          max="8"
                          value={bookingData.selected_hours}
                          onChange={(e) => setBookingData({ 
                            ...bookingData, 
                            selected_hours: parseInt(e.target.value),
                            hours: parseInt(e.target.value) // Legacy support
                          })}
                          className="flex-1"
                        />
                        <span className="text-sm text-gray-600">8</span>
                        <span className="text-sm font-semibold min-w-[60px]">Selected: {bookingData.selected_hours} hours</span>
                      </div>
                    </div>
                  </>
                )}
                
                {/* Legacy fields for backward compatibility */}
                {!service.pricing_model && service.perHourFee > 0 && (
                  <div>
                    <label className="block text-sm font-medium mb-1">{t('services.numberOfHours')} *</label>
                    <Input
                      type="number"
                      min="1"
                      value={bookingData.hours}
                      onChange={(e) => setBookingData({ 
                        ...bookingData, 
                        hours: parseInt(e.target.value) || 1,
                        selected_hours: parseInt(e.target.value) || 1
                      })}
                      required
                    />
                  </div>
                )}
                {!service.pricing_model && service.perPersonFee > 0 && (
                  <div>
                    <label className="block text-sm font-medium mb-1">{t('services.numberOfPeople')} *</label>
                    <Input
                      type="number"
                      min="1"
                      value={bookingData.numberOfPeople}
                      onChange={(e) => setBookingData({ 
                        ...bookingData, 
                        numberOfPeople: parseInt(e.target.value) || 1,
                        selected_professionals: parseInt(e.target.value) || 1
                      })}
                      required
                    />
                  </div>
                )}

                {/* Material Selection */}
                {service.materials && Array.isArray(service.materials) && service.materials.length > 0 && (
                  <div className="mb-4 border rounded p-4 bg-gray-50">
                    <label className="block text-sm font-medium mb-3">Do you want materials as well?</label>
                    
                    {/* Yes/No Radio Buttons */}
                    <div className="space-y-2 mb-4">
                      <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-100 rounded">
                        <input
                          type="radio"
                          name="materials_option"
                          checked={bookingData.needs_materials === true}
                          onChange={() => setBookingData({ ...bookingData, needs_materials: true })}
                          className="w-4 h-4"
                        />
                        <span className="text-sm font-medium">Yes, I want materials as well</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-100 rounded">
                        <input
                          type="radio"
                          name="materials_option"
                          checked={bookingData.needs_materials === false}
                          onChange={() => setBookingData({ ...bookingData, needs_materials: false })}
                          className="w-4 h-4"
                        />
                        <span className="text-sm font-medium">No, I don't want materials</span>
                      </label>
                    </div>

                    {/* Materials List - Always Shown */}
                    <div className="mt-4">
                      <p className="text-xs font-semibold text-gray-700 mb-2">Required Materials List:</p>
                      <div className="space-y-2">
                        {service.materials.map((material: { name: string; price: number }, idx: number) => {
                          const materialName = material.name;
                          const materialPrice = material.price || 0;
                          
                          return (
                            <div key={idx} className="flex items-center justify-between p-2 bg-white rounded border">
                              <span className="text-sm">{materialName}</span>
                              <span className="text-sm font-semibold text-primary-600">AED {materialPrice.toFixed(2)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Message based on selection */}
                    {bookingData.needs_materials && (
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                        <p className="font-medium">✓ Materials will be included in your order.</p>
                        <p className="mt-1">Please ensure you have these materials ready when our team arrives.</p>
                      </div>
                    )}
                    {!bookingData.needs_materials && (
                      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded text-sm text-amber-800">
                        <p className="font-medium">⚠️ Materials not included in order.</p>
                        <p className="mt-1">You must prepare these materials yourself before our team arrives.</p>
                      </div>
                    )}
                  </div>
                )}
                {/* Legacy material selection (if materials array not available) */}
                {(!service.materials || service.materials.length === 0) && service.material_fee !== undefined && service.material_fee > 0 && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Materials</label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="materials"
                          checked={bookingData.needs_materials}
                          onChange={() => setBookingData({ ...bookingData, needs_materials: true })}
                          className="w-4 h-4"
                        />
                        <span>Yes, include materials (+AED {service.material_fee})</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="materials"
                          checked={!bookingData.needs_materials}
                          onChange={() => setBookingData({ ...bookingData, needs_materials: false })}
                          className="w-4 h-4"
                        />
                        <span>No, I'll prepare materials myself</span>
                      </label>
                      {!bookingData.needs_materials && service.material_instructions && (
                        <div className="ml-6 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                          <p className="font-medium">Reminder:</p>
                          <p>{translate(service.material_instructions)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <div className="border-t pt-4">
                  {/* Price Breakdown */}
                  <div className="mb-4 p-3 bg-white rounded border">
                    <h4 className="font-semibold mb-2">Price Breakdown:</h4>
                    <div className="space-y-1 text-sm">
                      {service.pricing_model === 'fixed' ? (
                        <>
                          <div className="flex justify-between">
                            <span>Service Price:</span>
                            <span>AED {(service.fixed_price || service.price || 0).toFixed(2)}</span>
                          </div>
                          {bookingData.needs_materials && priceBreakdown.material_fee > 0 && (
                            <div className="flex justify-between">
                              <span>Materials:</span>
                              <span>AED {priceBreakdown.material_fee.toFixed(2)}</span>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="flex justify-between">
                            <span>
                              Hourly ({bookingData.selected_professionals} pros × {bookingData.selected_hours} hrs):
                            </span>
                            <span>
                              AED {(priceBreakdown.hourly_rate * bookingData.selected_professionals * bookingData.selected_hours).toFixed(2)}
                            </span>
                          </div>
                          {bookingData.needs_materials && priceBreakdown.material_fee > 0 && (
                            <div className="flex justify-between">
                              <span>Materials:</span>
                              <span>AED {priceBreakdown.material_fee.toFixed(2)}</span>
                            </div>
                          )}
                        </>
                      )}
                      <div className="flex justify-between font-semibold pt-2 border-t mt-2">
                        <span>Total:</span>
                        <span>AED {totalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('services.specialInstructions')}</label>
                  <textarea
                    value={bookingData.notes}
                    onChange={(e) => setBookingData({ ...bookingData, notes: e.target.value })}
                    className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                    rows={3}
                    placeholder="Any special requirements or notes..."
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {t('services.confirmBooking')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowBookingForm(false)}
                  >
                    {t('services.cancel')}
                  </Button>
                </div>
              </form>
            </Card>
          )}
        </Card>
      </div>
    </Layout>
  );
}

