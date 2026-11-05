"use client";
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Menu, X, BookOpen, User, LogOut, ChevronDown, Settings, Bell } from 'lucide-react';
import { useNavigationLoader } from '../../context/NavigationContext';

export default function TeacherNavbar() {
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const router = useRouter();
  const pathname = usePathname();
  const { startNavigation } = useNavigationLoader();

  const toggleMenu = () => setMenuOpen(!menuOpen);

  const toggleProfile = (e) => {
    e.stopPropagation();
    setProfileOpen(!profileOpen);
  };

  // Custom navigation handler with loading state
  const handleNavigation = (href) => {
    if (pathname !== href) {
      setMenuOpen(false); // Close mobile menu
      startNavigation(href);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem("teacher_token");
    localStorage.removeItem("teacher_user");
    setUser(null);
    setProfileOpen(false);
    setMenuOpen(false);
    router.replace("/teacher/login"); // Use replace to avoid adding to history
  };

  // Initialize user and handle click outside for profile dropdown
  useEffect(() => {
    if (typeof window === 'undefined') return; // Prevent SSR errors

    const token = localStorage.getItem("teacher_token");
    if (!token) {
      setUser(undefined); // Explicitly set to undefined to indicate no user
      return;
    }

    const storedUser = localStorage.getItem("teacher_user");
    const parsedUser = storedUser ? JSON.parse(storedUser) : null;
    setUser(parsedUser);

    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      <nav className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-800 shadow-xl sticky top-0 z-50 backdrop-blur-md border-b border-purple-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/teacher/dashboard" className="flex items-center space-x-2 group">
              <div className="bg-white/10 backdrop-blur-md p-2 rounded-xl group-hover:bg-white/20 transition-all duration-300 shadow-lg shadow-purple-500/20">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">
                TeacherPortal
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {[
                { href: "/teacher/dashboard", label: "Dashboard" },
                { href: "/teacher/classes", label: "My Classes" },
                { href: "/teacher/attendance", label: "Attendance" },
                { href: "/teacher/profile", label: "Profile" }
              ].map((item) => (
                <button
                  key={item.href}
                  onClick={() => handleNavigation(item.href)}
                  className={`px-4 py-2 text-white/90 hover:text-white hover:bg-white/10 rounded-lg font-medium transition-all duration-200 backdrop-blur-sm ${
                    pathname === item.href ? 'bg-white/20 text-white shadow-lg shadow-purple-500/20' : ''
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Desktop Auth Section */}
            <div className="hidden md:flex items-center space-x-3">
              {/* Notifications */}
              <button className="relative p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              </button>

              {user === null ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-white/30 rounded-full animate-pulse"></div>
                  <span className="text-white/80">Loading...</span>
                </div>
              ) : user ? (
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={toggleProfile}
                    className="flex items-center space-x-3 px-4 py-2 bg-white/10 backdrop-blur-md rounded-xl hover:bg-white/20 transition-all duration-300 border border-white/20 shadow-lg shadow-purple-500/20"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {user.name?.charAt(0) || user.email?.charAt(0) || 'T'}
                      </span>
                    </div>
                    <span className="text-white font-medium max-w-32 truncate">
                      {user.name || user.email || 'Teacher'}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-white/80 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Profile Dropdown */}
                  {profileOpen && (
                    <div className="absolute right-0 mt-2 w-72 bg-white/95 backdrop-blur-xl border border-purple-200/50 rounded-xl shadow-2xl py-2 animate-in slide-in-from-top-2 duration-200">
                      <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-200/50">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full flex items-center justify-center text-2xl font-bold text-white">
                          {user.name?.charAt(0) || user.email?.charAt(0) || 'T'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {user.name || 'Teacher Name'}
                          </p>
                          <p className="text-sm text-gray-600 truncate">
                            {user.email || 'teacher@school.edu'}
                          </p>
                          <p className="text-xs text-purple-600 font-medium">
                            Teacher Account
                          </p>
                        </div>
                      </div>
                      
                      <div className="py-2">
                        <button
                          onClick={() => handleNavigation('/teacher/settings')}
                          className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 transition-colors"
                        >
                          <Settings className="w-4 h-4 text-purple-600" />
                          Settings
                        </button>
                      </div>
                      
                      <div className="border-t border-gray-200/50 pt-2">
                        <button
                          onClick={handleSignOut}
                          className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/teacher/login"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                >
                  Sign In
                </Link>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={toggleMenu}
                className="text-white p-2 rounded-lg hover:bg-white/10 transition-all"
              >
                {menuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {menuOpen && (
            <div className="md:hidden py-4 border-t border-white/20">
              {[
                { href: "/teacher/dashboard", label: "Dashboard" },
                { href: "/teacher/classes", label: "My Classes" },
                { href: "/teacher/attendance", label: "Attendance" },
                { href: "/teacher/profile", label: "Profile" }
              ].map((item) => (
                <button
                  key={item.href}
                  onClick={() => handleNavigation(item.href)}
                  className={`block w-full text-left px-4 py-2 text-white/90 hover:text-white hover:bg-white/10 rounded-lg font-medium transition-all duration-200 ${
                    pathname === item.href ? 'bg-white/20 text-white' : ''
                  }`}
                >
                  {item.label}
                </button>
              ))}
              
              {/* Mobile Profile Section */}
              {user && (
                <>
                  <div className="border-t border-white/20 mt-4 pt-4">
                    <div className="flex items-center gap-3 px-4 py-2 text-white">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {user.name?.charAt(0) || user.email?.charAt(0) || 'T'}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{user.name || 'Teacher'}</p>
                        <p className="text-xs text-white/70">{user.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleNavigation('/teacher/settings')}
                      className="block w-full text-left px-4 py-2 text-white/90 hover:text-white hover:bg-white/10 rounded-lg font-medium transition-all duration-200"
                    >
                      Settings
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="block w-full text-left px-4 py-2 text-red-300 hover:text-red-200 hover:bg-red-500/20 rounded-lg font-medium transition-all duration-200"
                    >
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </nav>
    </>
  );
}
