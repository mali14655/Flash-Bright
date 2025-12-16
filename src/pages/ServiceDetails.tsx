import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Clock, DollarSign, CheckCircle } from 'lucide-react';

interface Service {
  _id: string;
  name: string;
  category: string;
  price: number;
  duration: number;
  description: string;
}

export default function ServiceDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [service, setService] = useState<Service | null>(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingData, setBookingData] = useState({
    scheduledDate: '',
    address: '',
    paymentMethod: 'online',
    notes: '',
  });

  useEffect(() => {
    loadService();
  }, [id]);

  const loadService = async () => {
    try {
      const response = await api.get(`/services/${id}`);
      setService(response.data);
    } catch (error) {
      toast.error('Failed to load service details');
      navigate('/customer');
    }
  };

  const handleBookService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/bookings', {
        serviceId: id,
        ...bookingData,
      });
      toast.success('Booking created successfully! Your request has been sent to admin.');
      navigate('/customer');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create booking');
    }
  };

  if (!service) {
    return (
      <DashboardLayout title="Customer">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-lg">Loading service details...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Customer">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate('/customer')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Services
        </Button>

        <Card className="p-6 mb-6">
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
                <p className="text-sm text-gray-600">Price</p>
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
            <Card className="p-6 bg-gray-50">
              <h2 className="text-xl font-semibold mb-4">Book Service</h2>
              <form onSubmit={handleBookService} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Scheduled Date & Time</label>
                  <Input
                    type="datetime-local"
                    value={bookingData.scheduledDate}
                    onChange={(e) => setBookingData({ ...bookingData, scheduledDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Service Address</label>
                  <Input
                    type="text"
                    value={bookingData.address}
                    onChange={(e) => setBookingData({ ...bookingData, address: e.target.value })}
                    placeholder="Enter your full address"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Payment Method</label>
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
    </DashboardLayout>
  );
}

