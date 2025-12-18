import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { 
  Users, Calendar, DollarSign, TrendingUp, Building2, Settings, 
  BarChart3, Package, CheckCircle, XCircle, Bell, ToggleLeft, ToggleRight, AlertCircle, ShieldCheck, FileEdit
} from 'lucide-react';

interface Booking {
  _id: string;
  customerId: { name: string; email: string; phone?: string };
  serviceId: { name: string; price: number; category: string };
  status: string;
  assignedToPartner?: { name: string; _id: string };
  scheduledDate: string;
  address: string;
  paymentMethod: string;
  totalAmount?: number;
  hours?: number;
  numberOfPeople?: number;
  selectedExtras?: Array<{ name: string; price: number }>;
  declinedBy?: { name: string };
  declineReason?: string;
}

interface Company {
  _id: string;
  name: string;
  email: string;
  phone: string;
  isActive: boolean;
  orderReceivingEnabled: boolean;
  profileCompleted?: boolean;
  registrationCode?: string;
  isVerified?: boolean;
}

interface Employee {
  _id: string;
  name: string;
  email: string;
  phone: string;
  companyId?: { name: string; _id: string };
  isActive: boolean;
}

interface EmployeeApproval {
  _id: string;
  employeeId?: { name: string; email: string };
  companyId: { name: string; email: string };
  action: 'create' | 'update' | 'delete';
  employeeData: { name: string; email: string; phone: string };
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

interface CompanyApproval {
  _id: string;
  companyId: { _id: string; name: string; email: string; phone?: string; address?: string; companyDescription?: string };
  action: 'verify' | 'update';
  companyData: { name?: string; email?: string; phone?: string; address?: string; companyDescription?: string };
  oldData?: { name?: string; email?: string; phone?: string; address?: string; companyDescription?: string };
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  notes?: string;
}

interface PerformanceData {
  partner: { _id: string; name: string; email: string };
  summary: {
    received: number;
    accepted: number;
    completed: number;
    declined: number;
    acceptanceRate: number;
    completionRate: number;
  };
  monthlyData: Array<{
    month: string;
    received: number;
    accepted: number;
    completed: number;
    declined: number;
  }>;
}

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
  isActive: boolean;
}

interface ExpiredBooking {
  _id: string;
  customerId: { name: string; email: string; phone?: string };
  serviceId: { name: string; category: string; price: number };
  scheduledDate: string;
  totalAmount?: number;
  paymentMethod: string;
  address: string;
  isExpired: boolean;
  expiredAt?: string;
}

interface Refund {
  _id: string;
  bookingId: { _id: string; serviceId: { name: string }; customerId: { name: string }; scheduledDate: string };
  customerId: { name: string; email: string };
  amount: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'processed';
  paymentMethod: string;
  processedBy?: { name: string };
  processedAt?: string;
  transactionId?: string;
  createdAt: string;
}

type Tab = 'overview' | 'companies' | 'verification' | 'employees' | 'orders' | 'expired' | 'refunds' | 'services' | 'commission' | 'performance';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [approvals, setApprovals] = useState<EmployeeApproval[]>([]);
  const [companyApprovals, setCompanyApprovals] = useState<CompanyApproval[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [expiredBookings, setExpiredBookings] = useState<ExpiredBooking[]>([]);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [commissionRate, setCommissionRate] = useState<number>(0.15);
  const [adminAssignmentMode, setAdminAssignmentMode] = useState<boolean>(false);
  const [verificationCount, setVerificationCount] = useState<number>(0);
  const [updateRequestCount, setUpdateRequestCount] = useState<number>(0);
  
  // Form states
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<string>('');
  const [selectedPartner, setSelectedPartner] = useState<string>('');

  // Form data
  const [companyForm, setCompanyForm] = useState({ name: '', email: '', phone: '' });
  const [serviceForm, setServiceForm] = useState({
    name: '', category: '', price: 0, duration: 1, description: '',
    image: '', perHourFee: 0, perPersonFee: 0, hasExtraRequirements: false,
    extraRequirements: [] as Array<{ name: string; price: number }>
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    if (activeTab === 'overview' || activeTab === 'orders') {
      await loadBookings();
      await loadCompanies(); // Load companies for partner assignment
    }
    if (activeTab === 'companies') {
      await loadCompanies();
      await loadAdminSettings();
    }
    if (activeTab === 'employees') {
      await loadEmployees();
      await loadApprovals();
    }
    if (activeTab === 'verification') {
      await loadApprovals();
    }
    if (activeTab === 'services') {
      await loadServices();
    }
    if (activeTab === 'performance') {
      await loadPerformance();
    }
    if (activeTab === 'commission') {
      await loadCommission();
    }
    if (activeTab === 'expired') {
      await loadExpiredBookings();
    }
    if (activeTab === 'refunds') {
      await loadRefunds();
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

  const loadCompanies = async () => {
    try {
      const response = await api.get('/companies');
      setCompanies(response.data);
    } catch (error) {
      toast.error('Failed to load companies');
    }
  };

  const loadAdminSettings = async () => {
    try {
      const response = await api.get('/companies/settings/admin-assignment-mode');
      setAdminAssignmentMode(response.data.adminAssignmentMode);
    } catch (error) {
      console.error('Failed to load admin settings');
    }
  };

  const loadEmployees = async () => {
    try {
      const response = await api.get('/employees');
      setEmployees(response.data);
    } catch (error) {
      toast.error('Failed to load employees');
    }
  };

  const loadApprovals = async () => {
    try {
      const response = await api.get('/employees/approvals/pending');
      setApprovals(response.data);
    } catch (error) {
      toast.error('Failed to load approvals');
    }
    try {
      const companyRes = await api.get('/companies/approvals/pending');
      setCompanyApprovals(companyRes.data);
      // Update counts
      const verifyCount = companyRes.data.filter((a: CompanyApproval) => a.action === 'verify').length;
      const updateCount = companyRes.data.filter((a: CompanyApproval) => a.action === 'update').length;
      setVerificationCount(verifyCount);
      setUpdateRequestCount(updateCount);
    } catch (error) {
      console.error('Failed to load company approvals');
    }
  };

  const loadServices = async () => {
    try {
      const response = await api.get('/services');
      setServices(response.data);
    } catch (error) {
      toast.error('Failed to load services');
    }
  };

  const loadPerformance = async () => {
    try {
      const response = await api.get('/performance/partners');
      setPerformanceData(response.data);
    } catch (error) {
      toast.error('Failed to load performance data');
    }
  };

  const loadCommission = async () => {
    try {
      const response = await api.get('/commission');
      setCommissionRate(response.data.rate);
    } catch (error) {
      toast.error('Failed to load commission rate');
    }
  };

  const handleCreateCompany = async () => {
    try {
      const response = await api.post('/companies', companyForm);
      const created = response.data;
      toast.success(
        created.registrationCode
          ? `Company created. Registration code: ${created.registrationCode}`
          : 'Company created successfully'
      );
      setShowCompanyForm(false);
      setCompanyForm({ name: '', email: '', phone: '' });
      loadCompanies();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create company');
    }
  };

  const handleUpdateCompany = async (id: string, data: Partial<Company>) => {
    try {
      await api.put(`/companies/${id}`, data);
      toast.success('Company updated successfully');
      loadCompanies();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update company');
    }
  };

  const handleDeleteCompany = async (id: string) => {
    if (!confirm('Are you sure you want to delete this company?')) return;
    try {
      await api.delete(`/companies/${id}`);
      toast.success('Company deleted successfully');
      loadCompanies();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete company');
    }
  };

  const handleToggleOrderReceiving = async (id: string) => {
    try {
      await api.put(`/companies/${id}/toggle-order-receiving`);
      toast.success('Order receiving toggled');
      loadCompanies();
    } catch (error: any) {
      toast.error('Failed to toggle order receiving');
    }
  };

  const handleToggleAdminAssignmentMode = async () => {
    try {
      await api.put('/companies/settings/admin-assignment-mode', {
        adminAssignmentMode: !adminAssignmentMode
      });
      setAdminAssignmentMode(!adminAssignmentMode);
      toast.success('Admin assignment mode toggled');
    } catch (error: any) {
      toast.error('Failed to toggle admin assignment mode');
    }
  };

  const handleApproveEmployee = async (approvalId: string, status: 'approved' | 'rejected') => {
    try {
      await api.put(`/employees/approvals/${approvalId}`, { status });
      toast.success(`Employee action ${status}`);
      loadApprovals();
      loadEmployees();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to process approval');
    }
  };

  const handleApproveCompany = async (approvalId: string, status: 'approved' | 'rejected') => {
    try {
      await api.put(`/companies/approvals/${approvalId}`, { status });
      toast.success(`Company profile update ${status}`);
      loadApprovals();
      loadCompanies();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to process company approval');
    }
  };

  const handleCreateService = async () => {
    try {
      await api.post('/services', serviceForm);
      toast.success('Service created successfully');
      setShowServiceForm(false);
      setServiceForm({
        name: '', category: '', price: 0, duration: 1, description: '',
        image: '', perHourFee: 0, perPersonFee: 0, hasExtraRequirements: false,
        extraRequirements: []
      });
      loadServices();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create service');
    }
  };

  const handleUpdateCommission = async () => {
    try {
      await api.put('/commission', { rate: commissionRate });
      toast.success('Commission rate updated successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update commission');
    }
  };

  const loadExpiredBookings = async () => {
    try {
      const response = await api.get('/bookings/expired/admin');
      setExpiredBookings(response.data);
    } catch (error) {
      toast.error('Failed to load expired bookings');
    }
  };

  const loadRefunds = async () => {
    try {
      const response = await api.get('/refunds');
      setRefunds(response.data);
    } catch (error) {
      toast.error('Failed to load refunds');
    }
  };

  const handleProcessRefund = async (refundId: string, status: 'approved' | 'rejected' | 'processed', transactionId?: string) => {
    try {
      await api.put(`/refunds/${refundId}/process`, { status, transactionId });
      toast.success(`Refund ${status}`);
      loadRefunds();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to process refund');
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
      declined: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const tabs = [
    { id: 'overview' as Tab, label: 'Overview', icon: BarChart3, badge: null },
    { id: 'companies' as Tab, label: 'Companies', icon: Building2, badge: null },
    { id: 'verification' as Tab, label: 'Verification', icon: ShieldCheck, badge: verificationCount + updateRequestCount },
    { id: 'employees' as Tab, label: 'Employees', icon: Users, badge: approvals.length },
    { id: 'orders' as Tab, label: 'Orders', icon: Calendar, badge: null },
    { id: 'expired' as Tab, label: 'Expired Orders', icon: AlertCircle, badge: null },
    { id: 'refunds' as Tab, label: 'Refunds', icon: DollarSign, badge: null },
    { id: 'services' as Tab, label: 'Services', icon: Package, badge: null },
    { id: 'commission' as Tab, label: 'Commission', icon: Settings, badge: null },
    { id: 'performance' as Tab, label: 'Performance', icon: TrendingUp, badge: null },
  ];

  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const completedBookings = bookings.filter(b => b.status === 'completed');

  return (
    <DashboardLayout title="Admin">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Manage companies, orders, and operations</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm relative ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.badge !== null && tab.badge > 0 && (
                  <span className="ml-1 px-2 py-0.5 text-xs font-bold text-white bg-red-500 rounded-full">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-4 gap-4">
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
                  <p className="text-sm text-gray-600">Companies</p>
                  <p className="text-2xl font-bold">{companies.length}</p>
                </div>
                <Building2 className="w-8 h-8 text-blue-600" />
              </div>
            </Card>
          </div>


          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Pending Bookings</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Customer</th>
                    <th className="text-left p-2">Service</th>
                    <th className="text-left p-2">Date</th>
                    <th className="text-left p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingBookings.slice(0, 5).map((booking) => (
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
                    </tr>
                  ))}
                </tbody>
              </table>
              {pendingBookings.length === 0 && (
                <p className="text-center text-gray-500 py-8">No pending bookings</p>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Companies Tab */}
      {activeTab === 'companies' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Companies</h2>
            <div className="flex gap-4 items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Admin Assignment Mode:</span>
                <button
                  onClick={handleToggleAdminAssignmentMode}
                  className="flex items-center gap-2"
                >
                  {adminAssignmentMode ? (
                    <ToggleRight className="w-8 h-8 text-green-600" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-gray-400" />
                  )}
                </button>
              </div>
              <Button onClick={() => setShowCompanyForm(true)}>Add Company</Button>
            </div>
          </div>

          {showCompanyForm && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                {editingCompany ? 'Edit Company' : 'Add New Company'}
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  placeholder="Company Name"
                  value={companyForm.name}
                  onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                />
                <Input
                  type="email"
                  placeholder="Email"
                  value={companyForm.email}
                  onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                />
                <Input
                  placeholder="Phone"
                  value={companyForm.phone}
                  onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                />
              </div>
              <div className="flex gap-2 mt-4">
                <Button onClick={editingCompany ? () => {
                  handleUpdateCompany(editingCompany._id, companyForm);
                  setEditingCompany(null);
                  setShowCompanyForm(false);
                } : handleCreateCompany}>
                  {editingCompany ? 'Update' : 'Create'}
                </Button>
                <Button variant="outline" onClick={() => {
                  setShowCompanyForm(false);
                  setEditingCompany(null);
                  setCompanyForm({ name: '', email: '', password: '', phone: '' });
                }}>
                  Cancel
                </Button>
              </div>
            </Card>
          )}

          <Card className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Email</th>
                    <th className="text-left p-2">Phone</th>
                    <th className="text-left p-2">Profile</th>
                    <th className="text-left p-2">Verified</th>
                    <th className="text-left p-2">Reg Code</th>
                    <th className="text-left p-2">Order Receiving</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map((company) => (
                    <tr key={company._id} className="border-b hover:bg-gray-50">
                      <td className="p-2">{company.name}</td>
                      <td className="p-2">{company.email}</td>
                      <td className="p-2">{company.phone}</td>
                      <td className="p-2">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            company.profileCompleted ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {company.profileCompleted ? 'Completed' : 'Pending'}
                        </span>
                      </td>
                      <td className="p-2">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            company.isVerified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {company.isVerified ? 'Verified' : 'Not Verified'}
                        </span>
                      </td>
                      <td className="p-2 text-xs text-gray-600">
                        {company.profileCompleted ? '-' : company.registrationCode || '-'}
                      </td>
                      <td className="p-2">
                        <button
                          onClick={() => handleToggleOrderReceiving(company._id)}
                          className="flex items-center gap-2 disabled:opacity-50"
                          disabled={!company.profileCompleted || !company.isVerified}
                        >
                          {company.orderReceivingEnabled ? (
                            <ToggleRight className="w-8 h-8 text-green-600" />
                          ) : (
                            <ToggleLeft className="w-8 h-8 text-gray-400" />
                          )}
                        </button>
                      </td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          company.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {company.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="p-2">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingCompany(company);
                              setCompanyForm({
                                name: company.name,
                                email: company.email,
                                phone: company.phone
                              });
                              setShowCompanyForm(true);
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/admin/companies/${company._id}`)}
                          >
                            Details
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleDeleteCompany(company._id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {companies.length === 0 && (
                <p className="text-center text-gray-500 py-8">No companies found</p>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Verification Tab */}
      {activeTab === 'verification' && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Company Verification & Profile Updates</h2>

          {/* Verification Requests Section */}
          {companyApprovals.filter(a => a.action === 'verify').length > 0 && (
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="w-5 h-5 text-primary-600" />
                <h3 className="text-lg font-semibold">Verification Requests</h3>
                <span className="ml-auto px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                  {companyApprovals.filter(a => a.action === 'verify').length} pending
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Companies that have completed their profile and are awaiting verification
              </p>
              <div className="space-y-4">
                {companyApprovals
                  .filter(approval => approval.action === 'verify')
                  .map((approval) => (
                    <div key={approval._id} className="border rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 space-y-2">
                          <div>
                            <p className="font-semibold text-lg">{approval.companyId.name}</p>
                            <p className="text-sm text-gray-600">{approval.companyId.email}</p>
                            {approval.companyId.phone && (
                              <p className="text-sm text-gray-600">Phone: {approval.companyId.phone}</p>
                            )}
                          </div>
                          <div className="mt-3 space-y-1 text-sm">
                            {approval.companyData.address && (
                              <div>
                                <span className="font-medium text-gray-700">Address: </span>
                                <span className="text-gray-600">{approval.companyData.address}</span>
                              </div>
                            )}
                            {approval.companyData.phone && (
                              <div>
                                <span className="font-medium text-gray-700">Phone: </span>
                                <span className="text-gray-600">{approval.companyData.phone}</span>
                              </div>
                            )}
                            {approval.companyData.companyDescription && (
                              <div>
                                <span className="font-medium text-gray-700">Description: </span>
                                <span className="text-gray-600">{approval.companyData.companyDescription}</span>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            Requested: {new Date(approval.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            size="sm"
                            onClick={() => handleApproveCompany(approval._id, 'approved')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Verify
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleApproveCompany(approval._id, 'rejected')}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </Card>
          )}

          {/* Company Profile Editing Requests Section */}
          {companyApprovals.filter(a => a.action === 'update').length > 0 && (
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileEdit className="w-5 h-5 text-primary-600" />
                <h3 className="text-lg font-semibold">Company Profile Editing Requests</h3>
                <span className="ml-auto px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                  {companyApprovals.filter(a => a.action === 'update').length} pending
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Verified companies requesting to update their profile information
              </p>
              <div className="space-y-4">
                {companyApprovals
                  .filter(approval => approval.action === 'update')
                  .map((approval) => {
                    // Get current company data for comparison
                    const currentCompany = companies.find(c => c._id === approval.companyId._id);
                    return (
                      <div key={approval._id} className="border rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 space-y-3">
                            <div>
                              <p className="font-semibold text-lg">{approval.companyId.name}</p>
                              <p className="text-sm text-gray-600">{approval.companyId.email}</p>
                            </div>
                            <div className="mt-3 space-y-3">
                              <p className="text-sm font-semibold text-gray-700 mb-2">Profile Changes Requested:</p>
                              <div className="grid md:grid-cols-2 gap-4">
                                {approval.oldData ? (
                                  <>
                                    {/* Company Name - Always show */}
                                    <div className={`border-l-4 pl-3 py-2 rounded ${approval.companyData.name !== approval.oldData.name ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'}`}>
                                      <p className="text-xs font-medium text-gray-700 mb-2">Company Name</p>
                                      <div className="space-y-1">
                                        <div className="flex items-start gap-2">
                                          <span className="text-xs font-medium text-gray-500 w-12">Old:</span>
                                          <span className={`text-xs ${approval.companyData.name !== approval.oldData.name ? 'line-through text-gray-400' : 'text-gray-600'}`}>
                                            {approval.oldData.name || 'Not set'}
                                          </span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                          <span className="text-xs font-medium text-gray-500 w-12">New:</span>
                                          <span className={`text-sm font-medium ${approval.companyData.name !== approval.oldData.name ? 'text-blue-700' : 'text-gray-600'}`}>
                                            {approval.companyData.name || 'Not set'}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {/* Phone - Always show */}
                                    <div className={`border-l-4 pl-3 py-2 rounded ${approval.companyData.phone !== approval.oldData.phone ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'}`}>
                                      <p className="text-xs font-medium text-gray-700 mb-2">Phone</p>
                                      <div className="space-y-1">
                                        <div className="flex items-start gap-2">
                                          <span className="text-xs font-medium text-gray-500 w-12">Old:</span>
                                          <span className={`text-xs ${approval.companyData.phone !== approval.oldData.phone ? 'line-through text-gray-400' : 'text-gray-600'}`}>
                                            {approval.oldData.phone || 'Not set'}
                                          </span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                          <span className="text-xs font-medium text-gray-500 w-12">New:</span>
                                          <span className={`text-sm font-medium ${approval.companyData.phone !== approval.oldData.phone ? 'text-blue-700' : 'text-gray-600'}`}>
                                            {approval.companyData.phone || 'Not set'}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {/* Address - Always show */}
                                    <div className={`border-l-4 pl-3 py-2 rounded md:col-span-2 ${approval.companyData.address !== approval.oldData.address ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'}`}>
                                      <p className="text-xs font-medium text-gray-700 mb-2">Address</p>
                                      <div className="space-y-1">
                                        <div className="flex items-start gap-2">
                                          <span className="text-xs font-medium text-gray-500 w-12">Old:</span>
                                          <span className={`text-xs flex-1 ${approval.companyData.address !== approval.oldData.address ? 'line-through text-gray-400' : 'text-gray-600'}`}>
                                            {approval.oldData.address || 'Not set'}
                                          </span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                          <span className="text-xs font-medium text-gray-500 w-12">New:</span>
                                          <span className={`text-sm font-medium flex-1 ${approval.companyData.address !== approval.oldData.address ? 'text-blue-700' : 'text-gray-600'}`}>
                                            {approval.companyData.address || 'Not set'}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {/* Company Description - Always show */}
                                    <div className={`border-l-4 pl-3 py-2 rounded md:col-span-2 ${approval.companyData.companyDescription !== approval.oldData.companyDescription ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'}`}>
                                      <p className="text-xs font-medium text-gray-700 mb-2">Company Description</p>
                                      <div className="space-y-1">
                                        <div className="flex items-start gap-2">
                                          <span className="text-xs font-medium text-gray-500 w-12">Old:</span>
                                          <span className={`text-xs flex-1 whitespace-pre-wrap ${approval.companyData.companyDescription !== approval.oldData.companyDescription ? 'line-through text-gray-400' : 'text-gray-600'}`}>
                                            {approval.oldData.companyDescription || 'Not set'}
                                          </span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                          <span className="text-xs font-medium text-gray-500 w-12">New:</span>
                                          <span className={`text-sm font-medium flex-1 whitespace-pre-wrap ${approval.companyData.companyDescription !== approval.oldData.companyDescription ? 'text-blue-700' : 'text-gray-600'}`}>
                                            {approval.companyData.companyDescription || 'Not set'}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </>
                                ) : (
                                  <div className="md:col-span-2 text-sm text-yellow-600 bg-yellow-50 p-3 rounded border border-yellow-200">
                                    <p className="font-medium mb-2">⚠️ Old data not available</p>
                                    <p className="text-xs text-gray-600 mb-2">Showing requested changes:</p>
                                    <div className="space-y-1 text-xs">
                                      {approval.companyData.name && <p><strong>Name:</strong> {approval.companyData.name}</p>}
                                      {approval.companyData.phone && <p><strong>Phone:</strong> {approval.companyData.phone}</p>}
                                      {approval.companyData.address && <p><strong>Address:</strong> {approval.companyData.address}</p>}
                                      {approval.companyData.companyDescription && <p><strong>Description:</strong> {approval.companyData.companyDescription}</p>}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                              Requested: {new Date(approval.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button
                              size="sm"
                              onClick={() => handleApproveCompany(approval._id, 'approved')}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => handleApproveCompany(approval._id, 'rejected')}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </Card>
          )}

          {/* Empty State */}
          {companyApprovals.length === 0 && (
            <Card className="p-12 text-center">
              <ShieldCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No Pending Requests</h3>
              <p className="text-gray-500">
                All verification and profile update requests have been processed.
              </p>
            </Card>
          )}
        </div>
      )}

      {/* Employees Tab */}
      {activeTab === 'employees' && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Employees</h2>

          {/* Pending Approvals */}
          {approvals.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Pending Approvals</h3>
              <div className="space-y-4">
                {approvals.map((approval) => (
                  <div key={approval._id} className="border rounded p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">
                          {approval.action.charAt(0).toUpperCase() + approval.action.slice(1)} Employee
                        </p>
                        <p className="text-sm text-gray-600">Company: {approval.companyId.name}</p>
                        <p className="text-sm text-gray-600">
                          Employee: {approval.employeeData.name} ({approval.employeeData.email})
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApproveEmployee(approval._id, 'approved')}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleApproveEmployee(approval._id, 'rejected')}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* All Employees */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">All Employees</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Email</th>
                    <th className="text-left p-2">Phone</th>
                    <th className="text-left p-2">Company</th>
                    <th className="text-left p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((employee) => (
                    <tr key={employee._id} className="border-b hover:bg-gray-50">
                      <td className="p-2">{employee.name}</td>
                      <td className="p-2">{employee.email}</td>
                      <td className="p-2">{employee.phone}</td>
                      <td className="p-2">{employee.companyId?.name || '-'}</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          employee.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {employee.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {employees.length === 0 && (
                <p className="text-center text-gray-500 py-8">No employees found</p>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">All Orders</h2>
          
          <Card className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Customer</th>
                    <th className="text-left p-2">Service</th>
                    <th className="text-left p-2">Amount</th>
                    <th className="text-left p-2">Date</th>
                    <th className="text-left p-2">Partner</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => (
                    <tr key={booking._id} className="border-b hover:bg-gray-50">
                      <td className="p-2">
                        <div>
                          <p className="font-medium">{booking.customerId?.name}</p>
                          <p className="text-xs text-gray-500">{booking.customerId?.email}</p>
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
                      </td>
                      <td className="p-2">{booking.assignedToPartner?.name || '-'}</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs ${getStatusColor(booking.status)}`}>
                          {booking.status.replace(/_/g, ' ')}
                        </span>
                        {booking.declinedBy && (
                          <p className="text-xs text-red-600 mt-1">
                            Declined by {booking.declinedBy.name}
                          </p>
                        )}
                      </td>
                      <td className="p-2">
                        {booking.status === 'pending' && (
                          selectedBooking === booking._id ? (
                            <div className="flex gap-2 items-center">
                              <select
                                value={selectedPartner}
                                onChange={(e) => setSelectedPartner(e.target.value)}
                                className="text-sm border rounded px-2 py-1"
                              >
                                <option value="">Select Partner</option>
                                {companies
                                  .filter((c) => c.isActive && c.profileCompleted && c.isVerified)
                                  .map((c) => (
                                    <option key={c._id} value={c._id}>
                                      {c.name}
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
                          )
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {bookings.length === 0 && (
                <p className="text-center text-gray-500 py-8">No orders found</p>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Services Tab */}
      {activeTab === 'services' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Services</h2>
            <Button onClick={() => setShowServiceForm(true)}>Add Service</Button>
          </div>

          {showServiceForm && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Add New Service</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  placeholder="Service Name"
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                />
                <Input
                  placeholder="Category"
                  value={serviceForm.category}
                  onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value })}
                />
                <Input
                  type="number"
                  placeholder="Base Price"
                  value={serviceForm.price}
                  onChange={(e) => setServiceForm({ ...serviceForm, price: parseFloat(e.target.value) || 0 })}
                />
                <Input
                  type="number"
                  placeholder="Duration (hours)"
                  value={serviceForm.duration}
                  onChange={(e) => setServiceForm({ ...serviceForm, duration: parseInt(e.target.value) || 1 })}
                />
                <Input
                  placeholder="Image URL"
                  value={serviceForm.image}
                  onChange={(e) => setServiceForm({ ...serviceForm, image: e.target.value })}
                />
                <Input
                  type="number"
                  placeholder="Per Hour Fee"
                  value={serviceForm.perHourFee}
                  onChange={(e) => setServiceForm({ ...serviceForm, perHourFee: parseFloat(e.target.value) || 0 })}
                />
                <Input
                  type="number"
                  placeholder="Per Person Fee"
                  value={serviceForm.perPersonFee}
                  onChange={(e) => setServiceForm({ ...serviceForm, perPersonFee: parseFloat(e.target.value) || 0 })}
                />
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={serviceForm.hasExtraRequirements}
                    onChange={(e) => setServiceForm({ ...serviceForm, hasExtraRequirements: e.target.checked })}
                  />
                  <label>Has Extra Requirements</label>
                </div>
                <textarea
                  className="col-span-2 border rounded p-2"
                  placeholder="Description"
                  value={serviceForm.description}
                  onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="flex gap-2 mt-4">
                <Button onClick={handleCreateService}>Create</Button>
                <Button variant="outline" onClick={() => {
                  setShowServiceForm(false);
                  setServiceForm({
                    name: '', category: '', price: 0, duration: 1, description: '',
                    image: '', perHourFee: 0, perPersonFee: 0, hasExtraRequirements: false,
                    extraRequirements: []
                  });
                }}>
                  Cancel
                </Button>
              </div>
            </Card>
          )}

          <div className="grid md:grid-cols-3 gap-4">
            {services.map((service) => (
              <Card key={service._id} className="p-4">
                {service.image && (
                  <img src={service.image} alt={service.name} className="w-full h-48 object-cover rounded mb-4" />
                )}
                <h3 className="font-semibold text-lg mb-2">{service.name}</h3>
                <p className="text-sm text-gray-600 mb-2">{service.category}</p>
                <p className="text-sm mb-2">{service.description}</p>
                <div className="text-sm space-y-1">
                  <p>Base Price: ${service.price}</p>
                  {service.perHourFee > 0 && <p>Per Hour: ${service.perHourFee}</p>}
                  {service.perPersonFee > 0 && <p>Per Person: ${service.perPersonFee}</p>}
                  {service.hasExtraRequirements && (
                    <p className="text-primary-600">Has Extra Requirements</p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Commission Tab */}
      {activeTab === 'commission' && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Commission Settings</h2>
          <Card className="p-6">
            <div className="max-w-md">
              <label className="block text-sm font-medium mb-2">
                Commission Rate (0-1)
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={commissionRate}
                onChange={(e) => setCommissionRate(parseFloat(e.target.value) || 0)}
              />
              <p className="text-sm text-gray-600 mt-2">
                Current rate: {(commissionRate * 100).toFixed(1)}%
              </p>
              <Button onClick={handleUpdateCommission} className="mt-4">
                Update Commission Rate
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Expired Orders Tab */}
      {activeTab === 'expired' && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Expired Orders</h2>
          <Card className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Customer</th>
                    <th className="text-left p-2">Service</th>
                    <th className="text-left p-2">Amount</th>
                    <th className="text-left p-2">Scheduled Date</th>
                    <th className="text-left p-2">Expired At</th>
                    <th className="text-left p-2">Payment Method</th>
                    <th className="text-left p-2">Address</th>
                  </tr>
                </thead>
                <tbody>
                  {expiredBookings.map((booking) => (
                    <tr key={booking._id} className="border-b hover:bg-gray-50">
                      <td className="p-2">
                        <div>
                          <p className="font-medium">{booking.customerId?.name}</p>
                          <p className="text-xs text-gray-500">{booking.customerId?.email}</p>
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
                        {new Date(booking.scheduledDate).toLocaleString()}
                      </td>
                      <td className="p-2">
                        {booking.expiredAt ? new Date(booking.expiredAt).toLocaleString() : '-'}
                      </td>
                      <td className="p-2">{booking.paymentMethod === 'cash' ? 'COD' : 'Online'}</td>
                      <td className="p-2">{booking.address}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {expiredBookings.length === 0 && (
                <p className="text-center text-gray-500 py-8">No expired orders</p>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Refunds Tab */}
      {activeTab === 'refunds' && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Refund Requests</h2>
          <Card className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Customer</th>
                    <th className="text-left p-2">Service</th>
                    <th className="text-left p-2">Amount</th>
                    <th className="text-left p-2">Reason</th>
                    <th className="text-left p-2">Payment Method</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Requested</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {refunds.map((refund) => (
                    <tr key={refund._id} className="border-b hover:bg-gray-50">
                      <td className="p-2">
                        <div>
                          <p className="font-medium">{refund.customerId?.name}</p>
                          <p className="text-xs text-gray-500">{refund.customerId?.email}</p>
                        </div>
                      </td>
                      <td className="p-2">{refund.bookingId?.serviceId?.name || 'N/A'}</td>
                      <td className="p-2">${refund.amount.toFixed(2)}</td>
                      <td className="p-2 text-sm">{refund.reason || '-'}</td>
                      <td className="p-2">{refund.paymentMethod === 'cash' ? 'COD' : 'Online'}</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          refund.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          refund.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                          refund.status === 'processed' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {refund.status}
                        </span>
                      </td>
                      <td className="p-2 text-sm">
                        {new Date(refund.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-2">
                        {refund.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => {
                                const transactionId = prompt('Enter transaction ID (optional):');
                                handleProcessRefund(refund._id, 'approved', transactionId || undefined);
                              }}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => handleProcessRefund(refund._id, 'rejected')}
                            >
                              Reject
                            </Button>
                          </div>
                        )}
                        {refund.status === 'approved' && (
                          <Button
                            size="sm"
                            onClick={() => {
                              const transactionId = prompt('Enter transaction ID:');
                              if (transactionId) {
                                handleProcessRefund(refund._id, 'processed', transactionId);
                              }
                            }}
                          >
                            Mark Processed
                          </Button>
                        )}
                        {refund.status === 'processed' && (
                          <span className="text-xs text-gray-500">
                            {refund.transactionId && `ID: ${refund.transactionId}`}
                            {refund.processedBy && ` by ${refund.processedBy.name}`}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {refunds.length === 0 && (
                <p className="text-center text-gray-500 py-8">No refund requests</p>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Performance Tab */}
      {activeTab === 'performance' && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Partner Performance</h2>
          <div className="grid gap-6">
            {performanceData.map((data) => (
              <Card key={data.partner._id} className="p-6">
                <h3 className="text-lg font-semibold mb-4">{data.partner.name}</h3>
                <div className="grid md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Orders Received</p>
                    <p className="text-2xl font-bold">{data.summary?.received || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Orders Accepted</p>
                    <p className="text-2xl font-bold text-blue-600">{data.summary?.accepted || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Orders Completed</p>
                    <p className="text-2xl font-bold text-green-600">{data.summary?.completed || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Orders Declined</p>
                    <p className="text-2xl font-bold text-red-600">{data.summary?.declined || 0}</p>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  <p>Acceptance Rate: {(data.summary?.acceptanceRate || 0).toFixed(1)}%</p>
                  <p>Completion Rate: {(data.summary?.completionRate || 0).toFixed(1)}%</p>
                </div>
                {data.monthlyData && data.monthlyData.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-semibold mb-2">Monthly Breakdown</h4>
                    <div className="space-y-2">
                      {data.monthlyData.map((month) => (
                        <div key={month.month} className="flex justify-between text-sm">
                          <span>{month.month}</span>
                          <span>Received: {month.received} | Accepted: {month.accepted} | Completed: {month.completed}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
