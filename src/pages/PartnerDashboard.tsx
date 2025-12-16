import { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { Users, DollarSign, Calendar } from 'lucide-react';

interface Booking {
  _id: string;
  customerId: { name: string; email: string };
  serviceId: { name: string; price: number };
  status: string;
  assignedToEmployee?: { name: string; _id: string };
  assignedEmployees?: Array<{ name: string; _id: string }>;
  scheduledDate: string;
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
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [revenue, setRevenue] = useState<RevenueData | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<string>('');
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);

  useEffect(() => {
    loadBookings();
    loadEmployees();
    loadRevenue();
  }, []);

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
      assigned_to_partner: 'bg-blue-100 text-blue-800',
      assigned_to_employee: 'bg-purple-100 text-purple-800',
      in_progress: 'bg-orange-100 text-orange-800',
      completed: 'bg-green-100 text-green-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const assignedBookings = bookings.filter(
    (b) => b.status === 'assigned_to_partner' || b.status === 'assigned_to_employee'
  );

  return (
    <DashboardLayout title="Partner">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Partner Dashboard</h1>
        <p className="text-gray-600">Manage your assigned jobs and employees</p>
      </div>

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

