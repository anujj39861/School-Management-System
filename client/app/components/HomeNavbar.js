"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, X, GraduationCap, Shield, Users, BookOpen } from 'lucide-react';
import { useNavigationLoader } from '../context/NavigationContext';

export default function HomeNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);
  const [studentLoggedIn, setStudentLoggedIn] = useState(false);
  const [teacherLoggedIn, setTeacherLoggedIn] = useState(false);
  const router = useRouter();
  const { startNavigation } = useNavigationLoader();

  const toggleMenu = () => setMenuOpen(!menuOpen);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check admin token
    const adminToken = localStorage.getItem("token");
    if (adminToken) {
      setAdminLoggedIn(true);
    }

    // Check student token
    const studentToken = localStorage.getItem("student_token");
    if (studentToken) {
      setStudentLoggedIn(true);
    }

    // Check teacher token
    const teacherToken = localStorage.getItem("teacher_token");
    if (teacherToken) {
      setTeacherLoggedIn(true);
    }
  }, []);

  const handleAdminPortal = () => {
    if (adminLoggedIn) {
      startNavigation("/admin/dashboard");
    } else {
      startNavigation("/login");
    }
    setMenuOpen(false);
  };

  const handleStudentPortal = () => {
    if (studentLoggedIn) {
      startNavigation("/student/dashboard");
    } else {
      startNavigation("/student/login");
    }
    setMenuOpen(false);
  };

  const handleTeacherPortal = () => {
    if (teacherLoggedIn) {
      startNavigation("/teacher/dashboard");
    } else {
      startNavigation("/teacher/login");
    }
    setMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-stone-900/95 backdrop-blur-md border-b border-stone-700/50 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="p-2 bg-orange-600 rounded-lg group-hover:scale-105 transition-transform duration-300 shadow-lg shadow-orange-500/20">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-orange-400">
              SchoolFlow
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Admin Portal Button */}
            <button
              onClick={handleAdminPortal}
              className="flex items-center space-x-2 px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors duration-200 font-medium shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transform hover:-translate-y-0.5 ring-1 ring-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-orange-400 focus-visible:ring-offset-stone-900"
            >
              <Shield className="w-4 h-4" />
              <span>{adminLoggedIn ? 'Admin Dashboard' : 'Admin Portal'}</span>
            </button>

            {/* Teacher Portal Button */}
            <button
              onClick={handleTeacherPortal}
              className="flex items-center space-x-2 px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors duration-200 font-medium shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 transform hover:-translate-y-0.5 ring-1 ring-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-amber-400 focus-visible:ring-offset-stone-900"
            >
              <BookOpen className="w-4 h-4" />
              <span>{teacherLoggedIn ? 'Teacher Dashboard' : 'Teacher Portal'}</span>
            </button>

            {/* Student Portal Button */}
            <button
              onClick={handleStudentPortal}
              className="flex items-center space-x-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors duration-200 font-medium shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transform hover:-translate-y-0.5 ring-1 ring-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-stone-900"
            >
              <Users className="w-4 h-4" />
              <span>{studentLoggedIn ? 'Student Dashboard' : 'Student Portal'}</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="p-2 text-gray-400 hover:text-white hover:bg-stone-700 rounded-lg transition-colors duration-200"
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-stone-700 py-4 animate-in slide-in-from-top-2 duration-200">
            <div className="space-y-3">
              {/* Admin Portal Mobile */}
              <button
                onClick={handleAdminPortal}
                className="flex items-center space-x-3 w-full px-4 py-3 text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors duration-200 font-medium shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 ring-1 ring-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-orange-400 focus-visible:ring-offset-stone-900"
              >
                <Shield className="w-5 h-5" />
                <span>{adminLoggedIn ? 'Admin Dashboard' : 'Admin Portal'}</span>
              </button>

              {/* Teacher Portal Mobile */}
              <button
                onClick={handleTeacherPortal}
                className="flex items-center space-x-3 w-full px-4 py-3 text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors duration-200 font-medium shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 ring-1 ring-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-amber-400 focus-visible:ring-offset-stone-900"
              >
                <BookOpen className="w-5 h-5" />
                <span>{teacherLoggedIn ? 'Teacher Dashboard' : 'Teacher Portal'}</span>
              </button>

              {/* Student Portal Mobile */}
              <button
                onClick={handleStudentPortal}
                className="flex items-center space-x-3 w-full px-4 py-3 text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors duration-200 font-medium shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 ring-1 ring-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-stone-900"
              >
                <Users className="w-5 h-5" />
                <span>{studentLoggedIn ? 'Student Dashboard' : 'Student Portal'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
      {/* Subtle accent line */}
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px bg-orange-500/50" />
    </nav>
  );
}
