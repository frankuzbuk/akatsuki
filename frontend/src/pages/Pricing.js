import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createCheckout, getPaymentStatus } from '../lib/api';
import { Check, Zap, Crown, Loader } from 'lucide-react';
import PageWrapper from '../components/PageWrapper';

const PACKAGES = [
  {
    id: 'monthly',
    name: 'Monthly Premium',
    price: 9.99,
    period: 'month',
    features: ['Ad-free streaming', 'HD video quality', 'Watch on any device', 'Download episodes', 'New releases first', 'Cancel anytime'],
    icon: Zap,
    color: 'from-blue-500 to-purple-500'
  },
  {
    id: 'yearly',
    name: 'Yearly Premium',
    price: 99.99,
    period: 'year',
    savings: 'Save 16%',
    features: ['Everything in Monthly', '4K Ultra HD video quality', 'Exclusive content', 'Priority support', 'Early access to events', 'Cancel anytime'],
    icon: Crown,
    color: 'from-orange-500 to-red-500',
    popular: true
  }
];

const Pricing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [paymentChecking, setPaymentChecking] = useState(false);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (sessionId && user) {
      pollPaymentStatus(sessionId);
    }
  }, [searchParams, user]);

  const pollPaymentStatus = async (sessionId, attempts = 0) => {
    if (attempts >= 10) {
      setError('Payment status check timed out');
      setPaymentChecking(false);
      return;
    }
    setPaymentChecking(true);
    try {
      const data = await getPaymentStatus(sessionId);
      if (data.payment_status === 'paid') {
        alert('Payment successful! You are now a Premium member!');
        navigate('/profile');
        return;
      } else if (data.status === 'expired') {
        setError('Payment session expired');
        setPaymentChecking(false);
        return;
      }
      setTimeout(() => pollPaymentStatus(sessionId, attempts + 1), 2000);
    } catch (error) {
      console.error('Payment status error:', error);
      setError('Failed to check payment status');
      setPaymentChecking(false);
    }
  };

  const handleSubscribe = async (packageId) => {
    if (!user) {
      navigate('/login');
      return;
    }
    setProcessing(true);
    setError('');
    try {
      const data = await createCheckout(packageId);
      window.location.href = data.url;
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to create checkout');
      setProcessing(false);
    }
  };

  if (paymentChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader className="animate-spin h-16 w-16 text-orange-500 mx-auto" />
          <p className="text-xl mt-4">Checking payment status...</p>
        </div>
      </div>
    );
  }

  return (
    <PageWrapper pageName="pricing">
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">Choose Your Plan</h1>
          <p className="text-xl text-gray-400">Unlock unlimited anime streaming with a Premium subscription</p>
        </div>
        {error && (
          <div className="max-w-2xl mx-auto mb-8 bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg">{error}</div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {PACKAGES.map((pkg) => {
            const Icon = pkg.icon;
            return (
              <div key={pkg.id} className={`relative bg-gray-800/50 backdrop-blur rounded-2xl p-8 border ${pkg.popular ? 'border-orange-500 ring-2 ring-orange-500' : 'border-gray-700'}`} data-testid={`package-${pkg.id}`}>
                {pkg.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-1 rounded-full text-sm font-semibold">Most Popular</span>
                  </div>
                )}
                <div className={`inline-flex p-3 rounded-lg bg-gradient-to-r ${pkg.color} mb-6`}>
                  <Icon className="h-8 w-8" />
                </div>
                <h2 className="text-2xl font-bold mb-2">{pkg.name}</h2>
                {pkg.savings && <p className="text-green-500 font-semibold mb-4">{pkg.savings}</p>}
                <div className="mb-8">
                  <span className="text-5xl font-bold">${pkg.price}</span>
                  <span className="text-gray-400">/{pkg.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {pkg.features.map((feature, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button onClick={() => handleSubscribe(pkg.id)} disabled={processing || (user && user.is_premium)} className={`w-full py-3 rounded-lg font-semibold transition ${pkg.popular ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600' : 'bg-gray-700 hover:bg-gray-600'} disabled:opacity-50 disabled:cursor-not-allowed`} data-testid={`subscribe-${pkg.id}`}>
                  {processing ? 'Processing...' : user && user.is_premium ? 'Already Premium' : 'Subscribe Now'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
    </PageWrapper>
  );
};

export default Pricing;
