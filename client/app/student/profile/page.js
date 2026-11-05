"use client"
import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthWrapper from '../components/AuthWrapper';

export default function Profile() {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const token = localStorage.getItem("student_token");
        const studentUser = localStorage.getItem("student_user");
        
        if (!token) {
          router.push('/student/login');
          return;
        }

        let studentId;
        if (studentUser) {
          try {
            const userData = JSON.parse(studentUser);
            studentId = userData.id;
          } catch (parseError) {
            console.error('Error parsing student data:', parseError);
            localStorage.removeItem('student_user');
            localStorage.removeItem('student_token');
            router.push('/student/login');
            return;
          }
        }

        if (!studentId) {
          setError('Student ID not found');
          setLoading(false);
          return;
        }

  const response = await fetch(`http://localhost:5001/student/profile/getstudent/${studentId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        const result = await response.json();

        if (response.ok && result.success) {
          setStudent(result.data);
        } else {
          setError(result.message || 'Failed to fetch student data');
        }
      } catch (err) {
        console.error('Error fetching student data:', err);
        setError('Network error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [router]);
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-green-600 font-medium">Loading student profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <p className="text-red-600 font-medium mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg">
          <p className="text-gray-600">No student data available</p>
        </div>
      </div>
    );
  }

  return (
    <AuthWrapper>
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-6">
      <Head>
        <title>Student Profile</title>
        <meta name="description" content="Student Profile Page" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl p-8 transition-all duration-300 hover:shadow-3xl">
        {/* School Name Banner */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-500 -mx-8 -mt-8 mb-8 p-4 rounded-t-2xl">
          <h2 className="text-2xl font-bold text-white text-center tracking-wide">
            {student.school_id ? `School ID: ${student.school_id}` : 'Student Profile'}
          </h2>
        </div>

        <h1 className="text-4xl font-bold text-green-800 mb-8 text-center">Student Profile</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Profile Picture and Basic Info */}
          <div className="flex flex-col items-center space-y-4 p-6 bg-gradient-to-b from-green-50 to-white rounded-xl shadow-md">
            <div className="relative">
              <img
                src={student.stud_pic_url || "https://as1.ftcdn.net/v2/jpg/05/60/26/08/1000_F_560260880_O1V3Qm2cNO5HWjN66mBh2NrlPHNHOUxW.jpg"}
                alt="Profile Picture"
                className="w-40 h-40 rounded-full object-cover border-4 border-green-300 shadow-lg transition-transform duration-300 hover:scale-105"
              />
              <div className="absolute bottom-0 right-0 bg-green-500 w-4 h-4 rounded-full border-2 border-white"></div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">{student.student_name}</h2>
            <p className="text-md text-green-600 font-medium bg-green-50 px-4 py-1 rounded-full">ID: {student.student_id || student.id}</p>
          </div>

          {/* Personal Details */}
          <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-xl font-bold text-green-700 mb-6 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Personal Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2 p-4 bg-gray-50 rounded-lg transition-all duration-300 hover:bg-green-50">
                <p className="text-sm font-medium text-green-600">Father's Name</p>
                <p className="text-gray-800 font-semibold">{student.father_name}</p>
              </div>
              <div className="space-y-2 p-4 bg-gray-50 rounded-lg transition-all duration-300 hover:bg-green-50">
                <p className="text-sm font-medium text-green-600">Mother's Name</p>
                <p className="text-gray-800 font-semibold">{student.mother_name}</p>
              </div>
              <div className="space-y-2 p-4 bg-gray-50 rounded-lg transition-all duration-300 hover:bg-green-50">
                <p className="text-sm font-medium text-green-600">Date of Birth</p>
                <p className="text-gray-800 font-semibold">{student.dob}</p>
              </div>
              <div className="space-y-2 p-4 bg-gray-50 rounded-lg transition-all duration-300 hover:bg-green-50">
                <p className="text-sm font-medium text-green-600">Gender</p>
                <p className="text-gray-800 font-semibold">{student.gender}</p>
              </div>
              <div className="space-y-2 p-4 bg-gray-50 rounded-lg transition-all duration-300 hover:bg-green-50">
                <p className="text-sm font-medium text-green-600">Contact Number</p>
                <p className="text-gray-800 font-semibold">{student.contact_no || 'Not provided'}</p>
              </div>
              <div className="space-y-2 p-4 bg-gray-50 rounded-lg transition-all duration-300 hover:bg-green-50">
                <p className="text-sm font-medium text-green-600">Email</p>
                <p className="text-gray-800 font-semibold">{student.email}</p>
              </div>
            </div>
          </div>

          {/* Academic Details */}
          <div className="md:col-span-3 bg-white p-6 rounded-xl shadow-md mt-6">
            <h3 className="text-xl font-bold text-green-700 mb-6 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Academic Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-green-50 p-4 rounded-xl shadow-sm transition-all duration-300 hover:shadow-md hover:bg-green-100">
                <div className="flex items-center justify-between mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span className="text-2xl font-bold text-green-800">{student.class}</span>
                </div>
                <p className="text-sm font-medium text-green-600">Class</p>
              </div>
              <div className="bg-green-50 p-4 rounded-xl shadow-sm transition-all duration-300 hover:shadow-md hover:bg-green-100">
                <div className="flex items-center justify-between mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span className="text-2xl font-bold text-green-800">{student.section}</span>
                </div>
                <p className="text-sm font-medium text-green-600">Section</p>
              </div>
              <div className="bg-green-50 p-4 rounded-xl shadow-sm transition-all duration-300 hover:shadow-md hover:bg-green-100">
                <div className="flex items-center justify-between mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-2xl font-bold text-green-800">{student.admission_year || 'N/A'}</span>
                </div>
                <p className="text-sm font-medium text-green-600">Admission Year</p>
              </div>
              <div className="bg-green-50 p-4 rounded-xl shadow-sm transition-all duration-300 hover:shadow-md hover:bg-green-100">
                <p className="text-sm font-medium text-green-600 mb-2">Previous School</p>
                <p className="text-gray-800 font-semibold truncate" title={student.prev_school_name || 'Not provided'}>
                  {student.prev_school_name || 'Not provided'}
                </p>
              </div>
            </div>
          </div>

          {/* Additional Details */}
          <div className="md:col-span-3">
            <h3 className="text-lg font-semibold text-green-700 mb-4 mt-6">Additional Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Address</p>
                <p className="text-gray-800 font-medium">{student.address}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">National ID</p>
                <p className="text-gray-800 font-medium">{student.national_id}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
    </AuthWrapper>
  );
}