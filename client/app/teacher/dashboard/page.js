"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import TeacherAuthWrapper from "../components/AuthWrapper";
import {
  Users,
  BookOpen,
  Calendar,
  CheckCircle,
  Clock,
  TrendingUp,
  AlertCircle,
  ChevronRight,
  RefreshCw,
  CalendarDays,
  UserCheck,
  User
} from "lucide-react";

const TeacherDashboard = () => {
  const router = useRouter();
  const [teacherData, setTeacherData] = useState(null);
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalStudents: 0,
    assignedSubjects: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Update time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const teacherToken = localStorage.getItem('teacher_token');
    const teacherDataStr = localStorage.getItem('teacher_user');
    
    if (teacherDataStr) {
      try {
        const parsedData = JSON.parse(teacherDataStr);
        setTeacherData(parsedData);
        fetchDashboardData(parsedData, teacherToken);
      } catch (error) {
        console.error('Error parsing teacher data:', error);
        setError('Failed to load teacher data');
      }
    }
    
    setLoading(false);
  }, []);

  const fetchDashboardData = async (teacher, token) => {
    try {
      
      // Try to fetch detailed data from the teacher API (same as attendance page)
      try {
  const response = await fetch('http://localhost:5001/teacher/students', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        // Handle expired/invalid token: auto-logout and redirect
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('teacher_token');
          localStorage.removeItem('teacher_user');
          router.replace('/teacher/login?session=expired');
          return;
        }
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.success && data.data) {
            const apiData = data.data;
            
            // Set stats using the API data which properly parses class assignments
            setStats({
              totalClasses: apiData.availableClasses ? apiData.availableClasses.length : 0,
              totalStudents: apiData.students ? apiData.students.length : 0,
              assignedSubjects: apiData.availableSubjects || []
            });
            
            // Update teacher data with proper class display
            if (apiData.availableClasses) {
              setTeacherData(prev => ({
                ...prev,
                class_assigned: apiData.availableClasses.join(', ')
              }));
            }
            
            return; // Success, exit early
          }
        }
      } catch (error) {
  console.error('Could not fetch from teacher API, falling back to simple parsing:', error);
      }
      
      // Fallback: Extract class information from teacher data (simple parsing)
      const assignedClasses = teacher.class_assigned ? 
        teacher.class_assigned.split(',').map(cls => cls.trim()) : [];
      
      // Set stats based on teacher data
      setStats({
        totalClasses: assignedClasses.length,
        totalStudents: 0, // Unknown without API
        assignedSubjects: teacher.subject_specialty ? [teacher.subject_specialty] : []
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
    }
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, color = "blue" }) => {
    const colorClasses = {
      blue: "from-blue-500 to-blue-600",
      green: "from-green-500 to-green-600", 
      purple: "from-purple-500 to-purple-600",
      orange: "from-orange-500 to-orange-600"
    };

    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-3 rounded-lg bg-gradient-to-r ${colorClasses[color]} shadow-lg`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-sm font-medium text-gray-600">{title}</h3>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-gray-900">{value}</p>
            </div>
            {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-purple-600" />
          <span className="text-lg font-medium text-gray-700">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <TeacherAuthWrapper>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Welcome back, {teacherData?.name || 'Teacher'}!
                </h1>
                <p className="text-gray-600 mt-1">
                  {currentTime.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })} - {currentTime.toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => window.location.reload()} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Teacher Info Card */}
          {teacherData && (
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 mb-8 p-6">
              <div className="flex items-center gap-4">
                <div className="bg-purple-100 p-4 rounded-full">
                  <User className="w-8 h-8 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900">{teacherData.name}</h2>
                  <p className="text-gray-600">Teacher ID: {teacherData.teacher_id}</p>
                  <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600">
                    <span>Email: {teacherData.email}</span>
                    <span>Phone: {teacherData.phone}</span>
                    <span>Subject: {teacherData.subject_specialty}</span>
                    <span>Classes: {teacherData.class_assigned}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <StatCard
              icon={BookOpen}
              title="Assigned Classes"
              value={stats.totalClasses}
              subtitle="Classes you teach"
              color="purple"
            />
            <StatCard
              icon={Users}
              title="Total Students"
              value={stats.totalStudents}
              subtitle="Across all your classes"
              color="blue"
            />
            <StatCard
              icon={Calendar}
              title="Subject Specialty"
              value={teacherData?.subject_specialty || 'N/A'}
              subtitle="Your main subject"
              color="green"
            />
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
              <p className="text-gray-600 mt-1">Access your main teaching tools</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { 
                    icon: UserCheck, 
                    label: "Mark Attendance", 
                    color: "bg-green-500", 
                    href: "/teacher/attendance",
                    description: "Mark student attendance"
                  },
                  { 
                    icon: Users, 
                    label: "View Students", 
                    color: "bg-blue-500", 
                    href: "/teacher/classes",
                    description: "See your assigned students"
                  },
                  { 
                    icon: User, 
                    label: "My Profile", 
                    color: "bg-purple-500", 
                    href: "/teacher/profile",
                    description: "Update your profile"
                  },
                  { 
                    icon: Calendar, 
                    label: "Class Schedule", 
                    color: "bg-orange-500", 
                    href: "/teacher/classes",
                    description: "View your class schedule"
                  }
                ].map((action, index) => (
                  <button
                    key={index}
                    onClick={() => window.location.href = action.href}
                    className="flex flex-col items-start gap-3 p-4 rounded-lg border border-gray-200 hover:shadow-md transition-all duration-200 group text-left"
                  >
                    <div className={`p-3 rounded-lg ${action.color} group-hover:scale-110 transition-transform duration-200`}>
                      <action.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 group-hover:text-gray-900 block">{action.label}</span>
                      <span className="text-sm text-gray-500 mt-1">{action.description}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 ml-auto group-hover:translate-x-1 transition-transform duration-200" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </TeacherAuthWrapper>
  );
};

export default TeacherDashboard;
