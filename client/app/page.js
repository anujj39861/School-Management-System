"use client"
import { useState, useEffect } from 'react';
import { DollarSign, Shield, Download, Star, Users, TrendingUp, CheckCircle, ArrowRight, BookOpen, Globe, Award, GraduationCap } from 'lucide-react';
import HomeNavbar from './components/HomeNavbar';

const FeatureCard = ({ icon: Icon, title, desc, delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div className={`group relative bg-stone-800 rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-stone-700 ${
      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
    }`}>
      <div className="relative">
        <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center mb-6 group-hover:bg-orange-500/30 transition-colors duration-300">
          <Icon className="w-6 h-6 text-orange-400" />
        </div>
        <h3 className="text-xl font-semibold mb-3 text-white">{title}</h3>
        <p className="text-gray-300 leading-relaxed">{desc}</p>
        
        <div className="mt-4 flex items-center text-orange-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className="text-sm font-medium mr-2">Learn more</span>
          <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ number, label, delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div className={`text-center transition-all duration-500 p-6 bg-stone-800/50 backdrop-blur-sm rounded-lg border border-stone-700/50 ${
      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
    }`}>
      <div className="text-3xl md:text-4xl font-bold text-white mb-2">
        {number}
      </div>
      <div className="text-gray-300 text-sm md:text-base font-medium">{label}</div>
    </div>
  );
};

const TestimonialCard = ({ name, role, content, rating = 5 }) => {
  return (
    <div className="bg-stone-800 rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-stone-700">
      <div className="flex items-center mb-4">
        {[...Array(rating)].map((_, i) => (
          <Star key={i} className="w-5 h-5 text-amber-400 fill-current" />
        ))}
      </div>
      <p className="text-gray-300 leading-relaxed mb-6 italic">"{content}"</p>
      <div className="border-t border-stone-700 pt-4">
        <div className="font-semibold text-white">{name}</div>
        <div className="text-orange-400 text-sm">{role}</div>
      </div>
    </div>
  );
};

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <>
    <HomeNavbar/>
    <main className="min-h-screen w-full bg-stone-950 text-white">
      {/* Hero Section */}
      <section className="relative w-full pt-32 pb-20 px-6 md:px-20 bg-neutral-900 text-white text-center">
        <div className={`relative max-w-6xl mx-auto transition-all duration-1000 ${
          isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <div className="inline-flex items-center gap-2 bg-stone-700/50 backdrop-blur-sm px-4 py-2 rounded-full border border-stone-600/50 mb-8">
            <GraduationCap className="w-4 h-4 text-gray-300" />
            <span className="text-sm font-medium text-gray-300">Trusted by 1,000+ schools nationwide</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Welcome to{' '}
            <span className="text-orange-400">
              SchoolFlow
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-3xl mx-auto leading-relaxed">
            A comprehensive school management system designed to streamline administration, 
            manage students effectively, track attendance, handle fees, and support educational excellence.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a
              href="/admin/dashboard"
              className="group bg-orange-600 hover:bg-orange-500 text-white font-semibold px-8 py-3 rounded-lg text-base shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 flex items-center gap-2"
            >
              Admin Portal
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-300" />
            </a>
            <a
              href="/student/dashboard"
              className="group bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-8 py-3 rounded-lg text-base shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 flex items-center gap-2"
            >
              Student Portal
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-300" />
            </a>
            <a
              href="/teacher/dashboard"
              className="group bg-amber-600 hover:bg-amber-500 text-white font-semibold px-8 py-3 rounded-lg text-base shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 flex items-center gap-2"
            >
              Teacher Portal
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-300" />
            </a>
          </div>
        </div>

        {/* Stats Section */}
        <div className="relative mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-5xl mx-auto px-4">
          <StatCard number="1,000+" label="Schools Served" delay={200} />
          <StatCard number="50,000+" label="Students Managed" delay={400} />
          <StatCard number="5,000+" label="Teachers Connected" delay={600} />
          <StatCard number="99%" label="User Satisfaction" delay={800} />
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-16 px-6 md:px-20 bg-emerald-950">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-orange-500/20 text-orange-400 px-4 py-2 rounded-full text-sm font-medium mb-6 border border-orange-500/30">
              <BookOpen className="w-4 h-4" />
              Comprehensive Features
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              Complete School{' '}
              <span className="text-orange-400">
                Management Solution
              </span>
            </h2>
            <p className="text-lg text-gray-300 max-w-3xl mx-auto">
              Streamline your school operations with our integrated platform that handles 
              student management, attendance tracking, fee collection, and academic analytics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <FeatureCard
              icon={Users}
              title="Student Management"
              desc="Comprehensive student profiles, enrollment tracking, academic records, and parent communication tools in one place."
              delay={0}
            />
            <FeatureCard
              icon={CheckCircle}
              title="Attendance Tracking"
              desc="Digital attendance system with real-time monitoring, automated reports, and parent notifications."
              delay={200}
            />
            <FeatureCard
              icon={DollarSign}
              title="Fee Management"
              desc="Simplified fee collection with online payments, automated reminders, digital receipts, and financial reporting."
              delay={400}
            />
          </div>

          {/* Additional Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FeatureCard
              icon={TrendingUp}
              title="Academic Analytics"
              desc="Data-driven insights into student performance, attendance patterns, and institutional metrics to guide decisions."
              delay={600}
            />
            <FeatureCard
              icon={Shield}
              title="Secure Access Control"
              desc="Role-based permissions with separate admin, teacher, and student portals, ensuring data security and privacy."
              delay={800}
            />
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="relative py-16 px-6 md:px-20 bg-stone-950">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              Trusted by Educational Leaders
            </h2>
            <p className="text-lg text-gray-300">
              See how schools are improving their operations with SchoolFlow
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <TestimonialCard
              name="Dr. Sarah Johnson"
              role="Principal, Sunrise Academy"
              content="SchoolFlow has significantly improved our administrative efficiency. The student enrollment and fee collection processes are now much more streamlined."
            />
            <TestimonialCard
              name="Michael Chen"
              role="Academic Director, Elite High School"
              content="The attendance tracking system is excellent. Parents appreciate the real-time updates, and we've noticed better engagement overall."
            />
            <TestimonialCard
              name="Emma Rodriguez"
              role="Administrator, Green Valley School"
              content="The user interface is intuitive and easy to navigate. Both our staff and parents have adapted to the system quickly and appreciate its simplicity."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-16 px-6 md:px-20 bg-neutral-900 text-white text-center">
        <div className="relative max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-lg mb-10 text-gray-300">
            Join hundreds of schools who have simplified their administration with SchoolFlow.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/admin/dashboard"
              className="bg-orange-600 hover:bg-orange-500 text-white font-semibold px-8 py-3 rounded-lg text-base shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
            >
              Admin Portal
            </a>
            <a
              href="/student/dashboard"
              className="bg-stone-700 text-white hover:bg-stone-600 font-semibold px-8 py-3 rounded-lg text-base shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
            >
              Student Portal
            </a>
            <a
              href="/teacher/dashboard"
              className="bg-amber-600 hover:bg-amber-500 text-white font-semibold px-8 py-3 rounded-lg text-base shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
            >
              Teacher Portal
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative text-center py-12 text-gray-400 bg-stone-950 border-t border-stone-800">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">SchoolFlow</span>
          </div>
          <p className="text-sm">
            © {new Date().getFullYear()} SchoolFlow. Designed for educational excellence.
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Helping schools manage their operations more effectively.
          </p>
        </div>
      </footer>
    </main>
</>
    
  );
}