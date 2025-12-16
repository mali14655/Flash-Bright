import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Shield, Clock, Star, ArrowRight } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import api from '../lib/api';
import toast from 'react-hot-toast';

interface Service {
  _id: string;
  name: string;
  category: string;
  price: number;
  duration: number;
  description: string;
}

export default function Landing() {
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const response = await api.get('/services');
      setServices(response.data);
    } catch (error) {
      console.error('Failed to load services');
    }
  };

  const handleServiceClick = (serviceId: string) => {
    navigate(`/service/${serviceId}`);
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-primary-600">HomeService Pro</div>
          <div className="flex gap-4">
            <Link to="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link to="/register">
              <Button>Sign Up</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Professional Home Services
          <br />
          <span className="text-primary-600">At Your Doorstep</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Connect with trusted service providers for all your home cleaning and maintenance needs.
          Book, track, and manage services effortlessly.
        </p>
        <div className="flex gap-4 justify-center">
          <Link to="/register">
            <Button size="lg">Get Started</Button>
          </Link>
          <Link to="/login">
            <Button size="lg" variant="outline">
              Sign In
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Why Choose Us?</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Wide Range of Services</h3>
            <p className="text-gray-600">From deep cleaning to specialized maintenance</p>
          </div>
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Verified Professionals</h3>
            <p className="text-gray-600">All service providers are background checked</p>
          </div>
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Flexible Scheduling</h3>
            <p className="text-gray-600">Book services at your convenience</p>
          </div>
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="w-8 h-8 text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Quality Guaranteed</h3>
            <p className="text-gray-600">100% satisfaction or money back</p>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Our Services</h2>
          <p className="text-center text-gray-600 mb-12">Browse and book services directly</p>
          {services.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {services.map((service) => (
                <Card
                  key={service._id}
                  className="p-6 hover:shadow-lg transition-shadow cursor-pointer group"
                  onClick={() => handleServiceClick(service._id)}
                >
                  <h3 className="text-xl font-semibold mb-2 group-hover:text-primary-600 transition-colors">
                    {service.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">{service.category}</p>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-2xl font-bold text-primary-600">${service.price}</p>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="w-4 h-4 mr-1" />
                      {service.duration} hrs
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full group-hover:bg-primary-600 group-hover:text-white transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleServiceClick(service._id);
                    }}
                  >
                    View Details & Book
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500">Loading services...</p>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-20">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">© 2024 HomeService Pro. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

