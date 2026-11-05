
"use client";
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Menu, X, User, GraduationCap, LogOut, ChevronDown, Phone, PlaneTakeoff } from 'lucide-react';
import { useNavigationLoader } from '../../context/NavigationContext';

export default function Navbar() {
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
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setProfileOpen(false);
    setMenuOpen(false);
    router.replace("/login"); // Use replace to avoid adding to history
  };

  // Initialize user and handle click outside for profile dropdown
  useEffect(() => {
    if (typeof window === 'undefined') return; // Prevent SSR errors

    const token = localStorage.getItem("token");
    if (!token) {
      setUser(undefined); // Explicitly set to undefined to indicate no user
      return;
    }

    const storedUser = localStorage.getItem("user");
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
      <nav className="bg-black shadow-xl sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/admin/dashboard" className="flex items-center space-x-2 group">
            <div className="bg-white/10 backdrop-blur-md p-2 rounded-xl group-hover:bg-white/20 transition-all duration-300">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">
              MySchool
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {[
              { href: "/admin/dashboard", label: "Dashboard" },
              { href: "/admin/students", label: "Students" },
              { href: "/admin/fees", label: "Fees" },
              { href: "/admin/teachers", label: "Teachers" },
              { href: "/admin/attendance", label: "Attendance" },
              {href:"/admin/timetable", label: "Timetable" }
            ].map((item) => (
              <button
                key={item.href}
                onClick={() => handleNavigation(item.href)}
                className={`px-4 py-2 text-white/90 hover:text-white hover:bg-white/10 rounded-lg font-medium transition-all duration-200 backdrop-blur-sm ${
                  pathname === item.href ? 'bg-white/20 text-white shadow-lg shadow-blue-500/20' : ''
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Desktop Auth Section */}
          <div className="hidden md:flex items-center">
            {user === null ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-white/30 rounded-full animate-pulse"></div>
                <span className="text-white/80">Loading...</span>
              </div>
            ) : user ? (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={toggleProfile}
                  className="flex items-center space-x-3 px-4 py-2 bg-white/10 backdrop-blur-md rounded-xl hover:bg-white/20 transition-all duration-300 border border-white/20 shadow-lg shadow-blue-500/20"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {user.email?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <span className="text-white font-medium max-w-32 truncate">
                    {user.email || 'User'}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-white/80 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Profile Dropdown */}
                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl py-2 animate-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-200/50">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-2xl font-bold text-white">
                        {user.logo_url ? (
                          <img
                            src={user.logo_url}
                            alt="User"
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          (user.name?.charAt(0) || user.email?.charAt(0) || 'U')
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{user.name}</p>
                        <p className="text-sm text-gray-600 truncate">{user.email}</p>
                      </div>
                    </div>
                    <div className="px-4 py-2">
                      <div className="flex items-center gap-2 mb-1">
                        <Phone className="w-4 h-4 text-blue-500" />
                        <span className="text-gray-700 text-sm">{user.phone || "No phone"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <PlaneTakeoff className="w-4 h-4 text-blue-500" />
                        <span className="text-gray-700 text-sm">
                          Plan: {user.subscription_plan || "Free"}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center space-x-2 px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors duration-200 border-t border-gray-200/50"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => router.push("/login")}
                className="px-6 py-2 bg-white text-blue-600 hover:bg-white/90 font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Sign In
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors duration-200"
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-white/20 py-4 animate-in slide-in-from-top-2 duration-200">
            <div className="space-y-2">
              {[
                { href: "/admin/dashboard", label: "Dashboard" },
                { href: "/admin/students", label: "Students" },
                { href: "/admin/fees", label: "Fees" },
                { href: "/admin/teachers", label: "Teachers" },
                { href: "/admin/attendance", label: "Attendance" },
                {href:"/admin/timetable", label: "Timetable" }
              ].map((item) => (
                <button
                  key={item.href}
                  onClick={() => handleNavigation(item.href)}
                  className={`block w-full text-left px-4 py-3 text-white/90 hover:text-white hover:bg-white/10 rounded-lg font-medium transition-all duration-200 ${
                    pathname === item.href ? 'bg-white/20 text-white' : ''
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Mobile Auth Section */}
            <div className="mt-6 pt-4 border-t border-white/20">
              {user === null ? (
                <div className="flex items-center space-x-2 px-4">
                  <div className="w-4 h-4 bg-white/30 rounded-full animate-pulse"></div>
                  <span className="text-white/80">Loading...</span>
                </div>
              ) : user ? (
                <div className="space-y-3">
                  <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold">
                          {user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <div>
                        <p className="text-white font-semibold">{user.name}</p>
                        <p className="text-white/70 text-sm truncate">{user.email}</p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-500/20 text-red-100 hover:bg-red-500/30 rounded-lg font-medium transition-all duration-200 border border-red-500/30"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    router.push("/login");
                    setMenuOpen(false);
                  }}
                  className="w-full px-4 py-3 bg-white text-indigo-600 hover:bg-white/90 font-semibold rounded-lg transition-all duration-300 shadow-lg"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  </>
  );
}
