"use client"
import Head from 'next/head';
import { useState, useEffect } from 'react';
import AuthWrapper from '../components/AuthWrapper';

export default function Timetable() {
  const [timetable, setTimetable] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [classInfo, setClassInfo] = useState({ class_id: '', class_name: '' });
  const [schoolDays, setSchoolDays] = useState([]);
  const [displayLectures, setDisplayLectures] = useState([]);

  // Helper function for ordinal numbers
  function getOrdinal(n) {
    if (n === 1) return 'st';
    if (n === 2) return 'nd';
    if (n === 3) return 'rd';
    return 'th';
  }

  // Migration function to convert old time-based data to new lecture-based format
  const migrateTimetableData = (timetable) => {
    if (!timetable) return {};
    
    const oldTimeSlots = [
      "09:00 AM - 10:00 AM",
      "10:15 AM - 11:15 AM", 
      "11:30 AM - 12:30 PM",
      "01:30 PM - 02:30 PM",
    ];
    
    const migratedTimetable = {};
    
    Object.keys(timetable).forEach(day => {
      migratedTimetable[day] = [];
      
      timetable[day].forEach(slot => {
        // Check if this is old format (time-based) and convert to new format
        const oldTimeIndex = oldTimeSlots.indexOf(slot.time);
        if (oldTimeIndex !== -1) {
          // Convert old time slot to lecture format
          const lectureNumber = oldTimeIndex + 1;
          const lectureName = `${lectureNumber}${getOrdinal(lectureNumber)} Lecture`;
          migratedTimetable[day].push({
            ...slot,
            time: lectureName
          });
        } else {
          // Already in new format or keep as is
          migratedTimetable[day].push(slot);
        }
      });
    });
    
    return migratedTimetable;
  };

  // Function to get all lectures that should be displayed (both filled and intentionally empty)
  const getDisplayLecturesFromTimetable = (timetable) => {
    if (!timetable) return [];
    
    const allLecturesInData = new Set();
    const maxLectureNumber = { value: 0 };
    
    // Find all lectures mentioned in the data and the highest lecture number
    Object.keys(timetable).forEach(day => {
      timetable[day].forEach(slot => {
        allLecturesInData.add(slot.time);
        // Extract lecture number to find the maximum
        const match = slot.time.match(/(\d+)/);
        if (match) {
          const lectureNum = parseInt(match[1]);
          maxLectureNumber.value = Math.max(maxLectureNumber.value, lectureNum);
        }
      });
    });
    
    // Create a complete list from 1st lecture to the highest found lecture
    const lectures = [];
    for (let i = 1; i <= maxLectureNumber.value; i++) {
      const lectureName = `${i}${getOrdinal(i)} Lecture`;
      lectures.push(lectureName);
    }
    
    return lectures;
  };

  // Determine the current day for highlighting
  const [currentDay, setCurrentDay] = useState('');
  
  // Set current day on client side only to avoid hydration mismatch
  useEffect(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = new Date().getDay();
    setCurrentDay(days[today]);
  }, []);

  // Fetch timetable data from API
  const fetchTimetable = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('student_token');
      
      if (!token) {
        setError('Please log in to view your timetable');
        setLoading(false);
        return;
      }

  const response = await fetch('http://localhost:5001/student/timetable/my-timetable', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        const { classId, className, schoolDays, timetable } = data.data;
        setClassInfo({ class_id: classId, class_name: className });
        setSchoolDays(schoolDays);
        
        // Migrate old time-based data to new lecture-based format
        const migratedTimetable = migrateTimetableData(timetable);
        setTimetable(migratedTimetable);
        
        // Get display lectures from migrated data
        const lectures = getDisplayLecturesFromTimetable(migratedTimetable);
        setDisplayLectures(lectures);
        setError(''); // Clear any previous errors
      } else {
        // Handle different types of errors with user-friendly messages
        const errorMessage = data.message || data.error || 'Failed to fetch timetable';
        setError(errorMessage);
        
        // Log the full error for debugging
        console.error('Timetable fetch error:', {
          status: response.status,
          statusText: response.statusText,
          data: data
        });
      }
    } catch (err) {
      console.error('Error fetching timetable:', err);
      setError('Failed to load timetable. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimetable();
  }, []);

  return (
    <AuthWrapper>
     <>
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-6">
        <Head>
          <title>Weekly Timetable</title>
          <meta name="description" content="Student Weekly Class Schedule" />
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <main className="max-w-6xl mx-auto bg-white rounded-2xl shadow-xl p-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-green-800">Weekly Timetable</h1>
              {classInfo.class_name && (
                <p className="text-lg text-gray-600 mt-2">
                  Class: <span className="font-semibold">{classInfo.class_name}</span> 
                  {classInfo.class_id && (
                    <span className="text-sm text-gray-500 ml-2">({classInfo.class_id})</span>
                  )}
                </p>
              )}
            </div>
            <button
              onClick={fetchTimetable}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
              <span className="ml-3 text-gray-600">Loading your timetable...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Timetable Not Available
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                    {error.includes('No timetable available for your class') && (
                      <p className="mt-2 text-xs text-red-600">
                         Contact your school to request a timetable for your class.
                      </p>
                    )}
                    {error.includes('No timetables available for your school') && (
                      <p className="mt-2 text-xs text-red-600">
                         Your school administrators need to create timetables in the system.
                      </p>
                    )}
                    {error.includes('school information is incomplete') && (
                      <p className="mt-2 text-xs text-red-600">
                         Please contact your school administrator to update your profile.
                      </p>
                    )}
                  </div>
                  <div className="mt-4">
                    <button
                      onClick={fetchTimetable}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!loading && !error && Object.keys(timetable).length > 0 && (
            <div className="overflow-x-auto">
              <div className="min-w-max">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-green-100">
                      <th className="p-4 text-left text-green-700 font-semibold w-48 min-w-48 border-r border-green-200">Lecture</th>
                      {schoolDays.map((day) => (
                        <th
                          key={day}
                          className={`p-4 text-center text-green-700 font-semibold w-48 min-w-48 border-r border-green-200 ${
                            day === currentDay ? 'bg-green-200' : ''
                          }`}
                        >
                          {day}
                          {day === currentDay && (
                            <span className="block text-xs text-green-600 font-normal">Today</span>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {displayLectures.map((lecture, index) => (
                      <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-green-50"}>
                        <td className="p-4 text-gray-700 font-medium w-48 min-w-48 border-r border-gray-200 bg-gray-50">{lecture}</td>
                        {schoolDays.map((day) => {
                          const slot = timetable[day]?.find((slot) => slot.time === lecture);
                        return (
                          <td
                            key={`${day}-${lecture}`}
                            className={`p-4 align-top w-48 min-w-48 border-r border-gray-200 ${
                              day === currentDay ? 'bg-green-50' : 'bg-white'
                            }`}
                          >
                            {slot ? (
                              <div className="space-y-2 text-left">
                                <p className="text-gray-800 font-medium text-sm">
                                  {slot.subject}
                                </p>
                                <p className="text-xs text-gray-600">
                                  {slot.teacher}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {slot.room}
                                </p>
                              </div>
                            ) : (
                              <p className="text-gray-400 text-sm">Free Period</p>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!loading && !error && Object.keys(timetable).length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg">
                <p>No timetable available</p>
                <p className="text-sm mt-2">Your class timetable hasn't been created yet.</p>
              </div>
            </div>
          )}
        </main>
      </div>
 </>
    </AuthWrapper>
  );
}