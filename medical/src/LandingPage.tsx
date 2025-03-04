import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield,
  Calendar,
  FileText,
  User,
  CreditCard,
  Bell,
  Clock,
  Check,
  LucideIcon,
  Linkedin,
  Facebook,
  Twitter
} from "lucide-react";
import AuthModal from './AuthModal';

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  checks?: string[];
  bgColor: string;
  textColor: string;
  colSpan: string;
  subFeatures?: {
    icon: LucideIcon;
    title: string;
  }[];
}

interface FeatureCardProps {
  feature: Feature;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ feature }) => {
  const Icon = feature.icon;

  return (
    <div
      className={`col-span-12 ${feature.colSpan} ${feature.bgColor} rounded-2xl p-8`}
    >
      <Icon className="w-12 h-12 mb-6" />
      <h2 className="text-2xl font-semibold mb-4">{feature.title}</h2>
      <p className={`${feature.textColor} text-lg mb-8`}>
        {feature.description}
      </p>
      {feature.subFeatures ? (
        <div className="grid grid-cols-2 gap-4">
          {feature.subFeatures.map((sub, index) => (
            <div key={index} className="bg-white/10 rounded-xl p-4">
              <sub.icon className="w-6 h-6 mb-2" />
              <h3 className="font-medium">{sub.title}</h3>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {feature.checks?.map((check, index) => (
            <div key={index} className="flex items-center text-white">
              <Check className="w-5 h-5 mr-2" />
              <span>{check}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  // Simplified navigation function for development
  const handleQuickAccess = () => {
    navigate("/p/dashboard");
  };

  const openAuth = (mode: 'signin' | 'signup'): void => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  const features: Feature[] = [
    {
      icon: Calendar,
      title: "Smart Appointment Management",
      description:
        "Schedule, reschedule, or cancel appointments with real-time doctor availability. Receive automated reminders and instant confirmations.",
      bgColor: "bg-[#2563EB]",
      textColor: "text-blue-100",
      colSpan: "lg:col-span-8",
      subFeatures: [
        { icon: Clock, title: "Real-time Scheduling" },
        { icon: Bell, title: "Smart Reminders" },
      ],
    },
    {
      icon: FileText,
      title: "Digital Medical Records",
      description:
        "Secure access to your complete medical history, test results, and digital prescriptions.",
      bgColor: "bg-[#9333EA]",
      textColor: "text-purple-100",
      colSpan: "lg:col-span-4",
      checks: ["Complete History Access", "Digital Prescriptions"],
    },
    {
      icon: User,
      title: "Doctor's Portal",
      description:
        "Comprehensive tools for healthcare professionals to manage patients and schedules.",
      bgColor: "bg-[#059669]",
      textColor: "text-emerald-100",
      colSpan: "md:col-span-6 lg:col-span-6",
      checks: ["Patient Management", "Schedule Control"],
    },
    {
      icon: CreditCard,
      title: "Secure Payments",
      description:
        "Integrated payment processing, insurance claims, and digital invoicing.",
      bgColor: "bg-[#DB2777]",
      textColor: "text-pink-100",
      colSpan: "md:col-span-6 lg:col-span-6",
      checks: ["Online Payments", "Insurance Integration"],
    },
  ];

  return (
    <div className="min-h-screen bg-[#0A0F1C] text-white">
      {/* Navigation */}
      <nav className="fixed w-full z-50 border-b border-white/10 bg-[#0A0F1C]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <div className="text-blue-500 text-2xl">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect
                  x="3"
                  y="3"
                  width="18"
                  height="18"
                  rx="2"
                  className="fill-current"
                />
                <path
                  d="M7 12h10M12 7v10"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <span className="ml-2 text-xl font-semibold">SmartCare</span>
          </div>

          <div className="flex items-center space-x-6">
            <a
              href="#appointments"
              className="text-sm hover:text-blue-400 flex items-center"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Appointments
            </a>
            <a
              href="#records"
              className="text-sm hover:text-blue-400 flex items-center"
            >
              <FileText className="w-4 h-4 mr-2" />
              Medical Records
            </a>
            <a
              href="#doctors"
              className="text-sm hover:text-blue-400 flex items-center"
            >
              <User className="w-4 h-4 mr-2" />
              Find Doctors
            </a>

            {/* Updated Auth Buttons */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => openAuth('signin')}
                className="px-4 py-2 text-sm hover:text-blue-400 transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => openAuth('signup')}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm transition-colors"
              >
                Register
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center bg-white/5 rounded-full px-4 py-2 mb-8 border border-white/10">
            <Shield className="w-4 h-4 text-blue-400 mr-2" />
            <span className="text-sm">HIPAA Compliant & Secure</span>
          </div>
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 text-transparent bg-clip-text">
            Smart Healthcare Management Made Simple
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-12">
            A comprehensive platform for patients, doctors, and healthcare
            providers. Schedule appointments, manage records, and streamline
            your healthcare experience.
          </p>
          <div className="flex justify-center">
            <button
              onClick={() => navigate('/find-doctors')}
              className="px-8 py-4 bg-blue-500 rounded-lg text-lg font-medium hover:bg-blue-600 transition-colors flex items-center"
            >
              <User className="w-5 h-5 mr-2" />
              Find Doctors
            </button>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="px-6 py-12">
        <div className="max-w-7xl mx-auto grid grid-cols-12 gap-6">
          {features.map((feature, index) => (
            <FeatureCard key={index} feature={feature} />
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="px-6 pb-20">
        <div className="max-w-7xl mx-auto bg-blue-500 rounded-2xl p-12 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Transform Your Healthcare Management?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of healthcare professionals and patients who trust
            SmartCare for their healthcare management needs.
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={handleQuickAccess}
              className="px-8 py-4 bg-white text-blue-600 rounded-lg text-lg font-medium hover:bg-gray-100 transition-colors"
            >
              Quick Access
            </button>
            <button className="px-8 py-4 bg-white/20 rounded-lg text-lg font-medium hover:bg-white/30 transition-colors">
              Contact Us
            </button>
          </div>
        </div> 
      </div>

      {/* Footer Section */}
      <footer className="border-t border-white/10 bg-[#0A0F1C]">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Logo and Description */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-4">
                <div className="text-blue-500 text-2xl">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="3" width="18" height="18" rx="2" className="fill-current"/>
                    <path d="M7 12h10M12 7v10" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                <span className="ml-2 text-xl font-semibold">SmartCare</span>
              </div>
              <p className="text-gray-400 mb-6">
                Transforming healthcare management with innovative digital solutions.
              </p>
              {/* Social Media Icons */}
              <div className="flex space-x-4">
                <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-blue-500 hover:text-white transition-all">
                  <Linkedin className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-blue-500 hover:text-white transition-all">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-blue-500 hover:text-white transition-all">
                  <Twitter className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-sm font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-3">
                <li><a href="#appointments" className="text-gray-400 hover:text-blue-400">Appointments</a></li>
                <li><a href="#doctors" className="text-gray-400 hover:text-blue-400">Find Doctors</a></li>
                <li><a href="#records" className="text-gray-400 hover:text-blue-400">Medical Records</a></li>
                <li><a href="#payments" className="text-gray-400 hover:text-blue-400">Payments</a></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-sm font-semibold mb-4">Contact</h3>
              <ul className="space-y-3">
                <li className="text-gray-400">support@smartcare.com</li>
                <li className="text-gray-400">+1 (555) 123-4567</li>
                <li className="text-gray-400">One Pace Plazaa</li>
                <li className="text-gray-400">Pace University, New York</li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-white/10 mt-12 pt-8 text-center text-gray-400 text-sm">
            <p>© 2025 SmartCare. All rights reserved.</p>
          </div>
        </div>
      </footer>
      <AuthModal 
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        initialMode={authMode}
      />
    </div>
  );
};

export default LandingPage;
