import { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { Users, DollarSign, Calendar, Bell, CheckCircle, XCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface Booking {
  _id: string;
  customerId: { name: string; email: string; phone?: string };
  serviceId: { name: string; price: number; category: string };
  status: string;
  assignedToEmployee?: { name: string; _id: string };
  assignedEmployees?: Array<{ name: string; _id: string }>;
  scheduledDate: string;
  address: string;
  paymentMethod: string;
  totalAmount?: number;
  hours?: number;
  numberOfPeople?: number;
  selectedExtras?: Array<{ name: string; price: number }>;
  availableForCompanies?: Array<{ _id: string; name: string }>;
}

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  bookingId?: string;
}

interface Employee {
  _id: string;
  name: string;
  email: string;
}

interface RevenueData {
  summary: {
    totalRevenue: number;
    totalOnlineRevenue: number;
    totalCashRevenue: number;
    commissionRate: number;
    onlineAmountFromAdmin: number;
    cashCommissionToAdmin: number;
    netForPartner: number;
    netDirection: string;
    netAmountAbs: number;
    cashAlreadyReceived: number;
  };
}

export default function PartnerDashboard() {
  const { user, setUser } = useAuthStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [revenue, setRevenue] = useState<RevenueData | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [selectedBooking, setSelectedBooking] = useState<string>('');
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [showDeclineModal, setShowDeclineModal] = useState<string>('');
  const [declineReason, setDeclineReason] = useState<string>('');
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateRequestSubmitted, setUpdateRequestSubmitted] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: (user as any)?.address || '',
    companyDescription: (user as any)?.companyDescription || '',
  });

  useEffect(() => {
    loadUserData();
    loadBookings();
    loadEmployees();
    loadRevenue();
    loadNotifications();
    const interval = setInterval(() => {
      loadBookings();
      loadNotifications();
    }, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadUserData = async () => {
    try {
      const response = await api.get('/auth/me');
      const userData = response.data.user;
      setUser(userData);
      setProfileForm({
        name: userData.name || '',
        phone: userData.phone || '',
        address: userData.address || '',
        companyDescription: userData.companyDescription || '',
      });
    } catch (error) {
      console.error('Failed to load user data');
    }
  };

  const loadRevenue = async () => {
    try {
      const response = await api.get('/revenue/partner');
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

  const loadEmployees = async () => {
    try {
      const response = await api.get('/auth/employees');
      setEmployees(response.data);
    } catch (error) {
      toast.error('Failed to load employees');
    }
  };

  const loadNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data);
      const unreadResponse = await api.get('/notifications/unread-count');
      setUnreadCount(unreadResponse.data.count);
    } catch (error) {
      console.error('Failed to load notifications');
    }
  };

  const markNotificationRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      loadNotifications();
    } catch (error) {
      console.error('Failed to mark notification as read');
    }
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      loadNotifications();
    } catch (error) {
      console.error('Failed to mark all as read');
    }
  };

  const handleAcceptOrder = async (bookingId: string) => {
    try {
      await api.put(`/bookings/${bookingId}/accept`);
      toast.success('Order accepted');
      loadBookings();
      loadNotifications();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to accept order');
    }
  };

  const handleSaveProfile = async () => {
    try {
      const response = await api.put('/auth/partner/profile', {
        ...profileForm,
        markCompleted: !user?.profileCompleted, // Only mark completed if not already completed
      });
      
      if (user?.isVerified) {
        // After verification, this creates an update request
        toast.success('Profile update request submitted. Waiting for admin approval.');
        setUpdateRequestSubmitted(true);
        setShowUpdateModal(false);
      } else {
        // Before verification, this updates directly
        toast.success('Profile saved successfully');
        if (response.data.profileCompleted) {
          toast.success('Profile completed! Waiting for admin verification.');
        }
      }
      
      // Update auth store user with latest data
      await loadUserData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleDeclineOrder = async () => {
    if (!declineReason.trim()) {
      toast.error('Please provide a reason for declining');
      return;
    }
    try {
      await api.put(`/bookings/${showDeclineModal}/decline`, { reason: declineReason });
      toast.success('Order declined');
      setShowDeclineModal('');
      setDeclineReason('');
      loadBookings();
      loadNotifications();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to decline order');
    }
  };

  const handleAssignEmployees = async (bookingId: string) => {
    if (selectedEmployees.length === 0) {
      toast.error('Please select at least one employee');
      return;
    }
    try {
      await api.put(`/bookings/${bookingId}/assign-employees`, { employeeIds: selectedEmployees });
      toast.success(`Booking assigned to ${selectedEmployees.length} employee(s)`);
      loadBookings();
      setSelectedBooking('');
      setSelectedEmployees([]);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to assign employees');
    }
  };

  const toggleEmployeeSelection = (employeeId: string) => {
    setSelectedEmployees((prev) =>
      prev.includes(employeeId)
        ? prev.filter((id) => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      available_for_companies: 'bg-orange-100 text-orange-800',
      assigned_by_admin: 'bg-blue-100 text-blue-800',
      assigned_to_partner: 'bg-green-100 text-green-800',
      assigned_to_employee: 'bg-purple-100 text-purple-800',
      in_progress: 'bg-orange-100 text-orange-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      declined: 'bg-gray-100 text-gray-800',
      expired: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const assignedBookings = bookings.filter(
    (b) => (b.status === 'assigned_to_partner' && (b.assignedToEmployee || (b.assignedEmployees && b.assignedEmployees.length > 0))) || 
           b.status === 'assigned_to_employee' || 
           b.status === 'in_progress' ||
           b.status === 'completed'
  );

  return (
    <DashboardLayout title="Partner">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Partner Dashboard</h1>
        <p className="text-gray-600">Manage your company profile, assigned jobs, and employees</p>
      </div>

      {/* Company Profile */}
      <Card className="p-6 mb-6">
        {!user?.profileCompleted && (
          <div className="mb-4 rounded border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
            <p className="font-semibold mb-1">Complete your company profile</p>
            <p>
              Orders will not be assigned to you until your profile is completed and approved by admin.
            </p>
          </div>
        )}
        {user?.profileCompleted && !user?.isVerified && (
          <div className="mb-4 rounded border border-blue-300 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            <p className="font-semibold mb-1">Profile Completed - Awaiting Verification</p>
            <p>Your profile has been submitted and is waiting for admin verification.</p>
          </div>
        )}
        {updateRequestSubmitted && (
          <div className="mb-4 rounded border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800">
            <p className="font-semibold mb-1">Update Request Submitted</p>
            <p>Your profile update request has been sent to admin for approval.</p>
          </div>
        )}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Company Profile</h2>
          {user?.isVerified && (
            <Button onClick={() => {
              setShowUpdateModal(true);
              setUpdateRequestSubmitted(false);
            }}>
              Update Profile
            </Button>
          )}
        </div>

        {!user?.profileCompleted ? (
          // Show form if profile not completed
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Company Name</label>
              <Input
                type="text"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Contact Phone</label>
              <Input
                type="text"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Company Address</label>
              <Input
                type="text"
                value={profileForm.address}
                onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">About Your Company</label>
              <textarea
                className="w-full border rounded p-2 text-sm"
                rows={3}
                value={profileForm.companyDescription}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, companyDescription: e.target.value })
                }
                placeholder="Describe your services, experience, or service areas..."
              />
            </div>
          </div>
        ) : (
          // Show read-only view if profile completed
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-600">Company Name</label>
              <p className="text-gray-900">{profileForm.name || '-'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-600">Contact Phone</label>
              <p className="text-gray-900">{profileForm.phone || '-'}</p>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1 text-gray-600">Company Address</label>
              <p className="text-gray-900">{profileForm.address || '-'}</p>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1 text-gray-600">About Your Company</label>
              <p className="text-gray-900 whitespace-pre-wrap">{profileForm.companyDescription || '-'}</p>
            </div>
          </div>
        )}

        {!user?.profileCompleted && (
          <div className="mt-4 flex justify-end">
            <Button onClick={handleSaveProfile}>Save Profile</Button>
          </div>
        )}
      </Card>

      {/* Update Profile Modal */}
      {showUpdateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">Update Company Profile</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Company Name</label>
                <Input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Contact Phone</label>
                <Input
                  type="text"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Company Address</label>
                <Input
                  type="text"
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">About Your Company</label>
                <textarea
                  className="w-full border rounded p-2 text-sm"
                  rows={3}
                  value={profileForm.companyDescription}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, companyDescription: e.target.value })
                  }
                  placeholder="Describe your services, experience, or service areas..."
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setShowUpdateModal(false);
                loadUserData(); // Reset form to current values
              }}>
                Cancel
              </Button>
              <Button onClick={handleSaveProfile}>Submit Update Request</Button>
            </div>
          </Card>
        </div>
      )}

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Assigned Jobs</p>
              <p className="text-2xl font-bold">{assignedBookings.length}</p>
            </div>
            <Calendar className="w-8 h-8 text-blue-600" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Employees</p>
              <p className="text-2xl font-bold">{employees.length}</p>
            </div>
            <Users className="w-8 h-8 text-green-600" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold">
                {bookings.filter((b) => b.status === 'completed').length}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-purple-600" />
          </div>
        </Card>
      </div>

      {/* Revenue Summary */}
      {revenue && (
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Revenue Summary</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-semibold">Payment Breakdown</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Revenue:</span>
                  <span className="font-semibold">${revenue.summary.totalRevenue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Online Payments:</span>
                  <span className="font-semibold text-green-600">${revenue.summary.totalOnlineRevenue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cash Payments (You Received):</span>
                  <span className="font-semibold text-blue-600">${revenue.summary.totalCashRevenue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    Commission Rate:
                  </span>
                  <span className="font-semibold">
                    {(revenue.summary.commissionRate * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold">Settlement</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Admin Should Pay You (Online share 85%):</span>
                  <span className="font-semibold text-orange-600">
                    ${revenue.summary.onlineAmountFromAdmin.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">You Should Pay Admin (Cash commission 15%):</span>
                  <span className="font-semibold text-green-600">
                    -${revenue.summary.cashCommissionToAdmin.toFixed(2)}
                  </span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="font-semibold">Final Net Settlement (You):</span>
                    <span className="font-bold text-primary-600 text-lg">
                      {revenue.summary.netDirection === 'admin_owes_partner' ? '+' : '-'}$
                      {revenue.summary.netAmountAbs.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {revenue.summary.netDirection === 'admin_owes_partner'
                      ? 'Admin SHOULD PAY you this amount in total (online - cash commission).'
                      : 'You SHOULD PAY admin this amount in total (cash commission - online share).'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Notifications */}
      {unreadCount > 0 && (
        <Card className="p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications ({unreadCount})
            </h2>
            <Button size="sm" variant="outline" onClick={markAllRead}>
              Mark All Read
            </Button>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {notifications.slice(0, 10).map((notif) => (
              <div
                key={notif._id}
                className={`p-3 border rounded cursor-pointer hover:bg-gray-50 ${
                  !notif.isRead ? 'bg-blue-50 border-blue-200' : ''
                }`}
                onClick={() => {
                  if (!notif.isRead) markNotificationRead(notif._id);
                }}
              >
                <p className="font-semibold text-sm">{notif.title}</p>
                <p className="text-sm text-gray-600">{notif.message}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(notif.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Available Orders (for acceptance) */}
      {bookings.filter(b => b.status === 'available_for_companies').length > 0 && (
        <Card className="p-6 mb-6 border-2 border-orange-300">
          <h2 className="text-xl font-semibold mb-2 text-orange-600">Available Orders</h2>
          <p className="text-sm text-gray-600 mb-4">These orders are available for acceptance. Accept quickly before other companies take them!</p>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Customer</th>
                  <th className="text-left p-2">Service</th>
                  <th className="text-left p-2">Amount</th>
                  <th className="text-left p-2">Date</th>
                  <th className="text-left p-2">Address</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings
                  .filter(b => b.status === 'available_for_companies')
                  .map((booking) => (
                    <tr key={booking._id} className="border-b hover:bg-orange-50">
                      <td className="p-2">
                        <div>
                          <p className="font-medium">{booking.customerId?.name}</p>
                          <p className="text-xs text-gray-500">{booking.customerId?.email}</p>
                          {booking.customerId?.phone && (
                            <p className="text-xs text-gray-500">{booking.customerId.phone}</p>
                          )}
                        </div>
                      </td>
                      <td className="p-2">
                        <div>
                          <p className="font-medium">{booking.serviceId?.name}</p>
                          <p className="text-xs text-gray-500">{booking.serviceId?.category}</p>
                        </div>
                      </td>
                      <td className="p-2">${booking.totalAmount?.toFixed(2) || booking.serviceId?.price.toFixed(2)}</td>
                      <td className="p-2">
                        {new Date(booking.scheduledDate).toLocaleDateString()}
                        <br />
                        <span className="text-xs text-gray-500">
                          {new Date(booking.scheduledDate).toLocaleTimeString()}
                        </span>
                      </td>
                      <td className="p-2">
                        <p className="text-sm">{booking.address}</p>
                      </td>
                      <td className="p-2">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleAcceptOrder(booking._id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => setShowDeclineModal(booking._id)}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Decline
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Assigned by Admin (needs acceptance/decline) */}
      {bookings.filter(b => b.status === 'assigned_by_admin').length > 0 && (
        <Card className="p-6 mb-6 border-2 border-blue-300">
          <h2 className="text-xl font-semibold mb-2 text-blue-600">Assigned by Admin</h2>
          <p className="text-sm text-gray-600 mb-4">These orders have been assigned to you by admin. Please accept or decline with a reason.</p>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Customer</th>
                  <th className="text-left p-2">Service</th>
                  <th className="text-left p-2">Amount</th>
                  <th className="text-left p-2">Date</th>
                  <th className="text-left p-2">Address</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings
                  .filter(b => b.status === 'assigned_by_admin')
                  .map((booking) => (
                    <tr key={booking._id} className="border-b hover:bg-blue-50">
                      <td className="p-2">
                        <div>
                          <p className="font-medium">{booking.customerId?.name}</p>
                          <p className="text-xs text-gray-500">{booking.customerId?.email}</p>
                          {booking.customerId?.phone && (
                            <p className="text-xs text-gray-500">{booking.customerId.phone}</p>
                          )}
                        </div>
                      </td>
                      <td className="p-2">
                        <div>
                          <p className="font-medium">{booking.serviceId?.name}</p>
                          <p className="text-xs text-gray-500">{booking.serviceId?.category}</p>
                        </div>
                      </td>
                      <td className="p-2">${booking.totalAmount?.toFixed(2) || booking.serviceId?.price.toFixed(2)}</td>
                      <td className="p-2">
                        {new Date(booking.scheduledDate).toLocaleDateString()}
                        <br />
                        <span className="text-xs text-gray-500">
                          {new Date(booking.scheduledDate).toLocaleTimeString()}
                        </span>
                      </td>
                      <td className="p-2">
                        <p className="text-sm">{booking.address}</p>
                      </td>
                      <td className="p-2">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleAcceptOrder(booking._id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => setShowDeclineModal(booking._id)}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Decline
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* My Accepted Orders (no decline option, only assign employees) */}
      {bookings.filter(b => b.status === 'assigned_to_partner' && !b.assignedToEmployee && (!b.assignedEmployees || b.assignedEmployees.length === 0)).length > 0 && (
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">My Accepted Orders</h2>
          <p className="text-sm text-gray-600 mb-4">Assign employees to these orders to proceed. Once accepted, orders cannot be declined.</p>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Customer</th>
                  <th className="text-left p-2">Service</th>
                  <th className="text-left p-2">Amount</th>
                  <th className="text-left p-2">Date</th>
                  <th className="text-left p-2">Address</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings
                  .filter(b => b.status === 'assigned_to_partner' && !b.assignedToEmployee && (!b.assignedEmployees || b.assignedEmployees.length === 0))
                  .map((booking) => (
                    <tr key={booking._id} className="border-b hover:bg-gray-50">
                      <td className="p-2">
                        <div>
                          <p className="font-medium">{booking.customerId?.name}</p>
                          <p className="text-xs text-gray-500">{booking.customerId?.email}</p>
                          {booking.customerId?.phone && (
                            <p className="text-xs text-gray-500">{booking.customerId.phone}</p>
                          )}
                        </div>
                      </td>
                      <td className="p-2">
                        <div>
                          <p className="font-medium">{booking.serviceId?.name}</p>
                          <p className="text-xs text-gray-500">{booking.serviceId?.category}</p>
                        </div>
                      </td>
                      <td className="p-2">${booking.totalAmount?.toFixed(2) || booking.serviceId?.price.toFixed(2)}</td>
                      <td className="p-2">
                        {new Date(booking.scheduledDate).toLocaleDateString()}
                        <br />
                        <span className="text-xs text-gray-500">
                          {new Date(booking.scheduledDate).toLocaleTimeString()}
                        </span>
                      </td>
                      <td className="p-2">
                        <p className="text-sm">{booking.address}</p>
                      </td>
                      <td className="p-2">
                        {selectedBooking === booking._id ? (
                          <div className="space-y-2">
                            <div className="text-sm font-medium mb-2">Select Employees:</div>
                            <div className="space-y-1 max-h-32 overflow-y-auto border rounded p-2">
                              {employees.map((emp) => (
                                <label
                                  key={emp._id}
                                  className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
                                >
                                  <input
                                    type="checkbox"
                                    checked={selectedEmployees.includes(emp._id)}
                                    onChange={() => toggleEmployeeSelection(emp._id)}
                                    className="rounded"
                                  />
                                  <span className="text-sm">{emp.name}</span>
                                </label>
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleAssignEmployees(booking._id)}
                                disabled={selectedEmployees.length === 0}
                              >
                                Assign
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedBooking('');
                                  setSelectedEmployees([]);
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => setSelectedBooking(booking._id)}
                          >
                            Assign Employees
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Decline Modal */}
      {showDeclineModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Decline Order</h3>
            <p className="text-sm text-gray-600 mb-4">Please provide a reason for declining this order. This is required.</p>
            <textarea
              className="w-full border rounded p-2 mb-4"
              rows={4}
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              placeholder="Enter reason for declining (required)..."
              required
            />
            <div className="flex gap-2">
              <Button onClick={handleDeclineOrder} disabled={!declineReason.trim()}>Submit</Button>
              <Button variant="outline" onClick={() => {
                setShowDeclineModal('');
                setDeclineReason('');
              }}>
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Assigned Bookings */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Assigned Jobs</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Customer</th>
                <th className="text-left p-2">Service</th>
                <th className="text-left p-2">Date</th>
                <th className="text-left p-2">Assigned Employees</th>
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {assignedBookings.map((booking) => (
                <tr key={booking._id} className="border-b hover:bg-gray-50">
                  <td className="p-2">{booking.customerId?.name}</td>
                  <td className="p-2">{booking.serviceId?.name}</td>
                  <td className="p-2">
                    {new Date(booking.scheduledDate).toLocaleDateString()}
                  </td>
                  <td className="p-2">
                    {booking.assignedEmployees && booking.assignedEmployees.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {booking.assignedEmployees.map((emp, idx) => (
                          <span
                            key={emp._id || idx}
                            className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                          >
                            {emp.name}
                          </span>
                        ))}
                      </div>
                    ) : booking.assignedToEmployee ? (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        {booking.assignedToEmployee.name}
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="p-2">
                    <span className={`px-2 py-1 rounded text-xs ${getStatusColor(booking.status)}`}>
                      {booking.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="p-2">
                    {booking.status === 'assigned_to_partner' ? (
                      selectedBooking === booking._id ? (
                        <div className="space-y-2">
                          <div className="text-sm font-medium mb-2">Select Employees:</div>
                          <div className="space-y-1 max-h-32 overflow-y-auto border rounded p-2">
                            {employees.map((emp) => (
                              <label
                                key={emp._id}
                                className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedEmployees.includes(emp._id)}
                                  onChange={() => toggleEmployeeSelection(emp._id)}
                                  className="rounded"
                                />
                                <span className="text-sm">{emp.name}</span>
                              </label>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleAssignEmployees(booking._id)}
                              disabled={selectedEmployees.length === 0}
                            >
                              Assign {selectedEmployees.length > 0 && `(${selectedEmployees.length})`}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedBooking('');
                                setSelectedEmployees([]);
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button size="sm" onClick={() => setSelectedBooking(booking._id)}>
                          Assign Employees
                        </Button>
                      )
                    ) : (
                      <span className="text-sm text-gray-500">Assigned</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {assignedBookings.length === 0 && (
            <p className="text-center text-gray-500 py-8">No assigned jobs</p>
          )}
        </div>
      </Card>
    </DashboardLayout>
  );
}

