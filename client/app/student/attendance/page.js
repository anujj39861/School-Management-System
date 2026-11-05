"use client"
import Head from 'next/head';
import { useState, useEffect } from 'react';
import AuthWrapper from '../components/AuthWrapper';

export default function Attendance() {
  const [attendanceData, setAttendanceData] = useState({
    overallPercentage: 0,
    totalDays: 0,
    presentDays: 0,
    subjects: [],
    absentDates: [],
    recentAttendance: [],
    attendanceStreak: 0,
    lastMonthPercentage: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [studentId, setStudentId] = useState(null);

  // Get student info from localStorage or context
  useEffect(() => {
    const token = localStorage.getItem('student_token');
    const studentUser = localStorage.getItem('student_user');
    
    if (!token) {
      setError('Please log in to view attendance');
      setLoading(false);
      return;
    }
    
    if (studentUser) {
      try {
        const userData = JSON.parse(studentUser);
        // Use student_id from the JWT token, not the user id
        setStudentId(userData.id || userData.id);
      } catch (parseError) {
        console.error('Error parsing student data:', parseError);
        setError('Invalid user data. Please log in again.');
        setLoading(false);
        return;
      }
    } else {
      setError('Student data not found. Please log in again.');
      setLoading(false);
      return;
    }
  }, []);

  // Fetch attendance data
  useEffect(() => {
    if (!studentId) return;
    
    const fetchAttendanceData = async () => {
      try {
        setLoading(true);
        
        const token = localStorage.getItem('student_token');
        
        if (!token) {
          throw new Error('Authentication token not found');
        }

        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };

        // Fetch overall attendance stats
  const statsResponse = await fetch(`http://localhost:5001/student/profile/attendance-stats/${studentId}`, {
          headers
        });

        if (!statsResponse.ok) {
          const errorText = await statsResponse.text();
          throw new Error(`Failed to fetch attendance statistics: ${errorText}`);
        }

        const statsData = await statsResponse.json();
        const stats = statsData.data;

        // Fetch subject-wise attendance
  const subjectResponse = await fetch(`http://localhost:5001/student/profile/subject-wise-attendance/${studentId}`, {
          headers
        });

        if (!subjectResponse.ok) {
          const errorText = await subjectResponse.text();
          throw new Error(`Failed to fetch subject-wise attendance: ${errorText}`);
        }

        const subjectData = await subjectResponse.json();
        const subjects = subjectData.data;

        // Fetch recent attendance
  const recentResponse = await fetch(`http://localhost:5001/student/profile/recent-attendance/${studentId}?limit=5`, {
          headers
        });

        if (!recentResponse.ok) {
          const errorText = await recentResponse.text();
          throw new Error(`Failed to fetch recent attendance: ${errorText}`);
        }

        const recentData = await recentResponse.json();
        const recentAttendance = recentData.data;

        // Fetch attendance records for absent dates
  const attendanceResponse = await fetch(`http://localhost:5001/student/profile/attendance/${studentId}?status=Absent&limit=3`, {
          headers
        });

        let absentDates = [];
        if (attendanceResponse.ok) {
          const attendanceData = await attendanceResponse.json();
          absentDates = attendanceData.data.map(record => ({
            date: new Date(record.date).toLocaleDateString('en-CA'),
            subject: record.subject,
            reason: 'Not specified' // Since we don't store reason in our backend
          }));
        }

        // Calculate attendance streak (consecutive present days)
        let streak = 0;
        for (let i = 0; i < recentAttendance.length; i++) {
          if (recentAttendance[i].status === 'Present') {
            streak++;
          } else {
            break;
          }
        }

        // Get last month's data for comparison
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        const lastMonthStart = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1).toISOString().split('T')[0];
        const lastMonthEnd = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0).toISOString().split('T')[0];

  const lastMonthResponse = await fetch(`http://localhost:5001/student/profile/attendance-stats/${studentId}?start_date=${lastMonthStart}&end_date=${lastMonthEnd}`, {
          headers
        });

        let lastMonthPercentage = stats.attendance_percentage;
        if (lastMonthResponse.ok) {
          const lastMonthData = await lastMonthResponse.json();
          lastMonthPercentage = lastMonthData.data.attendance_percentage || 0;
        }

        // Format subjects and consolidate similar subjects

        // Function to normalize subject names
        const normalizeSubjectName = (subject) => {
          const normalized = subject.trim().toLowerCase();
          
          // Map similar subjects to a standard name
          const subjectMapping = {
            'math': 'Mathematics',
            'maths': 'Mathematics',
            'mathematics': 'Mathematics',
            'science': 'Science',
            'physics': 'Physics',
            'chemistry': 'Chemistry',
            'english': 'English',
            'computer science': 'Computer Science',
            'biology': 'Biology',
            'history': 'History',
            'geography': 'Geography'
          };
          
          return subjectMapping[normalized] || subject.trim();
        };

        // Consolidate subjects by normalized name
        const subjectMap = new Map();
        
  subjects.forEach((subject, index) => {
          
          const normalizedName = normalizeSubjectName(subject.subject);
          
          // Convert string values to numbers
          const totalClasses = parseInt(subject.total_classes) || 0;
          const presentCount = parseInt(subject.present_count) || 0;
          
          if (subjectMap.has(normalizedName)) {
            // If subject already exists, combine the data
            const existing = subjectMap.get(normalizedName);
            
            const combinedTotalClasses = existing.totalClasses + totalClasses;
            const combinedAttended = existing.attended + presentCount;
            const percentage = combinedTotalClasses > 0 ? Math.round((combinedAttended * 100) / combinedTotalClasses) : 0;
            
            subjectMap.set(normalizedName, {
              name: normalizedName,
              percentage: percentage,
              totalClasses: combinedTotalClasses,
              attended: combinedAttended
            });
          } else {
            // First occurrence of this subject
            const percentage = Math.round(parseFloat(subject.attendance_percentage) || 0);
            
            subjectMap.set(normalizedName, {
              name: normalizedName,
              percentage: percentage,
              totalClasses: totalClasses,
              attended: presentCount
            });
          }
        });

        // Convert map back to array
        const formattedSubjects = Array.from(subjectMap.values());


        // Format recent attendance
        const formattedRecentAttendance = recentAttendance.map(record => ({
          date: new Date(record.date).toLocaleDateString('en-CA'),
          status: record.status.toLowerCase()
        }));

        setAttendanceData({
          overallPercentage: Math.round(stats.attendance_percentage || 0),
          totalDays: stats.total_records || 0,
          presentDays: stats.present_count || 0,
          subjects: formattedSubjects,
          absentDates: absentDates,
          recentAttendance: formattedRecentAttendance,
          attendanceStreak: streak,
          lastMonthPercentage: Math.round(lastMonthPercentage),
        });

      } catch (error) {
        console.error('Error fetching attendance data:', error);
        setError(error.message || 'Failed to load attendance data');
      } finally {
        setLoading(false);
      }
    };

    fetchAttendanceData();
  }, [studentId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading attendance data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md">
          <div className="text-red-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Attendance</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <AuthWrapper>
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-6">
      <Head>
        <title>Attendance Tracker</title>
        <meta name="description" content="Student Attendance Tracking Page" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="max-w-7xl mx-auto bg-white rounded-2xl shadow-2xl p-8">
        <div className="bg-gradient-to-r from-green-600 to-emerald-500 -mx-8 -mt-8 mb-8 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Attendance Dashboard</h1>
              <p className="text-green-100 mt-2">Academic Year 2025-26</p>
            </div>
              <button 
                onClick={() => window.location.reload()} 
                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                title="Refresh attendance data"
              >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Show message if no attendance data */}
        {attendanceData.totalDays === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-700 mb-2">No Attendance Records Yet</h2>
            <p className="text-gray-500 mb-4">Your attendance data will appear here once classes begin and attendance is marked.</p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              Check Again
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 mb-8">
              {/* Overall Attendance Card */}
              <div className="bg-white rounded-xl p-6 shadow-lg border border-green-50 hover:shadow-xl transition-shadow max-w-md mx-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-700">Overall Attendance</h3>
                  <span className="text-green-500 bg-green-50 p-2 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </span>
                </div>
                <div className="flex items-center justify-center">
                  <div className="relative w-32 h-32">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle
                        className="text-gray-200 stroke-current"
                        strokeWidth="10"
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                      ></circle>
                      <circle
                        className="text-green-600 progress-ring stroke-current"
                        strokeWidth="10"
                        strokeLinecap="round"
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                        strokeDasharray="251.2"
                        strokeDashoffset={251.2 * (1 - attendanceData.overallPercentage / 100)}
                      ></circle>
                    </svg>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                      <div className="text-3xl font-bold text-green-800">{attendanceData.overallPercentage}%</div>
                      <div className="text-sm text-gray-500">{attendanceData.presentDays}/{attendanceData.totalDays} classes</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Subject-wise Attendance */}
            <div className="bg-white rounded-xl p-6 shadow-lg border border-green-50 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Subject-wise Attendance</h2>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                  <span>Good</span>
                  <span className="w-3 h-3 bg-yellow-500 rounded-full ml-2"></span>
                  <span>Average</span>
                  <span className="w-3 h-3 bg-red-500 rounded-full ml-2"></span>
                  <span>Needs Attention</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {attendanceData.subjects.length > 0 ? (
                  attendanceData.subjects.map((subject, index) => {
                    const getStatusClasses = (percentage) => {
                      if (percentage >= 75) return 'border-green-200 bg-green-50';
                      if (percentage >= 60) return 'border-yellow-200 bg-yellow-50';
                      return 'border-red-200 bg-red-50';
                    };
                    const statusClasses = getStatusClasses(subject.percentage);

                    return (
                      <div key={index} className={`rounded-lg p-4 border-2 ${statusClasses} hover:shadow-md transition-shadow`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-gray-800">{subject.name}</h3>
                          </div>
                          <span className="text-2xl font-bold text-gray-700">{subject.percentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                          <div 
                            className={`h-2 rounded-full ${subject.percentage >= 75 ? 'bg-green-500' : subject.percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{width: `${subject.percentage}%`}}
                          ></div>
                        </div>
                        <p className="text-sm text-gray-600">
                          {subject.attended} out of {subject.totalClasses} classes
                        </p>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-full text-center py-8">
                    <div className="text-gray-400 mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-gray-500">No attendance records found</p>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Recent Attendance */}
              <div className="bg-white rounded-xl p-6 shadow-lg border border-green-50">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Recent Attendance
                </h2>
                <div className="space-y-3">
                  {attendanceData.recentAttendance.length > 0 ? (
                    attendanceData.recentAttendance.map((day, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-700">{day.date}</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          day.status === 'present' 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {day.status.charAt(0).toUpperCase() + day.status.slice(1)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6">
                      <div className="text-gray-400 mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-gray-500 text-sm">No recent attendance records</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Absences */}
              <div className="bg-white rounded-xl p-6 shadow-lg border border-green-50">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Recent Absences
                </h2>
                <div className="space-y-3">
                  {attendanceData.absentDates.length > 0 ? (
                    attendanceData.absentDates.map((absence, index) => (
                      <div key={index} className="p-3 bg-red-50 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-gray-700">{absence.date}</span>
                          <span className="text-red-600 font-medium">{absence.subject}</span>
                        </div>
                        <p className="text-sm text-gray-600">{absence.reason}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6">
                      <div className="text-gray-400 mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-gray-500 text-sm">Perfect attendance! No absences recorded.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
    </AuthWrapper>
  );
}
