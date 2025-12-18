import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Clock, DollarSign, CheckCircle, Home, Users } from 'lucide-react';

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
    selectedExtras: [] as string[],
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
      setService(response.data);
    } catch (error) {
      toast.error('Failed to load service details');
      navigate('/');
    }
  };

  const calculateTotal = () => {
    if (!service) return;
    let total = service.price || 0;
    if (service.perHourFee > 0) {
      total += service.perHourFee * bookingData.hours;
    }
    if (service.perPersonFee > 0) {
      total += service.perPersonFee * bookingData.numberOfPeople;
    }
    bookingData.selectedExtras.forEach((extraName) => {
      const extra = service.extraRequirements.find(e => e.name === extraName);
      if (extra) {
        total += extra.price;
      }
    });
    setTotalAmount(total);
  };

  const handleBookService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const selectedExtrasData = bookingData.selectedExtras.map(name => {
        const extra = service?.extraRequirements.find(e => e.name === name);
        return extra ? { name: extra.name, price: extra.price } : null;
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
      <div className="min-h-screen bg-gray-50">
        <header className="border-b bg-white sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <Link to="/" className="flex items-center gap-2 text-primary-600 font-bold">
              <Home className="w-5 h-5" />
              HomeService Pro
            </Link>
          </div>
        </header>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-lg">Loading service details...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2 text-primary-600 font-bold text-xl">
            <Home className="w-5 h-5" />
            HomeService Pro
          </Link>
          <div className="flex gap-4">
            <Link to="/login">
              <Button variant="ghost">Login</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Services
        </Button>

        <Card className="p-6 mb-6">
          {service.image && (
            <img src={service.image} alt={service.name} className="w-full h-64 object-cover rounded-lg mb-6" />
          )}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{service.name}</h1>
            <p className="text-primary-600 font-medium">{service.category}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Base Price</p>
                <p className="text-2xl font-bold text-gray-900">${service.price}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Duration</p>
                <p className="text-2xl font-bold text-gray-900">{service.duration} hours</p>
              </div>
            </div>
            {service.perHourFee > 0 && (
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Per Hour Fee</p>
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
                  <p className="text-sm text-gray-600">Per Person Fee</p>
                  <p className="text-2xl font-bold text-gray-900">${service.perPersonFee}</p>
                </div>
              </div>
            )}
          </div>

          {service.description && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Description</h2>
              <p className="text-gray-700">{service.description}</p>
            </div>
          )}

          {!showBookingForm ? (
            <Button size="lg" onClick={() => setShowBookingForm(true)} className="w-full">
              Book This Service
            </Button>
          ) : (
            <Card className="p-6 bg-gray-50 mt-6">
              <h2 className="text-xl font-semibold mb-4">Book Service</h2>
              <form onSubmit={handleBookService} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Your Name *</label>
                  <Input
                    type="text"
                    value={bookingData.customerName}
                    onChange={(e) => setBookingData({ ...bookingData, customerName: e.target.value })}
                    required
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email *</label>
                  <Input
                    type="email"
                    value={bookingData.customerEmail}
                    onChange={(e) => setBookingData({ ...bookingData, customerEmail: e.target.value })}
                    required
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone Number</label>
                  <Input
                    type="tel"
                    value={bookingData.customerPhone}
                    onChange={(e) => setBookingData({ ...bookingData, customerPhone: e.target.value })}
                    placeholder="+1234567890"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Scheduled Date & Time *</label>
                  <Input
                    type="datetime-local"
                    value={bookingData.scheduledDate}
                    onChange={(e) => setBookingData({ ...bookingData, scheduledDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Service Address *</label>
                  <Input
                    type="text"
                    value={bookingData.address}
                    onChange={(e) => setBookingData({ ...bookingData, address: e.target.value })}
                    placeholder="Enter your full address"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Payment Method *</label>
                  <select
                    value={bookingData.paymentMethod}
                    onChange={(e) => setBookingData({ ...bookingData, paymentMethod: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                    required
                  >
                    <option value="online">Online Payment</option>
                    <option value="cash">COD (Cash on Delivery)</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {bookingData.paymentMethod === 'online'
                      ? 'Pay securely online with your card'
                      : 'Pay cash when the service is completed'}
                  </p>
                </div>
                {service.perHourFee > 0 && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Number of Hours *</label>
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
                    <label className="block text-sm font-medium mb-1">Number of People *</label>
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
                    <label className="block text-sm font-medium mb-1">Extra Requirements</label>
                    <div className="space-y-2">
                      {service.extraRequirements.map((extra, idx) => (
                        <label key={idx} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={bookingData.selectedExtras.includes(extra.name)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setBookingData({
                                  ...bookingData,
                                  selectedExtras: [...bookingData.selectedExtras, extra.name]
                                });
                              } else {
                                setBookingData({
                                  ...bookingData,
                                  selectedExtras: bookingData.selectedExtras.filter(name => name !== extra.name)
                                });
                              }
                            }}
                            className="rounded"
                          />
                          <span className="text-sm">
                            {extra.name} - ${extra.price}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-semibold">Total Amount:</span>
                    <span className="text-2xl font-bold text-primary-600">${totalAmount.toFixed(2)}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Special Instructions (Optional)</label>
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
                    Confirm Booking
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowBookingForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          )}
        </Card>
      </div>
    </div>
  );
}

