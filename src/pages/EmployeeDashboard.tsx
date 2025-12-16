import { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { CheckCircle, Clock, MapPin, Calendar } from 'lucide-react';

interface Booking {
  _id: string;
  customerId: { name: string; email: string; phone: string };
  serviceId: { name: string; price: number };
  status: string;
  scheduledDate: string;
  address: string;
  paymentMethod: string;
}

export default function EmployeeDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      const response = await api.get('/bookings');
      setBookings(response.data);
    } catch (error) {
      toast.error('Failed to load bookings');
    }
  };

  const handleStartJob = async (bookingId: string) => {
    try {
      await api.put(`/bookings/${bookingId}/start`);
      toast.success('Job started');
      loadBookings();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to start job');
    }
  };

  const handleCompleteJob = async (bookingId: string) => {
    try {
      await api.put(`/bookings/${bookingId}/complete`);
      toast.success('Job completed successfully!');
      loadBookings();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to complete job');
    }
  };

  const handleReportCash = async (bookingId: string) => {
    try {
      await api.post(`/payments/${bookingId}/report-cash`);
      toast.success('Cash payment reported');
      loadBookings();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to report cash');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      assigned_to_employee: 'bg-purple-100 text-purple-800',
      in_progress: 'bg-orange-100 text-orange-800',
      completed: 'bg-green-100 text-green-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const activeBookings = bookings.filter(
    (b) => b.status === 'assigned_to_employee' || b.status === 'in_progress'
  );

  return (
    <DashboardLayout title="Employee">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Employee Dashboard</h1>
        <p className="text-gray-600">View and manage your assigned tasks</p>
      </div>

      {/* Active Jobs */}
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">My Tasks</h2>
        <div className="space-y-4">
          {activeBookings.map((booking) => (
            <div key={booking._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-lg">{booking.serviceId?.name}</h3>
                  <p className="text-sm text-gray-600">Customer: {booking.customerId?.name}</p>
                  <p className="text-sm text-gray-600">{booking.customerId?.email}</p>
                  {booking.customerId?.phone && (
                    <p className="text-sm text-gray-600">Phone: {booking.customerId.phone}</p>
                  )}
                </div>
                <span className={`px-3 py-1 rounded text-sm ${getStatusColor(booking.status)}`}>
                  {booking.status.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                <Calendar className="w-4 h-4" />
                <span>{new Date(booking.scheduledDate).toLocaleString()}</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                <MapPin className="w-4 h-4" />
                <span>{booking.address}</span>
              </div>

              <div className="flex gap-2 mt-4">
                {booking.status === 'assigned_to_employee' && (
                  <Button size="sm" onClick={() => handleStartJob(booking._id)}>
                    Start Job
                  </Button>
                )}
                {booking.status === 'in_progress' && (
                  <>
                    <Button size="sm" onClick={() => handleCompleteJob(booking._id)}>
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Complete Job
                    </Button>
                    {booking.paymentMethod === 'cash' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReportCash(booking._id)}
                      >
                        Report COD Payment
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
          {activeBookings.length === 0 && (
            <p className="text-center text-gray-500 py-8">No active tasks</p>
          )}
        </div>
      </Card>

      {/* Completed Jobs */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Completed Jobs</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Service</th>
                <th className="text-left p-2">Customer</th>
                <th className="text-left p-2">Date</th>
                <th className="text-left p-2">Payment</th>
                <th className="text-left p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings
                .filter((b) => b.status === 'completed')
                .map((booking) => (
                  <tr key={booking._id} className="border-b hover:bg-gray-50">
                    <td className="p-2">{booking.serviceId?.name}</td>
                    <td className="p-2">{booking.customerId?.name}</td>
                    <td className="p-2">
                      {new Date(booking.scheduledDate).toLocaleDateString()}
                    </td>
                    <td className="p-2 capitalize">{booking.paymentMethod}</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded text-xs ${getStatusColor(booking.status)}`}>
                        Completed
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          {bookings.filter((b) => b.status === 'completed').length === 0 && (
            <p className="text-center text-gray-500 py-8">No completed jobs</p>
          )}
        </div>
      </Card>
    </DashboardLayout>
  );
}

