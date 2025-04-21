import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthModal from './AuthModal';
import { ArrowRight, Calendar, Activity, Shield, Users, CreditCard, MessageSquare, FileText } from 'lucide-react';
// Add this import at the top of your file
import doctorPatientImg from './assets/doctor-patient.png';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  const openLogin = () => {
    setAuthMode('signin');
    setIsAuthModalOpen(true);
  };

  const openRegister = () => {
    setAuthMode('signup');
    setIsAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-40 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl"></div>
        </div>

        {/* Navigation */}
        <nav className="relative z-10 container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Activity className="h-8 w-8 text-blue-500" />
            <span className="text-2xl font-bold text-white">Smart Healthcare</span>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-white/70 hover:text-white transition-colors">Features</a>
            <a href="#testimonials" className="text-white/70 hover:text-white transition-colors">Testimonials</a>
            <a href="#faq" className="text-white/70 hover:text-white transition-colors">FAQ</a>
            <button
              onClick={openLogin}
              className="px-4 py-2 text-white hover:text-blue-100 transition-colors"
            >
              Login
            </button>
            <button
              onClick={openRegister}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Sign Up
            </button>
          </div>
          <div className="md:hidden">
            <button
              onClick={openLogin}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Login
            </button>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-6 pt-20 pb-24 md:pt-32 md:pb-40">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
                Modern Healthcare <span className="text-blue-500">Simplified</span> For Everyone
              </h1>
              <p className="text-xl text-white/70 max-w-lg">
                Schedule appointments, access medical records, communicate with healthcare providers, and manage payments securely in one place.
              </p>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <button
                  onClick={openRegister}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-lg flex items-center justify-center"
                >
                  Get Started <ArrowRight className="ml-2 h-5 w-5" />
                </button>
                <button
                  onClick={() => navigate('/about')}
                  className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-lg"
                >
                  Learn More
                </button>
              </div>
            </div>
            <div className="hidden md:block relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl transform rotate-3"></div>
              <img
                src={doctorPatientImg}
                alt="Doctor with patient"
                className="relative z-10 rounded-2xl shadow-2xl max-w-full mx-auto transform -rotate-3 transition-transform hover:rotate-0 duration-500"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section id="features" className="bg-slate-900/80 py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Powerful Features</h2>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              Our comprehensive platform provides everything you need for modern healthcare management.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Calendar className="h-10 w-10 text-blue-500" />,
                title: 'Appointment Scheduling',
                description: 'Book and manage appointments with doctors easily with real-time availability.'
              },
              {
                icon: <FileText className="h-10 w-10 text-blue-500" />,
                title: 'Medical Records',
                description: 'Access and share your medical history securely with healthcare providers.'
              },
              {
                icon: <MessageSquare className="h-10 w-10 text-blue-500" />,
                title: 'Secure Messaging',
                description: 'Communicate directly with your healthcare providers securely and efficiently.'
              },
              {
                icon: <CreditCard className="h-10 w-10 text-blue-500" />,
                title: 'Online Payments',
                description: 'Pay medical bills online and manage all your healthcare expenses in one place.'
              },
              {
                icon: <Shield className="h-10 w-10 text-green-500" />,
                title: 'HIPAA Compliant',
                description: 'Your data is always secure and protected with advanced encryption.'
              },
              {
                icon: <Users className="h-10 w-10 text-green-500" />,
                title: 'Doctor Verification',
                description: 'All healthcare providers are verified to ensure quality care.'
              },
              {
                icon: <Activity className="h-10 w-10 text-green-500" />,
                title: 'Health Monitoring',
                description: 'Track your health metrics and share them with your providers.'
              },
              {
                icon: <FileText className="h-10 w-10 text-green-500" />,
                title: 'Prescription Management',
                description: 'View and manage your prescriptions and medication schedule.'
              }
            ].map((feature, index) => (
              <div key={index} className="bg-white/5 rounded-xl p-6 hover:bg-white/10 transition-colors">
                <div className="p-4 rounded-full bg-slate-800 inline-block mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-white/70">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-slate-800/50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">What Our Users Say</h2>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              Hear from patients and doctors who use our platform every day.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                content: "I've been able to manage my appointments and medications much more efficiently. The secure messaging with my doctor has been a game-changer.",
                author: "Sarah Johnson",
                role: "Patient"
              },
              {
                content: "As a busy doctor, this platform has streamlined my workflow significantly. I can easily view patient records and communicate securely.",
                author: "Dr. Michael Chen",
                role: "Cardiologist"
              },
              {
                content: "The appointment scheduling and payment system is so intuitive. I've never had to call the office to reschedule again!",
                author: "Robert Williams",
                role: "Patient"
              }
            ].map((testimonial, index) => (
              <div key={index} className="bg-white/5 rounded-xl p-8 relative">
                <div className="absolute top-0 left-0 transform -translate-y-1/2 translate-x-4">
                  <div className="bg-blue-500 rounded-full p-2">
                    <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14.017 18L14.017 10.609C14.017 4.905 17.748 1.039 23 0L23.995 2.151C21.563 3.068 20 5.789 20 8H24V18H14.017ZM0 18V10.609C0 4.905 3.748 1.038 9 0L9.996 2.151C7.563 3.068 6 5.789 6 8H9.983L9.983 18L0 18Z" />
                    </svg>
                  </div>
                </div>
                <p className="text-white/80 text-lg mb-6 pt-4">{testimonial.content}</p>
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500 font-bold">
                    {testimonial.author.charAt(0)}
                  </div>
                  <div className="ml-3">
                    <h4 className="font-medium text-white">{testimonial.author}</h4>
                    <p className="text-white/60 text-sm">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-slate-900">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              Find answers to common questions about our platform.
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            {[
              {
                question: "How do I schedule an appointment?",
                answer: "After creating an account, you can browse available doctors, view their schedules, and book appointments directly through the platform. You'll receive confirmation immediately."
              },
              {
                question: "Is my medical information secure?",
                answer: "Yes, we take security very seriously. All data is encrypted and our platform is fully HIPAA compliant to ensure your medical information remains private and secure."
              },
              {
                question: "How do payments work?",
                answer: "You can pay for services securely through our platform using credit/debit cards or other payment methods. We generate invoices automatically for your records."
              },
              {
                question: "Can doctors join the platform?",
                answer: "Yes, healthcare providers can apply to join our platform. We have a thorough verification process to ensure all providers are properly licensed and credentialed."
              }
            ].map((faq, index) => (
              <div key={index} className="mb-6 bg-white/5 rounded-xl p-6 hover:bg-white/10 transition-colors">
                <h3 className="text-xl font-semibold text-white mb-3">{faq.question}</h3>
                <p className="text-white/70">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to transform your healthcare experience?
          </h2>
          <p className="text-xl text-white/80 max-w-2xl mx-auto mb-8">
            Join thousands of patients and doctors who are already benefiting from our platform.
          </p>
          <button
            onClick={openRegister}
            className="px-8 py-3 bg-white text-blue-700 hover:bg-blue-50 rounded-lg transition-colors text-lg font-medium"
          >
            Get Started Today
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 py-12">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <Activity className="h-8 w-8 text-blue-500" />
                <span className="text-2xl font-bold text-white">Smart Healthcare</span>
              </div>
              <p className="text-white/60 max-w-md">
                Smart Healthcare is a comprehensive platform designed to streamline healthcare management for both patients and providers.
              </p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><a href="#features" className="text-white/60 hover:text-white transition-colors">Features</a></li>
                <li><a href="#testimonials" className="text-white/60 hover:text-white transition-colors">Testimonials</a></li>
                <li><a href="#faq" className="text-white/60 hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><a href="/privacy" className="text-white/60 hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="/terms" className="text-white/60 hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="/hipaa" className="text-white/60 hover:text-white transition-colors">HIPAA Compliance</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 mt-12 pt-8 text-center text-white/60">
            <p>© {new Date().getFullYear()} Smart Healthcare. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authMode}
      />
    </div>
  );
};

export default LandingPage;
