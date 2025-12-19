import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Users, Building2, Phone, MapPin } from 'lucide-react';

interface Company {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  companyDescription?: string;
  isActive: boolean;
  profileCompleted: boolean;
  isVerified: boolean;
  orderReceivingEnabled: boolean;
}

interface Employee {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: string;
}

interface CompanyDetailsResponse {
  company: Company;
  employees: Employee[];
}

export default function AdminCompanyDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<CompanyDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDetails = async () => {
      try {
        const response = await api.get(`/companies/${id}/details`);
        setData(response.data);
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to load company details');
        navigate('/admin');
      } finally {
        setLoading(false);
      }
    };
    if (id) {
      loadDetails();
    }
  }, [id, navigate]);

  if (loading || !data) {
    return (
      <DashboardLayout title="Admin">
        <div className="flex items-center justify-center min-h-[300px]">
          <p className="text-gray-600">Loading company details...</p>
        </div>
      </DashboardLayout>
    );
  }

  const { company, employees } = data;

  return (
    <DashboardLayout title="Admin">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            onClick={() => navigate('/admin')}
            className="mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Companies
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">{company.name}</h1>
          <p className="text-gray-600">Company Details</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Company Info */}
        <Card className="p-6 lg:col-span-2">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Company Profile
          </h2>
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-gray-600">Email:</span>{' '}
              <span className="font-medium">{company.email}</span>
            </div>
            {company.phone && (
              <div className="flex items-center gap-1">
                <Phone className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600 mr-1">Phone:</span>
                <span className="font-medium">{company.phone}</span>
              </div>
            )}
            {company.address && (
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600 mr-1">Address:</span>
                <span className="font-medium">{company.address}</span>
              </div>
            )}
            {company.companyDescription && (
              <div>
                <p className="text-gray-600 mb-1">About:</p>
                <p className="text-gray-800 whitespace-pre-line">
                  {company.companyDescription}
                </p>
              </div>
            )}
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span
              className={`px-2 py-1 rounded ${
                company.profileCompleted
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              Profile: {company.profileCompleted ? 'Completed' : 'Pending'}
            </span>
            <span
              className={`px-2 py-1 rounded ${
                company.isVerified
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              Verified: {company.isVerified ? 'Yes' : 'No'}
            </span>
            <span
              className={`px-2 py-1 rounded ${
                company.orderReceivingEnabled
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              Direct Orders: {company.orderReceivingEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        </Card>

        {/* Employees */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Employees ({employees.length})
          </h2>
          {employees.length === 0 ? (
            <p className="text-sm text-gray-500">No employees found for this company.</p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {employees.map((emp) => (
                <div key={emp._id} className="border rounded p-2 bg-gray-50">
                  <p className="font-medium text-sm">{emp.name}</p>
                  <p className="text-xs text-gray-600">{emp.email}</p>
                  {emp.phone && (
                    <p className="text-xs text-gray-600">Phone: {emp.phone}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}



