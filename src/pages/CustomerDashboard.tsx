import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { Clock, ArrowRight, AlertCircle, RefreshCw, DollarSign } from 'lucide-react';

interface Service {
  _id: string;
  name: string;
  category: string;
  price: number;
  duration: number;
}

interface Booking {
  _id: string;
  serviceId: Service;
  status: string;
  paymentMethod: string;
  scheduledDate: string;
  address: string;
  createdAt: string;
  isExpired?: boolean;
  totalAmount?: number;
}

interface ExpiredBooking extends Booking {
  serviceId: Service;
  totalAmount: number;
  paymentMethod: string;
}

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [expiredBookings, setExpiredBookings] = useState<ExpiredBooking[]>([]);
  const [showRescheduleModal, setShowRescheduleModal] = useState<string>('');
  const [newScheduledDate, setNewScheduledDate] = useState<string>('');

  useEffect(() => {
    loadServices();
    loadBookings();
    loadExpiredBookings();
  }, []);

  const loadServices = async () => {
    try {
      const response = await api.get('/services');
      setServices(response.data);
    } catch (error) {
      toast.error('Failed to load services');
    }
  };

  const loadBookings = async () => {
    try {
      const response = await api.get('/bookings');
      // Filter out expired bookings from regular bookings
      setBookings(response.data.filter((b: Booking) => !b.isExpired && b.status !== 'expired'));
    } catch (error) {
      toast.error('Failed to load bookings');
    }
  };

  const loadExpiredBookings = async () => {
    try {
      const response = await api.get('/bookings/expired/customer');
      setExpiredBookings(response.data);
    } catch (error) {
      console.error('Failed to load expired bookings');
    }
  };

  const handleReschedule = async (bookingId: string) => {
    if (!newScheduledDate) {
      toast.error('Please select a new date and time');
      return;
    }
    try {
      await api.put(`/bookings/${bookingId}/reschedule`, { newScheduledDate });
      toast.success('Order rescheduled successfully');
      setShowRescheduleModal('');
      setNewScheduledDate('');
      loadBookings();
      loadExpiredBookings();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reschedule order');
    }
  };

  const handleRequestRefund = async (bookingId: string) => {
    if (!confirm('Are you sure you want to request a refund for this expired order?')) {
      return;
    }
    try {
      await api.post('/refunds', { bookingId, reason: 'Order expired - customer requested refund' });
      toast.success('Refund request submitted. Admin will process it soon.');
      loadExpiredBookings();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to request refund');
    }
  };


  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      assigned_to_partner: 'bg-blue-100 text-blue-800',
      assigned_to_employee: 'bg-purple-100 text-purple-800',
      in_progress: 'bg-orange-100 text-orange-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <DashboardLayout title="Customer">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Dashboard</h1>
        <p className="text-gray-600">Book and manage your home services</p>
      </div>

      {/* Services */}
      <Card className="p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-semibold">Available Services</h2>
            <p className="text-gray-600 mt-1">Select a service to view details and book</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <div
              key={service._id}
              className="border rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer group"
              onClick={() => navigate(`/service/${service._id}`)}
            >
              <div className="mb-4">
                <h3 className="text-xl font-semibold mb-2 group-hover:text-primary-600 transition-colors">
                  {service.name}
                </h3>
                <p className="text-sm text-gray-600 mb-3">{service.category}</p>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-2xl font-bold text-primary-600">${service.price}</p>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="w-4 h-4 mr-1" />
                    {service.duration} hrs
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full group-hover:bg-primary-600 group-hover:text-white transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/service/${service._id}`);
                }}
              >
                View Details
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          ))}
        </div>
        {services.length === 0 && (
          <p className="text-center text-gray-500 py-8">No services available</p>
        )}
      </Card>

      {/* Expired Orders */}
      {expiredBookings.length > 0 && (
        <Card className="p-6 mb-6 border-red-200 bg-red-50">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <h2 className="text-xl font-semibold text-red-900">Expired Orders</h2>
          </div>
          <p className="text-sm text-red-700 mb-4">
            These orders have passed their scheduled time. Please reschedule or request a refund.
          </p>
          <div className="space-y-4">
            {expiredBookings.map((booking) => (
              <div key={booking._id} className="border border-red-300 rounded p-4 bg-white">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold">{booking.serviceId?.name}</h3>
                    <p className="text-sm text-gray-600">
                      Scheduled: {new Date(booking.scheduledDate).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">Amount: ${booking.totalAmount?.toFixed(2) || '0.00'}</p>
                    <p className="text-sm text-gray-600">Payment: {booking.paymentMethod === 'cash' ? 'COD' : 'Online'}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setShowRescheduleModal(booking._id);
                      setNewScheduledDate('');
                    }}
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Re-time
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRequestRefund(booking._id)}
                  >
                    <DollarSign className="w-4 h-4 mr-1" />
                    Request Refund
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Reschedule Order</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">New Date & Time *</label>
              <Input
                type="datetime-local"
                value={newScheduledDate}
                onChange={(e) => setNewScheduledDate(e.target.value)}
                required
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => handleReschedule(showRescheduleModal)}>
                Reschedule
              </Button>
              <Button variant="outline" onClick={() => {
                setShowRescheduleModal('');
                setNewScheduledDate('');
              }}>
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Bookings */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">My Bookings</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Service</th>
                <th className="text-left p-2">Date</th>
                <th className="text-left p-2">Address</th>
                <th className="text-left p-2">Payment</th>
                <th className="text-left p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking._id} className="border-b hover:bg-gray-50">
                  <td className="p-2">{booking.serviceId?.name}</td>
                  <td className="p-2">
                    {new Date(booking.scheduledDate).toLocaleDateString()}
                  </td>
                  <td className="p-2">{booking.address}</td>
                  <td className="p-2">
                    {booking.paymentMethod === 'cash' ? 'COD' : 'Online'}
                  </td>
                  <td className="p-2">
                    <span className={`px-2 py-1 rounded text-xs ${getStatusColor(booking.status)}`}>
                      {booking.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {bookings.length === 0 && (
            <p className="text-center text-gray-500 py-8">No bookings yet</p>
          )}
        </div>
      </Card>
    </DashboardLayout>
  );
}

