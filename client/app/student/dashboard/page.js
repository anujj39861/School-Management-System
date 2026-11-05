"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import AuthWrapper from "../components/AuthWrapper";
import {
  CalendarDays,
  BarChart2,
  Clock,
  RefreshCw,
  LogOut,
  User,
  Calendar,
} from "lucide-react";

function StudentDashboard() {
  const [studentData, setStudentData] = useState(null);
  const [todayTimetable, setTodayTimetable] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const router = useRouter();
  const today = new Date();

  useEffect(() => {
    const studentToken = localStorage.getItem('student_token');
    const studentDataStr = localStorage.getItem('student_user');
    
    if (!studentToken) {
      alert('Session expired or not logged in. Please login again.');
      router.push('/student/login');
      setLoading(false);
      return;
    }
    
    if (studentDataStr) {
      try {
        const parsedData = JSON.parse(studentDataStr);
        setStudentData(parsedData);
        fetchDashboardData(parsedData.id, studentToken);
      } catch (error) {
        console.error('Error parsing student data:', error);
        localStorage.removeItem('student_user');
        localStorage.removeItem('student_token');
        router.push('/student/login');
        return;
      }
    } else {
      alert('Student data not found. Please login again.');
      router.push('/student/login');
      return;
    }
    setLoading(false);
  }, [router]);

  const fetchDashboardData = async (studentId, token) => {
    setLoadingData(true);
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    try {
      // Fetch today's timetable - use full timetable API and filter for today
  const timetableResponse = await fetch('http://localhost:5001/student/timetable/my-timetable', {
        headers
      });
      
      if (timetableResponse.ok) {
        const timetableData = await timetableResponse.json();
        
        if (timetableData.success && timetableData.data && timetableData.data.timetable) {
          // Get today's day name
          const today = new Date();
          const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          const currentDay = daysOfWeek[today.getDay()];
          
          // Get today's schedule from the full timetable
          const todaySchedule = timetableData.data.timetable[currentDay] || [];
          setTodayTimetable(todaySchedule);
        } else {
          setTodayTimetable([]);
        }
      } else {
        const errorData = await timetableResponse.json().catch(() => ({}));
        const errorMessage = errorData.message || errorData.error || 'Failed to fetch timetable';
        console.error('Timetable API error:', timetableResponse.status, errorMessage);
        setTodayTimetable([]);
        
        // Store error message if it's a meaningful error (not just network issue)
  if (timetableResponse.status === 404 || timetableResponse.status === 400) {}
      }

      // Fetch attendance stats - use the correct endpoint from working attendance page
  const attendanceResponse = await fetch(`http://localhost:5001/student/profile/attendance-stats/${studentId}`, {
        headers
      });
      
      if (attendanceResponse.ok) {
        const attendanceData = await attendanceResponse.json();
        
        if (attendanceData.success && attendanceData.data) {
          setAttendanceStats(attendanceData.data);
        } else {
          setAttendanceStats(null);
        }
      } else {
        console.error('Attendance API error:', attendanceResponse.status, await attendanceResponse.text());
        setAttendanceStats(null);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setTodayTimetable([]);
      setAttendanceStats(null);
    } finally {
      setLoadingData(false);
    }
  };

  const refreshData = () => {
    if (studentData) {
      const token = localStorage.getItem('student_token');
      fetchDashboardData(studentData.id, token);
    }
  };
  
  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // If no student data, show error
  if (!studentData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Unable to Load Dashboard</h2>
          <p className="text-gray-600 mb-4">Please try logging in again.</p>
          <button 
            onClick={() => router.push('/student/login')}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const friendlyDate = (d) => new Date(d).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });

  // Logout function
  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('student_token');
      localStorage.removeItem('student_user');
      router.push('/student/login');
    }
  };

  return (
    <AuthWrapper>
      <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-slate-800">Welcome back, <span className="text-indigo-600">{studentData.name}</span>!</h1>
            <p className="text-sm text-slate-500 mt-1">{friendlyDate(today)} • Here's your dashboard</p>
          </div>

          <div className="text-black flex items-center gap-4">
            <button 
              onClick={refreshData}
              disabled={loadingData}
              className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg shadow-sm text-sm hover:shadow-md disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loadingData ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-red-600 hover:bg-red-100 transition-colors text-sm"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center text-white font-semibold">{studentData.name.charAt(0)}</div>
              <div className="text-sm text-slate-600">
                <div className="font-medium">{studentData.name}</div>
                <div className="text-xs">Class {studentData.class || 'N/A'} - Section {studentData.section || 'N/A'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column (Main widgets) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Today's Timetable */}
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-50 p-2 rounded-lg">
                    <CalendarDays className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-slate-800">Today's Timetable</h3>
                    <p className="text-sm text-slate-500">{friendlyDate(today)} • {today.toLocaleDateString('en-US', { weekday: 'long' })}</p>
                  </div>
                </div>
                <div className="text-xs text-slate-500">{todayTimetable.length} classes</div>
              </div>

              {loadingData ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : todayTimetable.length > 0 ? (
                <div className="divide-y">
                  {todayTimetable.map((item, idx) => (
                    <div key={idx} className="py-3 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-slate-700">{item.subject || 'Subject'}</div>
                        <div className="text-xs text-slate-500">{item.room || 'Room'} • {item.teacher || 'Teacher'}</div>
                      </div>
                      <div className="text-sm text-slate-600">{item.time || 'Time'}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-medium">No classes scheduled for today</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {today.toLocaleDateString('en-US', { weekday: 'long' })}
                  </p>
                  <div className="mt-3">
                    <button
                      onClick={() => window.location.href = '/student/time-table'}
                      className="text-xs text-indigo-600 hover:text-indigo-700 underline"
                    >
                      View full timetable
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right column (Sidebar widgets) */}
          <div className="space-y-6">
            {/* Attendance Stats */}
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-violet-50 p-2 rounded-lg">
                  <BarChart2 className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-slate-800">Attendance Stats</h3>
                  <p className="text-sm text-slate-500">Your attendance overview</p>
                </div>
              </div>

              {loadingData ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-violet-600"></div>
                </div>
              ) : attendanceStats ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Total Classes</span>
                    <span className="text-sm font-semibold text-slate-800">{attendanceStats.total_records || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Present</span>
                    <span className="text-sm font-semibold text-green-600">{attendanceStats.present_count || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Absent</span>
                    <span className="text-sm font-semibold text-red-600">{attendanceStats.absent_count || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Attendance %</span>
                    <span className="text-sm font-semibold text-indigo-600">{attendanceStats.attendance_percentage || '0'}%</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <BarChart2 className="w-6 h-6 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No attendance data available</p>
                  <p className="text-xs mt-1">Check if attendance records exist</p>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-rose-50 p-2 rounded-lg">
                  <Clock className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-slate-800">Quick Actions</h3>
                  <p className="text-sm text-slate-500">Available features</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <button 
                  onClick={() => router.push('/student/attendance')}
                  className="w-full text-left p-3 rounded-lg border hover:bg-slate-50 transition-colors"
                >
                  <div className="text-sm font-medium text-slate-800">View Attendance</div>
                  <div className="text-xs text-slate-500">Check your attendance record</div>
                </button>
                <button 
                  onClick={() => router.push('/student/profile')}
                  className="w-full text-left p-3 rounded-lg border hover:bg-slate-50 transition-colors"
                >
                  <div className="text-sm font-medium text-slate-800">Update Profile</div>
                  <div className="text-xs text-slate-500">Manage your account</div>
                </button>
                <button 
                  onClick={() => router.push('/student/time-table')}
                  className="w-full text-left p-3 rounded-lg border hover:bg-slate-50 transition-colors"
                >
                  <div className="text-sm font-medium text-slate-800">View Timetable</div>
                  <div className="text-xs text-slate-500">Check class schedule</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </AuthWrapper>
  );
}

export default StudentDashboard;