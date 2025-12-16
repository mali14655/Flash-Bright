import { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { Users, Calendar, DollarSign, TrendingUp } from 'lucide-react';

interface Booking {
  _id: string;
  customerId: { name: string; email: string };
  serviceId: { name: string; price: number };
  status: string;
  assignedToPartner?: { name: string; _id: string };
  scheduledDate: string;
}

interface Partner {
  _id: string;
  name: string;
  email: string;
}

interface RevenueData {
  summary: {
    totalRevenue: number;
    totalOnlineRevenue: number;
    totalCashRevenue: number;
    totalCommission: number;
    totalAdminShouldPayPartners: number;
    totalPartnersShouldPayAdmin: number;
    adminNetSettlement: number;
  };
  partners: Array<{
    partner: { name: string; email: string };
    totalRevenue: number;
    onlineRevenue: number;
    cashRevenue: number;
    onlineDueToPartner: number;
    cashCommissionOwedToAdmin: number;
    netAdminToPartner: number;
    netDirection: string;
    netAmountAbs: number;
  }>;
}

export default function AdminDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [revenue, setRevenue] = useState<RevenueData | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<string>('');
  const [selectedPartner, setSelectedPartner] = useState<string>('');

  useEffect(() => {
    loadBookings();
    loadPartners();
    loadRevenue();
  }, []);

  const loadRevenue = async () => {
    try {
      const response = await api.get('/revenue/admin');
      setRevenue(response.data);
    } catch (error) {
      console.error('Failed to load revenue');
    }
  };

  const loadBookings = async () => {
    try {
      const response = await api.get('/bookings');
      setBookings(response.data);
    } catch (error) {
      toast.error('Failed to load bookings');
    }
  };

  const loadPartners = async () => {
    try {
      const response = await api.get('/auth/partners');
      setPartners(response.data || []);
    } catch (error) {
      toast.error('Failed to load partners');
    }
  };

  const handleAssignPartner = async (bookingId: string) => {
    if (!selectedPartner) {
      toast.error('Please select a partner');
      return;
    }
    try {
      await api.put(`/bookings/${bookingId}/assign-partner`, { partnerId: selectedPartner });
      toast.success('Booking assigned to partner');
      loadBookings();
      loadRevenue();
      setSelectedBooking('');
      setSelectedPartner('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to assign partner');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      assigned_to_partner: 'bg-blue-100 text-blue-800',
      assigned_to_employee: 'bg-purple-100 text-purple-800',
      in_progress: 'bg-orange-100 text-orange-800',
      completed: 'bg-green-100 text-green-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const pendingBookings = bookings.filter((b) => b.status === 'pending');
  const completedBookings = bookings.filter((b) => b.status === 'completed');

  return (
    <DashboardLayout title="Admin">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Manage bookings, partners, and operations</p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Bookings</p>
              <p className="text-2xl font-bold">{bookings.length}</p>
            </div>
            <Calendar className="w-8 h-8 text-primary-600" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold">{pendingBookings.length}</p>
            </div>
            <Users className="w-8 h-8 text-yellow-600" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold">{completedBookings.length}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Partners</p>
              <p className="text-2xl font-bold">{partners.length}</p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-600" />
          </div>
        </Card>
      </div>

      {/* Pending Bookings */}
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Pending Bookings</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Customer</th>
                <th className="text-left p-2">Service</th>
                <th className="text-left p-2">Date</th>
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingBookings.map((booking) => (
                <tr key={booking._id} className="border-b hover:bg-gray-50">
                  <td className="p-2">{booking.customerId?.name}</td>
                  <td className="p-2">{booking.serviceId?.name}</td>
                  <td className="p-2">
                    {new Date(booking.scheduledDate).toLocaleDateString()}
                  </td>
                  <td className="p-2">
                    <span className={`px-2 py-1 rounded text-xs ${getStatusColor(booking.status)}`}>
                      {booking.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="p-2">
                    {selectedBooking === booking._id ? (
                      <div className="flex gap-2 items-center">
                        <select
                          value={selectedPartner}
                          onChange={(e) => setSelectedPartner(e.target.value)}
                          className="text-sm border rounded px-2 py-1"
                        >
                          <option value="">Select Partner</option>
                          {partners.map((p) => (
                            <option key={p._id} value={p._id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                        <Button
                          size="sm"
                          onClick={() => handleAssignPartner(booking._id)}
                          disabled={!selectedPartner}
                        >
                          Assign
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedBooking('')}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button size="sm" onClick={() => setSelectedBooking(booking._id)}>
                        Assign Partner
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {pendingBookings.length === 0 && (
            <p className="text-center text-gray-500 py-8">No pending bookings</p>
          )}
        </div>
      </Card>

      {/* Revenue & Settlements */}
      {revenue && (
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Revenue & Settlements</h2>
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Admin Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Revenue:</span>
                  <span className="font-semibold">${revenue.summary.totalRevenue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Online Payments (Admin Received):</span>
                  <span className="font-semibold text-green-600">
                    ${revenue.summary.totalOnlineRevenue.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cash Payments (Partners Collected):</span>
                  <span className="font-semibold text-blue-600">
                    ${revenue.summary.totalCashRevenue.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Commission (15%):</span>
                  <span className="font-semibold">
                    ${revenue.summary.totalCommission.toFixed(2)}
                  </span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Admin Should Pay Partners (Net):</span>
                    <span className="font-semibold text-orange-600">
                      ${revenue.summary.totalAdminShouldPayPartners.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    (Online share to partners)
                  </p>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Partners Should Pay Admin (Net):</span>
                    <span className="font-semibold text-green-700">
                      ${revenue.summary.totalPartnersShouldPayAdmin.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    (Commission from cash payments)
                  </p>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="font-semibold">Final Net Settlement (Admin):</span>
                    <span
                      className={`font-bold text-lg ${
                        revenue.summary.adminNetSettlement >= 0
                          ? 'text-green-700'
                          : 'text-orange-600'
                      }`}
                    >
                      {revenue.summary.adminNetSettlement >= 0 ? '+' : '-'}$
                      {Math.abs(revenue.summary.adminNetSettlement).toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {revenue.summary.adminNetSettlement >= 0
                      ? 'Admin should RECEIVE this amount in total'
                      : 'Admin should PAY this amount in total'}
                  </p>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-3">Partner Breakdown</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {revenue.partners.length > 0 ? (
                  revenue.partners.map((p, idx) => (
                    <div key={idx} className="border rounded p-3 bg-gray-50">
                      <div className="font-semibold mb-2">{p.partner.name}</div>
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span>Total Revenue:</span>
                          <span>${p.totalRevenue.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Online:</span>
                          <span className="text-green-600">${p.onlineRevenue.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Cash:</span>
                          <span className="text-blue-600">${p.cashRevenue.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Online share to partner (85%):</span>
                          <span>${p.onlineDueToPartner.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Cash commission to admin (15%):</span>
                          <span>-${p.cashCommissionOwedToAdmin.toFixed(2)}</span>
                        </div>
                        <div className="border-t pt-1 mt-1 flex justify-between font-semibold">
                          <span>
                            {p.netDirection === 'admin_owes_partner'
                              ? 'Admin should pay partner:'
                              : 'Partner should pay admin:'}
                          </span>
                          <span
                            className={
                              p.netDirection === 'admin_owes_partner'
                                ? 'text-orange-600'
                                : 'text-green-700'
                            }
                          >
                            ${p.netAmountAbs.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No partner revenue data</p>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* All Bookings */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">All Bookings</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Customer</th>
                <th className="text-left p-2">Service</th>
                <th className="text-left p-2">Partner</th>
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking._id} className="border-b hover:bg-gray-50">
                  <td className="p-2">{booking.customerId?.name}</td>
                  <td className="p-2">{booking.serviceId?.name}</td>
                  <td className="p-2">{booking.assignedToPartner?.name || '-'}</td>
                  <td className="p-2">
                    <span className={`px-2 py-1 rounded text-xs ${getStatusColor(booking.status)}`}>
                      {booking.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="p-2">
                    {new Date(booking.scheduledDate).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </DashboardLayout>
  );
}

