import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Layout from '../components/Layout';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { Clock, DollarSign, CheckCircle, ArrowRight } from 'lucide-react';
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
  const [bookingStep, setBookingStep] = useState(1); // 1 = service details, 2 = personal details
  const [bookingData, setBookingData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    scheduledDate: '',
    scheduledTime: '',
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
      // Breadcrumb will be updated by the useEffect when service changes
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, service?.name, id]);

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
        materials: materialsTotal,
        material_fee: materialsTotal, // Keep for backward compatibility
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

  const handleServiceDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validate service details
    if (!bookingData.scheduledDate || !bookingData.scheduledTime) {
      toast.error('Please select date and time');
      return;
    }
    // Combine date and time for the API
    const combinedDateTime = `${bookingData.scheduledDate}T${bookingData.scheduledTime}`;
    // Update the booking data with combined datetime
    setBookingData(prev => ({ ...prev, scheduledDate: combinedDateTime }));
    setBookingStep(2);
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
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {!showBookingForm ? (
          <Card className="p-6 mb-6">
            <div className="grid md:grid-cols-3 gap-6">
              {/* Image Section - 4:3 Aspect Ratio */}
              {service.image && (
                <div className="md:col-span-1">
                  <div className="relative w-full aspect-[4/3] overflow-hidden rounded-lg bg-gradient-to-br from-primary-100 to-primary-50">
                    <img 
                      src={service.image} 
                      alt={translate(service.name)} 
                      className="absolute inset-0 w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                    {/* Booking Button Overlay - High contrast for orange images */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <Button 
                        size="lg" 
                        onClick={() => setShowBookingForm(true)} 
                        className="bg-white text-gray-900 hover:bg-gray-100 border-2 border-white shadow-2xl font-bold px-8 py-4 text-lg backdrop-blur-sm"
                      >
                        {t('services.bookService')}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Content Section */}
              <div className={service.image ? "md:col-span-2" : "md:col-span-3"}>
                <div className="mb-4">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{translate(service.name)}</h1>
                  <p className="text-primary-600 font-medium">{translate(service.category)}</p>
                </div>

                {/* Service Pricing Display - Only for Fixed */}
                {service.pricing_model === 'fixed' && (
                  <div className="grid md:grid-cols-2 gap-4 mb-6">
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
                )}

                {/* Service Description */}
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-3">{t('services.description')}</h2>
                  <p className="text-gray-700 leading-relaxed">
                    {service.description 
                      ? translate(service.description)
                      : "Experience professional service with our expert team. We provide high-quality service tailored to your needs. Book now to get started!"
                    }
                  </p>
                </div>

                {/* Booking Button - Show if no image */}
                {!service.image && (
                  <Button size="lg" onClick={() => setShowBookingForm(true)} className="w-full">
                    {t('services.bookService')}
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ) : (
          <div className="mt-4">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Left Column - Booking Form */}
              <div className="lg:col-span-2">
                <Card className="p-6 md:p-8 bg-white border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{t('services.bookServiceTitle')}</h2>
                      <p className="text-sm text-gray-500 mt-1">Step {bookingStep} of 2</p>
                    </div>
                    <button
                      onClick={() => {
                        setShowBookingForm(false);
                        setBookingStep(1);
                      }}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Step 1: Service Details */}
                  {bookingStep === 1 && (
                    <form onSubmit={handleServiceDetailsSubmit} className="space-y-6">
                      {/* Service Details Section */}
                      <div className="border-b border-gray-200 pb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Date & Time</h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">Choose Date *</label>
                            <Input
                              type="date"
                              value={bookingData.scheduledDate}
                              onChange={(e) => setBookingData({ ...bookingData, scheduledDate: e.target.value })}
                              min={new Date().toISOString().split('T')[0]}
                              required
                              className="w-full text-lg py-3"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">Choose Time *</label>
                            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                              {[
                                { value: '09:00', display: '9:00 AM' },
                                { value: '10:00', display: '10:00 AM' },
                                { value: '11:00', display: '11:00 AM' },
                                { value: '12:00', display: '12:00 PM' },
                                { value: '13:00', display: '1:00 PM' },
                                { value: '14:00', display: '2:00 PM' },
                                { value: '15:00', display: '3:00 PM' },
                                { value: '16:00', display: '4:00 PM' },
                                { value: '17:00', display: '5:00 PM' }
                              ].map((timeSlot) => (
                                <label
                                  key={timeSlot.value}
                                  className={`cursor-pointer rounded-lg border-2 p-3 text-center transition-all hover:shadow-md ${
                                    bookingData.scheduledTime === timeSlot.value
                                      ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-sm'
                                      : 'border-gray-200 bg-white text-gray-700 hover:border-primary-300'
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    name="time"
                                    value={timeSlot.value}
                                    checked={bookingData.scheduledTime === timeSlot.value}
                                    onChange={(e) => setBookingData({ ...bookingData, scheduledTime: e.target.value })}
                                    className="sr-only"
                                  />
                                  <div className="font-semibold text-sm">{timeSlot.display}</div>
                                </label>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* Configurable Pricing Fields */}
                      {service.pricing_model === 'configurable' && (
                        <div className="border-b border-gray-200 pb-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Options</h3>
                          <div className="space-y-6">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-3">Number of Professionals *</label>
                              <div className="grid grid-cols-4 gap-3">
                                {[1, 2, 3, 4].map((num) => (
                                  <label 
                                    key={num} 
                                    className={`cursor-pointer rounded-xl border-2 p-5 text-center transition-all hover:shadow-md ${
                                      bookingData.selected_professionals === num
                                        ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-sm'
                                        : 'border-gray-200 bg-white text-gray-700 hover:border-primary-300'
                                    }`}
                                  >
                                    <input
                                      type="radio"
                                      name="professionals"
                                      value={num}
                                      checked={bookingData.selected_professionals === num}
                                      onChange={() => setBookingData({ 
                                        ...bookingData, 
                                        selected_professionals: num,
                                        numberOfPeople: num
                                      })}
                                      className="sr-only"
                                    />
                                    <div className="font-bold text-2xl mb-1">{num}</div>
                                    <div className="text-xs text-gray-500">Professional{num > 1 ? 's' : ''}</div>
                                  </label>
                                ))}
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-3">
                                Number of Hours *
                              </label>
                              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                                {[1, 2, 3, 4, 5, 6, 7, 8].map((hour) => (
                                  <label
                                    key={hour}
                                    className={`cursor-pointer rounded-lg border-2 p-3 text-center transition-all hover:shadow-md ${
                                      bookingData.selected_hours === hour
                                        ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-sm'
                                        : 'border-gray-200 bg-white text-gray-700 hover:border-primary-300'
                                    }`}
                                  >
                                    <input
                                      type="radio"
                                      name="hours"
                                      value={hour}
                                      checked={bookingData.selected_hours === hour}
                                      onChange={() => setBookingData({ 
                                        ...bookingData, 
                                        selected_hours: hour,
                                        hours: hour
                                      })}
                                      className="sr-only"
                                    />
                                    <div className="font-semibold">{hour}</div>
                                    <div className="text-xs text-gray-500">hr{hour > 1 ? 's' : ''}</div>
                                  </label>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
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
                        <div className="border-b border-gray-200 pb-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Materials</h3>
                          
                          {/* Yes/No Radio Buttons */}
                          <div className="grid grid-cols-2 gap-3 mb-6">
                            <label className={`cursor-pointer rounded-lg border-2 p-4 text-center transition-all ${
                              bookingData.needs_materials === true
                                ? 'border-primary-500 bg-primary-50 text-primary-700'
                                : 'border-gray-200 bg-white text-gray-700 hover:border-primary-300'
                            }`}>
                              <input
                                type="radio"
                                name="materials_option"
                                checked={bookingData.needs_materials === true}
                                onChange={() => setBookingData({ ...bookingData, needs_materials: true })}
                                className="sr-only"
                              />
                              <div className="font-semibold">Yes, include materials</div>
                            </label>
                            <label className={`cursor-pointer rounded-lg border-2 p-4 text-center transition-all ${
                              bookingData.needs_materials === false
                                ? 'border-primary-500 bg-primary-50 text-primary-700'
                                : 'border-gray-200 bg-white text-gray-700 hover:border-primary-300'
                            }`}>
                              <input
                                type="radio"
                                name="materials_option"
                                checked={bookingData.needs_materials === false}
                                onChange={() => setBookingData({ ...bookingData, needs_materials: false })}
                                className="sr-only"
                              />
                              <div className="font-semibold">No, I'll prepare</div>
                            </label>
                          </div>

                          {/* Materials List */}
                          <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-sm font-semibold text-gray-700 mb-3">Required Materials:</p>
                            <div className="space-y-2">
                              {service.materials.map((material: { name: string; price: number }, idx: number) => {
                                const materialName = material.name;
                                const materialPrice = material.price || 0;
                                
                                return (
                                  <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                                    <span className="text-sm text-gray-700">{materialName}</span>
                                    <span className="text-sm font-semibold text-primary-600">AED {materialPrice.toFixed(2)}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Message based on selection */}
                          {bookingData.needs_materials && (
                            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                              <p className="text-sm font-medium text-blue-900">✓ Materials will be included in your order.</p>
                            </div>
                          )}
                          {!bookingData.needs_materials && (
                            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                              <p className="text-sm font-medium text-amber-900">⚠️ You must prepare these materials yourself.</p>
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
                      {/* Special Instructions */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('services.specialInstructions')}</label>
                        <textarea
                          value={bookingData.notes}
                          onChange={(e) => setBookingData({ ...bookingData, notes: e.target.value })}
                          className="flex w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          rows={4}
                          placeholder="Any special requirements or notes..."
                        />
                      </div>

                      {/* Form Actions */}
                      <div className="flex gap-3 pt-4">
                        <Button type="submit" className="flex-1" size="lg">
                          Continue to Personal Details
                          <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="lg"
                          onClick={() => {
                            setShowBookingForm(false);
                            setBookingStep(1);
                          }}
                        >
                          {t('services.cancel')}
                        </Button>
                      </div>
                    </form>
                  )}

                  {/* Step 2: Personal Details */}
                  {bookingStep === 2 && (
                    <form onSubmit={handleBookService} className="space-y-6">
                      <div className="mb-4">
                        <button
                          type="button"
                          onClick={() => setBookingStep(1)}
                          className="text-primary-600 hover:text-primary-700 flex items-center gap-2 text-sm font-medium"
                        >
                          <ArrowRight className="w-4 h-4 rotate-180" />
                          Back to Service Details
                        </button>
                      </div>

                      {/* Customer Information Section */}
                      <div className="border-b border-gray-200 pb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">{t('services.yourName')} *</label>
                            <Input
                              type="text"
                              value={bookingData.customerName}
                              onChange={(e) => setBookingData({ ...bookingData, customerName: e.target.value })}
                              required
                              placeholder="John Doe"
                              className="w-full"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">{t('services.email')} *</label>
                            <Input
                              type="email"
                              value={bookingData.customerEmail}
                              onChange={(e) => setBookingData({ ...bookingData, customerEmail: e.target.value })}
                              required
                              placeholder="john@example.com"
                              className="w-full"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">{t('services.phone')}</label>
                            <Input
                              type="tel"
                              value={bookingData.customerPhone}
                              onChange={(e) => setBookingData({ ...bookingData, customerPhone: e.target.value })}
                              placeholder="+971 50 123 4567"
                              className="w-full"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Address */}
                      <div className="border-b border-gray-200 pb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Address</h3>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">{t('services.serviceAddress')} *</label>
                          <Input
                            type="text"
                            value={bookingData.address}
                            onChange={(e) => setBookingData({ ...bookingData, address: e.target.value })}
                            placeholder="Enter your full address"
                            required
                            className="w-full"
                          />
                        </div>
                      </div>

                      {/* Payment Method */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h3>
                        <div className="grid grid-cols-2 gap-3">
                          <label className={`cursor-pointer rounded-lg border-2 p-4 text-center transition-all ${
                            bookingData.paymentMethod === 'online'
                              ? 'border-primary-500 bg-primary-50 text-primary-700'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-primary-300'
                          }`}>
                            <input
                              type="radio"
                              name="paymentMethod"
                              value="online"
                              checked={bookingData.paymentMethod === 'online'}
                              onChange={(e) => setBookingData({ ...bookingData, paymentMethod: e.target.value })}
                              className="sr-only"
                            />
                            <div className="font-semibold">{t('services.onlinePayment')}</div>
                          </label>
                          <label className={`cursor-pointer rounded-lg border-2 p-4 text-center transition-all ${
                            bookingData.paymentMethod === 'cash'
                              ? 'border-primary-500 bg-primary-50 text-primary-700'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-primary-300'
                          }`}>
                            <input
                              type="radio"
                              name="paymentMethod"
                              value="cash"
                              checked={bookingData.paymentMethod === 'cash'}
                              onChange={(e) => setBookingData({ ...bookingData, paymentMethod: e.target.value })}
                              className="sr-only"
                            />
                            <div className="font-semibold">{t('services.cashPayment')}</div>
                          </label>
                        </div>
                      </div>

                      {/* Form Actions */}
                      <div className="flex gap-3 pt-4">
                        <Button type="submit" className="flex-1" size="lg">
                          <CheckCircle className="w-5 h-5 mr-2" />
                          {t('services.confirmBooking')}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="lg"
                          onClick={() => {
                            setShowBookingForm(false);
                            setBookingStep(1);
                          }}
                        >
                          {t('services.cancel')}
                        </Button>
                      </div>
                    </form>
                  )}
                  </Card>
                </div>

                {/* Right Column - Price Summary */}
                <div className="lg:col-span-1">
                  <Card className="p-6 bg-gray-50 border border-gray-200 shadow-sm sticky top-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
                    
                    {/* Service Info */}
                    <div className="mb-6 pb-6 border-b border-gray-200">
                      <div className="flex items-start gap-3">
                        {service.image && (
                          <img 
                            src={service.image} 
                            alt={translate(service.name)}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 text-sm">{translate(service.name)}</h4>
                          <p className="text-xs text-gray-500 mt-1">
                            {service.pricing_model === 'fixed' ? 'Fixed Package' : 'Hourly Service'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Price Breakdown */}
                    <div className="space-y-3 mb-6">
                      <h4 className="font-semibold text-gray-900 text-sm">Price Breakdown</h4>
                      <div className="space-y-2 text-sm">
                        {service.pricing_model === 'fixed' ? (
                          <>
                            <div className="flex justify-between text-gray-600">
                              <span>Service Price</span>
                              <span>AED {(service.fixed_price || service.price || 0).toFixed(2)}</span>
                            </div>
                            {bookingData.needs_materials && (priceBreakdown.materials > 0 || priceBreakdown.material_fee > 0) && (
                              <div className="flex justify-between text-gray-600">
                                <span>Materials</span>
                                <span>AED {(priceBreakdown.materials || priceBreakdown.material_fee || 0).toFixed(2)}</span>
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            <div className="flex justify-between text-gray-600">
                              <span>
                                {bookingData.selected_professionals} Professional{bookingData.selected_professionals > 1 ? 's' : ''} × {bookingData.selected_hours} Hour{bookingData.selected_hours > 1 ? 's' : ''}
                              </span>
                              <span>
                                AED {(priceBreakdown.hourly_rate * bookingData.selected_professionals * bookingData.selected_hours).toFixed(2)}
                              </span>
                            </div>
                            {bookingData.needs_materials && (priceBreakdown.materials > 0 || priceBreakdown.material_fee > 0) && (
                              <div className="flex justify-between text-gray-600">
                                <span>Materials</span>
                                <span>AED {(priceBreakdown.materials || priceBreakdown.material_fee || 0).toFixed(2)}</span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Total */}
                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-gray-900">Total</span>
                        <span className="text-2xl font-bold text-primary-600">AED {totalAmount.toFixed(2)}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">All prices include VAT</p>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          )}
      </div>
    </Layout>
  );
}

