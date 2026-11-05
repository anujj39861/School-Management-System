"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import AdminNavbar from "../admin/components/Navbar";
import StudentNavbar from "../student/components/Navbar";
import TeacherNavbar from "../teacher/components/Navbar";
import { NavigationProvider } from "../context/NavigationContext";
import NavigationProgressBar from "./NavigationProgressBar";

export default function ClientLayoutWrapper({ children }) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showMobileAlert, setShowMobileAlert] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setIsHydrated(true);
    
    // Check if user is on mobile device
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      const isSmallScreen = window.innerWidth < 768;
      
      if ((isMobile || isSmallScreen) && !localStorage.getItem('mobileAlertDismissed')) {
        setShowMobileAlert(true);
      }
    };
    
    checkMobile();
  }, []);

  // Check authentication for protected routes
  useEffect(() => {
    if (typeof window === 'undefined' || !pathname) return;

    const isAdminRoute = pathname.startsWith("/admin") && pathname !== "/admin/login";
    const isStudentRoute = pathname.startsWith("/student") && pathname !== "/student/login";
    const isTeacherRoute = pathname.startsWith("/teacher") && pathname !== "/teacher/login";
    
    if (isAdminRoute || isStudentRoute || isTeacherRoute) {
      let token = null;
      
      if (isAdminRoute) {
        token = localStorage.getItem("token");
      } else if (isStudentRoute) {
        token = localStorage.getItem("student_token");
      } else if (isTeacherRoute) {
        token = localStorage.getItem("teacher_token");
      }
      
      if (!token) {
        setIsAuthenticated(false);
        setIsAuthChecked(true);
        if (isAdminRoute) {
          router.replace("/login");
        } else if (isStudentRoute) {
          router.replace("/student/login");
        } else if (isTeacherRoute) {
          router.replace("/teacher/login");
        }
        return;
      }
    }
    
    setIsAuthenticated(true);
    setIsAuthChecked(true);
  }, [pathname, router]);

  const hideNavbarRoutes = ["/login", "/teacher/login", "/student/login"];

  const showAdminNavbar = pathname?.startsWith("/admin") && pathname !== "/admin/login";
  const showStudentNavbar = pathname?.startsWith("/student") && pathname !== "/student/login";
  const showTeacherNavbar = pathname?.startsWith("/teacher") && pathname !== "/teacher/login";

  const hideNavbar = pathname && hideNavbarRoutes.some((route) => pathname === route);

  // Show loading for protected routes until auth is checked
  const isProtectedRoute = pathname?.startsWith("/admin") && pathname !== "/admin/login" ||
                          pathname?.startsWith("/student") && pathname !== "/student/login" ||
                          pathname?.startsWith("/teacher") && pathname !== "/teacher/login";

  const dismissMobileAlert = () => {
    setShowMobileAlert(false);
    localStorage.setItem('mobileAlertDismissed', 'true');
  };

  if (isProtectedRoute && (!isAuthChecked || !isAuthenticated)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <NavigationProvider>
      {/* Mobile Alert */}
      {showMobileAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.232 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Better Experience</h3>
            </div>
            <p className="text-gray-600 mb-6">
              For the best experience and optimal performance, we recommend using SchoolFlow on a laptop or desktop computer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={dismissMobileAlert}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
      
      {isHydrated && pathname && (
        <>
          {!hideNavbar && (
            <>
              {showAdminNavbar && <AdminNavbar />}
              {showStudentNavbar && <StudentNavbar />}
              {showTeacherNavbar && <TeacherNavbar />}
            </>
          )}
          <NavigationProgressBar />
          <main>{children}</main>
        </>
      )}
    </NavigationProvider>
  );
}
