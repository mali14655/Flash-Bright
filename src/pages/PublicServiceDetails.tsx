import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Layout from '../components/Layout';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { Clock, DollarSign, CheckCircle, Users } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useBreadcrumb } from '../context/BreadcrumbContext';
import { translateService, useTranslator } from '../lib/translator';

interface Service {
  _id: string;
  name: string;
  category: string;
  price: number;
  duration: number;
  description: string;
  image: string;
  perHourFee: number;
  perPersonFee: number;
  hasExtraRequirements: boolean;
  extraRequirements: Array<{ name: string; price: number }>;
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
    hours: 1,
    numberOfPeople: 1,
    selectedExtras: [] as number[], // Store indices instead of names
  });
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    loadService();
  }, [id]);

  useEffect(() => {
    if (service) {
      calculateTotal();
    }
  }, [service, bookingData.hours, bookingData.numberOfPeople, bookingData.selectedExtras]);

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

  const calculateTotal = () => {
    if (!service) return;
    let total = service.price || 0;
    if (service.perHourFee > 0) {
      total += service.perHourFee * bookingData.hours;
    }
    if (service.perPersonFee > 0) {
      total += service.perPersonFee * bookingData.numberOfPeople;
    }
    bookingData.selectedExtras.forEach((extraIdx) => {
      const extra = service.extraRequirements[extraIdx];
      if (extra) {
        total += extra.price;
      }
    });
    setTotalAmount(total);
  };

  const handleBookService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const selectedExtrasData = bookingData.selectedExtras.map((selectedExtra) => {
        // Find the extra by index since we're storing indices
        const extra = service?.extraRequirements[selectedExtra];
        if (extra) {
          // Store the original name (could be object or string)
          const extraName = extra.name;
          const originalName = typeof extraName === 'object' 
            ? (extraName.en || extraName.ar || JSON.stringify(extraName)) 
            : extraName;
          return { name: originalName, price: extra.price };
        }
        return null;
      }).filter(Boolean) as Array<{ name: string; price: number }>;

      await api.post('/bookings', {
        serviceId: id,
        customerName: bookingData.customerName,
        customerEmail: bookingData.customerEmail,
        customerPhone: bookingData.customerPhone,
        scheduledDate: bookingData.scheduledDate,
        address: bookingData.address,
        paymentMethod: bookingData.paymentMethod,
        notes: bookingData.notes,
        hours: bookingData.hours,
        numberOfPeople: bookingData.numberOfPeople,
        selectedExtras: selectedExtrasData,
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
        selectedExtras: [],
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
            <img src={service.image} alt={translate(service.name)} className="w-full h-64 object-cover rounded-lg mb-6" />
          )}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{translate(service.name)}</h1>
            <p className="text-primary-600 font-medium">{translate(service.category)}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">{t('services.basePrice')}</p>
                <p className="text-2xl font-bold text-gray-900">${service.price}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">{t('services.duration')}</p>
                <p className="text-2xl font-bold text-gray-900">{service.duration} {t('services.hours')}</p>
              </div>
            </div>
            {service.perHourFee > 0 && (
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t('services.perHourFee')}</p>
                  <p className="text-2xl font-bold text-gray-900">${service.perHourFee}</p>
                </div>
              </div>
            )}
            {service.perPersonFee > 0 && (
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t('services.perPersonFee')}</p>
                  <p className="text-2xl font-bold text-gray-900">${service.perPersonFee}</p>
                </div>
              </div>
            )}
          </div>

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
                {service.perHourFee > 0 && (
                  <div>
                    <label className="block text-sm font-medium mb-1">{t('services.numberOfHours')} *</label>
                    <Input
                      type="number"
                      min="1"
                      value={bookingData.hours}
                      onChange={(e) => setBookingData({ ...bookingData, hours: parseInt(e.target.value) || 1 })}
                      required
                    />
                  </div>
                )}
                {service.perPersonFee > 0 && (
                  <div>
                    <label className="block text-sm font-medium mb-1">{t('services.numberOfPeople')} *</label>
                    <Input
                      type="number"
                      min="1"
                      value={bookingData.numberOfPeople}
                      onChange={(e) => setBookingData({ ...bookingData, numberOfPeople: parseInt(e.target.value) || 1 })}
                      required
                    />
                  </div>
                )}
                {service.hasExtraRequirements && service.extraRequirements.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium mb-1">{t('services.extraRequirements')}</label>
                    <div className="space-y-2">
                      {service.extraRequirements.map((extra, idx) => {
                        const extraName = translate(extra.name);
                        return (
                          <label key={idx} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={bookingData.selectedExtras.includes(idx)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setBookingData({
                                    ...bookingData,
                                    selectedExtras: [...bookingData.selectedExtras, idx]
                                  });
                                } else {
                                  setBookingData({
                                    ...bookingData,
                                    selectedExtras: bookingData.selectedExtras.filter(i => i !== idx)
                                  });
                                }
                              }}
                              className="rounded"
                            />
                            <span className="text-sm">
                              {extraName} - ${extra.price}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-semibold">{t('services.totalAmount')}:</span>
                    <span className="text-2xl font-bold text-primary-600">${totalAmount.toFixed(2)}</span>
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

