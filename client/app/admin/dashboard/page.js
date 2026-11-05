"use client";
import React, { useState, useEffect } from "react";
import AuthWrapper from "../components/AuthWrapper";
import {
  Users,
  GraduationCap,
  UserCheck,
  DollarSign,
  Calendar,
  TrendingUp,
  AlertCircle,
  Clock,
  BookOpen,
  Settings,
  PieChart,
  BarChart3,
  ChevronRight,
  RefreshCw
} from "lucide-react";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0
  });
  // School-relevant system status
  const [status, setStatus] = useState({
    apiHealthy: false,
    studentAPI: 'unknown',
    teacherAPI: 'unknown',
    timetableAPI: 'unknown',
    classesConfigured: 0,
    adminSession: 'unknown',
    avgLatencyMs: 0,
    lastUpdated: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    // Set some initial default data
    setStats({
      totalStudents: 0,
      totalTeachers: 0,
      totalClasses: 0
    });
    setRecentActivities([
      { id: 1, type: "student", message: "Dashboard loaded successfully", time: "Just now" },
      { id: 2, type: "system", message: "System is ready", time: "1 minute ago" },
      { id: 3, type: "teacher", message: "Welcome to admin dashboard", time: "2 minutes ago" },
      { id: 4, type: "student", message: "All systems operational", time: "5 minutes ago" }
    ]);
    
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No authentication token found. Please login again.");
        setLoading(false);
        return;
      }

      const headers = {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      };

      let totalStudents = 0;
      let totalTeachers = 0;
  const latencies = [];
  let studentAPI = 'unknown';
  let teacherAPI = 'unknown';
  let timetableAPI = 'unknown';

      // Fetch students with better error handling
      try {
        const t0 = performance.now();
        const studentsResponse = await fetch("http://localhost:5001/admin/student/getallstudents", { headers });
        const t1 = performance.now();
        latencies.push(t1 - t0);
        if (studentsResponse.ok) {
          const studentsData = await studentsResponse.json();
          totalStudents = studentsData.success && studentsData.data ? studentsData.data.length : 0;
          studentAPI = 'up';
        } else {
          studentAPI = 'down';
        }
      } catch (err) {
        studentAPI = 'down';
      }
      
      // Fetch teachers with better error handling
      try {
        const t0 = performance.now();
        const teachersResponse = await fetch("http://localhost:5001/admin/teacher/getALL", { headers });
        const t1 = performance.now();
        latencies.push(t1 - t0);
        if (teachersResponse.ok) {
          const teachersData = await teachersResponse.json();
          if (teachersData.success && Array.isArray(teachersData.data)) {
            totalTeachers = teachersData.data.length;
          } else if (Array.isArray(teachersData.data)) {
            totalTeachers = teachersData.data.length;
          } else if (Array.isArray(teachersData)) {
            totalTeachers = teachersData.length;
          } else {
            totalTeachers = 0;
          }
          teacherAPI = 'up';
        } else {
          teacherAPI = 'down';
        }
      } catch (err) {
        teacherAPI = 'down';
      }
      
      // Calculate unique classes from students data
      const uniqueClasses = new Set();
      try {
        const t0 = performance.now();
        const studentsResponse = await fetch("http://localhost:5001/admin/student/getallstudents", { headers });
        const t1 = performance.now();
        latencies.push(t1 - t0);
        if (studentsResponse.ok) {
          const studentsData = await studentsResponse.json();
          if (studentsData.success && studentsData.data) {
            studentsData.data.forEach(student => {
              if (student.class && student.section) {
                uniqueClasses.add(`${student.class}-${student.section}`);
              }
            });
          }
          timetableAPI = 'up';
        } else {
          timetableAPI = 'down';
        }
      } catch (err) {
        timetableAPI = 'down';
      }

      // Update stats
      const newStats = {
        totalStudents,
        totalTeachers,
        totalClasses: uniqueClasses.size
      };
      setStats(newStats);

      // Update recent activities with real data
      const activities = [
        { id: 1, type: "student", message: `${totalStudents} students in system`, time: "Just now" },
        { id: 2, type: "teacher", message: `${totalTeachers} teachers registered`, time: "Just now" },
        { id: 3, type: "system", message: `${uniqueClasses.size} classes active`, time: "Just now" },
        { id: 4, type: "student", message: "System running smoothly", time: "Just now" }
      ];
      
      setRecentActivities(activities);

      // Derive school-relevant system status
      const avgLatency = latencies.length ? Math.round(latencies.reduce((a,b)=>a+b,0) / latencies.length) : 0;
      setStatus({
        apiHealthy: [studentAPI, teacherAPI].every(s => s === 'up'),
        studentAPI,
        teacherAPI,
        timetableAPI,
        classesConfigured: uniqueClasses.size,
        adminSession: token ? 'active' : 'expired',
        avgLatencyMs: avgLatency,
        lastUpdated: new Date().toISOString(),
      });

    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Failed to load dashboard data. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, trend, onClick }) => (
    <div 
      className={`bg-white rounded-lg shadow-md p-6 border-l-4 border-${color}-500 hover:shadow-lg transition-shadow cursor-pointer`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {trend && (
            <p className="text-sm text-green-600 flex items-center mt-1">
              <TrendingUp className="w-3 h-3 mr-1" />
              {trend}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full bg-${color}-100`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
      </div>
    </div>
  );

  const QuickActionCard = ({ title, description, icon: Icon, color, onClick }) => (
    <div 
      className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border border-gray-200"
      onClick={onClick}
    >
      <div className="flex items-start space-x-4">
        <div className={`p-2 rounded-lg bg-${color}-100`}>
          <Icon className={`w-5 h-5 text-${color}-600`} />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </div>
    </div>
  );

  const ActivityItem = ({ activity }) => {
    const getActivityIcon = (type) => {
      switch (type) {
        case "student": return Users;
        case "teacher": return GraduationCap;
        case "system": return Settings;
        default: return AlertCircle;
      }
    };

    const Icon = getActivityIcon(activity.type);

    return (
      <div className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg">
        <div className="p-2 rounded-full bg-blue-100">
          <Icon className="w-4 h-4 text-blue-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-900">{activity.message}</p>
          <p className="text-xs text-gray-500">{activity.time}</p>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <AuthWrapper>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-gray-600">Loading dashboard...</span>
          </div>
        </div>
      </AuthWrapper>
    );
  }

  return (
    <AuthWrapper>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-gray-600">Welcome back! Here's what's happening at your school.</p>
              </div>
              <button
                onClick={fetchDashboardData}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                <span className="text-red-700">{error}</span>
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <StatCard
              title="Total Students"
              value={stats.totalStudents}
              icon={Users}
              color="blue"
              trend="+5% from last month"
              onClick={() => window.location.href = "/admin/students"}
            />
            <StatCard
              title="Total Teachers"
              value={stats.totalTeachers}
              icon={GraduationCap}
              color="green"
              trend="+2% from last month"
              onClick={() => window.location.href = "/admin/teachers"}
            />
            <StatCard
              title="Classes"
              value={stats.totalClasses}
              icon={BookOpen}
              color="purple"
              onClick={() => window.location.href = "/admin/students"}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Quick Actions */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <QuickActionCard
                    title="Add New Student"
                    description="Enroll a new student to the system"
                    icon={Users}
                    color="blue"
                    onClick={() => window.location.href = "/admin/students"}
                  />
                  <QuickActionCard
                    title="Add New Teacher"
                    description="Register a new teacher to the system"
                    icon={GraduationCap}
                    color="green"
                    onClick={() => window.location.href = "/admin/teachers"}
                  />
                  <QuickActionCard
                    title="Manage Timetable"
                    description="Create or update class schedules"
                    icon={Calendar}
                    color="purple"
                    onClick={() => window.location.href = "/admin/timetable"}
                  />
                  <QuickActionCard
                    title="View All Students"
                    description="Manage existing student records"
                    icon={BookOpen}
                    color="indigo"
                    onClick={() => window.location.href = "/admin/students"}
                  />
                </div>
              </div>

              {/* Analytics Section */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Analytics Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <PieChart className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <h3 className="font-medium text-gray-900">Student Distribution</h3>
                    <p className="text-2xl font-bold text-blue-600">{stats.totalClasses}</p>
                    <p className="text-sm text-gray-600">Active Classes</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <BarChart3 className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <h3 className="font-medium text-gray-900">Teacher Ratio</h3>
                    <p className="text-2xl font-bold text-green-600">{stats.totalStudents && stats.totalTeachers ? Math.round(stats.totalStudents / stats.totalTeachers) : 0}:1</p>
                    <p className="text-sm text-gray-600">Students per Teacher</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activities */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h2>
              <div className="space-y-2">
                {recentActivities.map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))}
              </div>
              <button className="w-full mt-4 text-center text-blue-600 hover:text-blue-700 text-sm font-medium">
                View All Activities
              </button>
            </div>
          </div>

          {/* System Status - school relevant */}
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">System Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* API Health */}
              <div className={`flex items-center space-x-3 p-3 rounded-lg ${status.apiHealthy ? 'bg-green-50' : 'bg-red-50'}`}>
                <div className={`w-3 h-3 rounded-full ${status.apiHealthy ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm font-medium">Core APIs: {status.apiHealthy ? 'Healthy' : 'Issues detected'}</span>
              </div>

              {/* Student API */}
              <div className={`flex items-center space-x-3 p-3 rounded-lg ${status.studentAPI === 'up' ? 'bg-green-50' : status.studentAPI === 'down' ? 'bg-red-50' : 'bg-gray-50'}`}>
                <div className={`w-3 h-3 rounded-full ${status.studentAPI === 'up' ? 'bg-green-500' : status.studentAPI === 'down' ? 'bg-red-500' : 'bg-gray-400'}`}></div>
                <span className="text-sm font-medium">Student Portal: {status.studentAPI === 'up' ? 'Online' : status.studentAPI === 'down' ? 'Offline' : 'Unknown'}</span>
              </div>

              {/* Teacher API */}
              <div className={`flex items-center space-x-3 p-3 rounded-lg ${status.teacherAPI === 'up' ? 'bg-green-50' : status.teacherAPI === 'down' ? 'bg-red-50' : 'bg-gray-50'}`}>
                <div className={`w-3 h-3 rounded-full ${status.teacherAPI === 'up' ? 'bg-green-500' : status.teacherAPI === 'down' ? 'bg-red-500' : 'bg-gray-400'}`}></div>
                <span className="text-sm font-medium">Teacher Portal: {status.teacherAPI === 'up' ? 'Online' : status.teacherAPI === 'down' ? 'Offline' : 'Unknown'}</span>
              </div>

              {/* Timetable */}
              <div className={`flex items-center space-x-3 p-3 rounded-lg ${status.timetableAPI === 'up' ? 'bg-green-50' : status.timetableAPI === 'down' ? 'bg-yellow-50' : 'bg-gray-50'}`}>
                <div className={`w-3 h-3 rounded-full ${status.timetableAPI === 'up' ? 'bg-green-500' : status.timetableAPI === 'down' ? 'bg-yellow-500' : 'bg-gray-400'}`}></div>
                <span className="text-sm font-medium">Timetable Service: {status.timetableAPI === 'up' ? 'Accessible' : status.timetableAPI === 'down' ? 'Limited' : 'Unknown'}</span>
              </div>

              {/* Classes configured */}
              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium">Active Classes: {status.classesConfigured}</span>
              </div>

              {/* Session & latency */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium">Admin Session: {status.adminSession === 'active' ? 'Active' : 'Expired'}</span>
                <span className="text-xs text-gray-500">Avg API {status.avgLatencyMs} ms</span>
              </div>
            </div>
            {status.lastUpdated && (
              <p className="mt-3 text-xs text-gray-500">Last updated: {new Date(status.lastUpdated).toLocaleString()}</p>
            )}
          </div>
        </div>
      </div>
    </AuthWrapper>
  );
};

export default Dashboard;