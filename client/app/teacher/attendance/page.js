"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import TeacherAuthWrapper from "../components/AuthWrapper";
import {
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  Filter,
  UserCheck,
  UserX,
  ChevronDown,
  ChevronUp,
  BookOpen,
  BarChart3,
  Eye,
  Search
} from "lucide-react";

const API_BASE = "http://localhost:5001/teacher";

const TeacherAttendancePage = () => {
  const [mounted, setMounted] = useState(false);
  const [students, setStudents] = useState([]);
  const [teacherProfile, setTeacherProfile] = useState(null);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [availableSections, setAvailableSections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    subject: "",
    class: "",
    section: ""
  });
  const [showClassAttendance, setShowClassAttendance] = useState(false);
  const [classStudents, setClassStudents] = useState([]);
  const [showFilters, setShowFilters] = useState(true);
  const [showViewAttendance, setShowViewAttendance] = useState(false);
  const [viewFilters, setViewFilters] = useState({
    class: "",
    subject: "",
    start_date: "",
    end_date: ""
  });
  const [attendanceStats, setAttendanceStats] = useState(null);

  const router = useRouter();

  // Handle mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Check authentication
  useEffect(() => {
    if (!mounted) return;
    
    const token = localStorage.getItem("teacher_token");
    if (!token) {
      router.push("/teacher/login");
      return;
    }
    fetchData();
  }, [mounted, router]);

  // Fetch all data
  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchTeacherProfile(),
        fetchInitialData()
      ]);
    } catch (error) {
      setError("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  // Fetch teacher profile
  const fetchTeacherProfile = async () => {
    try {
      const token = localStorage.getItem("teacher_token");
      const response = await fetch(`${API_BASE}/profile`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) throw new Error("Failed to fetch teacher profile");
      
      const data = await response.json();
      setTeacherProfile(data.data);
    } catch (error) {
      console.error("Failed to fetch teacher profile:", error);
    }
  };

  // Fetch initial data to populate dropdowns
  const fetchInitialData = async () => {
    try {
      const token = localStorage.getItem("teacher_token");
      const response = await fetch(`${API_BASE}/students`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) throw new Error("Failed to fetch initial data");
      
      const data = await response.json();
      const result = data.data || {};
      
      setAvailableClasses(result.availableClasses || []);
      setAvailableSubjects(result.availableSubjects || []);
      setAvailableSections(result.availableSections || []);
      setStudents(result.students || []);
    } catch (error) {
      console.error("Failed to fetch initial data:", error);
    }
  };

  // Handle filter change
  const handleFilterChange = async (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    // Clear attendance when filters change
    setShowClassAttendance(false);
    setClassStudents([]);
    
    // If class changed, update available sections
    if (key === 'class' && value) {
      const filteredStudents = students.filter(s => s.class === value);
      const sections = [...new Set(filteredStudents.map(s => s.section))].filter(Boolean);
      setAvailableSections(sections);
      
      // Reset section if it's not available in the new class
      if (newFilters.section && !sections.includes(newFilters.section)) {
        newFilters.section = '';
        setFilters(newFilters);
      }
    }
  };

  // Handle search button click
  const handleSearchStudents = () => {
    if (!filters.class || !filters.subject) {
      setError("Please select both class and subject before searching");
      return;
    }
    
    loadStudentsForAttendance(filters.class, filters.section, filters.subject);
  };

  // Handle view attendance filters change
  const handleViewFilterChange = (key, value) => {
    setViewFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Load attendance statistics
  const loadAttendanceStats = async () => {
    if (!viewFilters.class || !viewFilters.subject) {
      setError("Please select both class and subject to view attendance statistics");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("teacher_token");
      
      const queryParams = new URLSearchParams();
      if (viewFilters.start_date) queryParams.append('start_date', viewFilters.start_date);
      if (viewFilters.end_date) queryParams.append('end_date', viewFilters.end_date);

      const response = await fetch(
        `${API_BASE}/attendance/class-stats/${viewFilters.class}/${viewFilters.subject}?${queryParams}`,
        {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch attendance statistics");
      }
      
      const data = await response.json();
      setAttendanceStats(data.data);
      
    } catch (error) {
      console.error("Failed to load attendance statistics:", error);
      setError(`Failed to load attendance statistics: ${error.message}`);
      setAttendanceStats(null);
    } finally {
      setLoading(false);
    }
  };

  // Load students for attendance marking
  const loadStudentsForAttendance = async (selectedClass, selectedSection, selectedSubject) => {
    if (!selectedClass || !selectedSubject) {
      setClassStudents([]);
      setShowClassAttendance(false);
      return;
    }

    try {
      const token = localStorage.getItem("teacher_token");
      const response = await fetch(`${API_BASE}/students/${selectedClass}/${selectedSubject}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch students");
      }
      
      const data = await response.json();
      let fetchedStudents = data.data || [];

      // Filter by section if specified
      if (selectedSection) {
        fetchedStudents = fetchedStudents.filter(student => student.section === selectedSection);
      }

      // Check if attendance already exists for today (check just the first student)
      const today = new Date().toISOString().split('T')[0];
      
      if (fetchedStudents.length > 0) {
        try {
          const firstStudentId = fetchedStudents[0].id;
          const existingAttendanceQuery = new URLSearchParams({
            student_id: firstStudentId,
            subject: selectedSubject,
            date: today
          });

          const attendanceResponse = await fetch(`${API_BASE}/attendance?${existingAttendanceQuery}`, {
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json"
            }
          });

          if (attendanceResponse.ok) {
            const attendanceData = await attendanceResponse.json();
            const existingRecords = attendanceData.data || [];

            if (existingRecords.length > 0) {
              // Show popup alert for attendance already marked
              alert(`⚠️ ATTENDANCE ALREADY MARKED\n\nAttendance for Class ${selectedClass}${selectedSection ? `-${selectedSection}` : ''} has already been marked today (${today}) for ${selectedSubject}.\n\nYou can only mark attendance once per day for each class.`);
              
              setClassStudents([]);
              setShowClassAttendance(false);
              return;
            }
          }
        } catch (attendanceError) {
          console.warn("Could not check existing attendance:", attendanceError);
          // Continue with normal flow if attendance check fails
        }
      }

      const studentRecords = fetchedStudents.map(student => ({
        student_id: student.id,
        student_name: student.student_name,
        class: student.class,
        section: student.section,
        status: "Present",
        isPresent: true
      }));

      setClassStudents(studentRecords);
      setShowClassAttendance(studentRecords.length > 0);
      
    } catch (error) {
      console.error("Failed to load students for attendance:", error);
      setError(`Failed to load students: ${error.message}`);
      setClassStudents([]);
      setShowClassAttendance(false);
    }
  };

  // Handle student attendance change
  const handleAttendanceChange = (studentId, isPresent) => {
    const updatedStudents = classStudents.map(student =>
      student.student_id === studentId 
        ? { 
            ...student, 
            status: isPresent ? "Present" : "Absent",
            isPresent: isPresent 
          } 
        : student
    );
    
    setClassStudents(updatedStudents);
  };

  // Mark all present
  const markAllPresent = () => {
    const updatedStudents = classStudents.map(student => ({
      ...student,
      status: "Present",
      isPresent: true
    }));
    setClassStudents(updatedStudents);
  };

  // Mark all absent
  const markAllAbsent = () => {
    const updatedStudents = classStudents.map(student => ({
      ...student,
      status: "Absent",
      isPresent: false
    }));
    setClassStudents(updatedStudents);
  };

  // Save attendance
  const saveAttendance = async () => {
    if (!filters.subject || !filters.class) {
      setError("Please select subject and class before saving attendance");
      return;
    }

    if (classStudents.length === 0) {
      setError("No students found to mark attendance for");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("teacher_token");
      
      const attendanceRecords = classStudents.map(student => ({
        student_id: student.student_id,
        subject: filters.subject,
        date: new Date().toISOString().split('T')[0],
        status: student.status,
        class_id: `${filters.class}${filters.section || ''}`
      }));

      const response = await fetch(`${API_BASE}/attendance/bulk-mark`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          attendance_records: attendanceRecords
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.message || "Failed to save attendance";
        
        // Check if it's an attendance already marked error
        if (errorMessage.includes("already been marked") || errorMessage.includes("once per day")) {
          // Show a popup alert for attendance conflicts
          alert(`⚠️ ATTENDANCE CONFLICT\n\n${errorMessage}\n\nPlease check the date and try again.`);
          return;
        } else {
          // For other errors, show in the error state
          throw new Error(errorMessage);
        }
      }

      // Show success popup
      alert(`✅ SUCCESS\n\nAttendance saved successfully for ${classStudents.length} students!`);
      
      // Clear the form
      setShowClassAttendance(false);
      setClassStudents([]);
      setFilters({
        subject: "",
        class: "",
        section: ""
      });

    } catch (error) {
      console.error("Failed to save attendance:", error);
      
      // Check if it's an attendance conflict error that should be shown as popup
      if (error.message && (error.message.includes("already been marked") || error.message.includes("once per day"))) {
        // Show popup for attendance conflicts
        alert(`⚠️ ATTENDANCE CONFLICT\n\n${error.message}\n\nPlease check the date and try again.`);
        return;
      } else if (error.message && error.message.includes("Internal server error")) {
        // Don't show generic internal server errors to users
        console.error("Server error occurred:", error);
        setError("An unexpected error occurred. Please try again or contact support if the problem persists.");
      } else {
        // Show other specific errors
        setError(`Failed to save attendance: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      subject: "",
      class: "",
      section: ""
    });
    setShowClassAttendance(false);
    setClassStudents([]);
  };

  // Clear view filters
  const clearViewFilters = () => {
    setViewFilters({
      class: "",
      subject: "",
      start_date: "",
      end_date: ""
    });
    setAttendanceStats(null);
  };

  // Don't render until mounted
  if (!mounted) {
    return null;
  }

  if (loading && !teacherProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading attendance data...</p>
        </div>
      </div>
    );
  }

  return (
    <TeacherAuthWrapper>
      <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-green-100 p-2 rounded-lg">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Attendance Management</h1>
              <p className="text-gray-600">Mark attendance for your classes</p>
              {teacherProfile && (
                <p className="text-sm text-gray-500">
                  Teacher: {teacherProfile.name} • Subject Specialty: {teacherProfile.subject_specialty}
                </p>
              )}
            </div>
          </div>
          
          {/* Error Display */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <XCircle className="w-5 h-5 text-red-600 mr-2" />
                <span className="text-red-800">{error}</span>
                <button
                  onClick={() => setError(null)}
                  className="ml-auto text-red-600 hover:text-red-800"
                >
                  ×
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Class & Subject Assignments Overview */}
        {teacherProfile && teacherProfile.class_assigned && (
          <div className="bg-white rounded-xl shadow-sm mb-6 border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-medium text-gray-900 flex items-center">
                <BookOpen className="w-5 h-5 text-gray-500 mr-2" />
                Your Assigned Classes
              </h3>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teacherProfile.class_assigned.split(',').map((cls, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded-lg">
                    <div className="font-medium text-gray-900">Class {cls.trim()}</div>
                    <div className="text-sm text-gray-600">{teacherProfile.subject_specialty}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex space-x-1 mb-6">
          <button
            onClick={() => {
              setShowViewAttendance(false);
              setShowClassAttendance(false);
              setAttendanceStats(null);
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              !showViewAttendance 
                ? 'bg-green-100 text-green-700 border border-green-200' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            Mark Attendance
          </button>
          <button
            onClick={() => {
              setShowViewAttendance(true);
              setShowClassAttendance(false);
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              showViewAttendance 
                ? 'bg-green-100 text-green-700 border border-green-200' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            View Attendance
          </button>
        </div>

        {!showViewAttendance ? (
          // Mark Attendance Section
          <>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm mb-6 border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-between w-full text-left"
            >
              <div className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-gray-500" />
                <span className="font-medium text-gray-900">Select Class & Subject</span>
              </div>
              {showFilters ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </button>
          </div>

          {showFilters && (
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Class *</label>
                  <select
                    value={filters.class}
                    onChange={(e) => handleFilterChange('class', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Select Class</option>
                    {availableClasses.map(cls => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                  <select
                    value={filters.subject}
                    onChange={(e) => handleFilterChange('subject', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Select Subject</option>
                    {availableSubjects.map(subject => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Section (Optional)</label>
                  <select
                    value={filters.section}
                    onChange={(e) => handleFilterChange('section', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">All Sections</option>
                    {availableSections.map(section => (
                      <option key={section} value={section}>{section}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4 flex space-x-3">
                <button
                  onClick={handleSearchStudents}
                  disabled={!filters.class || !filters.subject || loading}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Users className="w-4 h-4" />
                  )}
                  <span>{loading ? 'Searching...' : 'Search Students'}</span>
                </button>
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Attendance Marking Section */}
        {showClassAttendance && classStudents.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Mark Attendance - Class {filters.class}{filters.section && `-${filters.section}`}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {classStudents.length} students • Subject: {filters.subject} • Date: {new Date().toLocaleDateString()}
                  </p>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={markAllPresent}
                    className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors flex items-center space-x-2"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Mark All Present</span>
                  </button>
                  <button
                    onClick={markAllAbsent}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center space-x-2"
                  >
                    <UserX className="w-4 h-4" />
                    <span>Mark All Absent</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Class
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Section
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Attendance
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {classStudents.map((student) => (
                    <tr key={student.student_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center mr-3">
                            <span className="text-sm font-medium text-gray-700">
                              {student.student_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{student.student_name}</div>
                            <div className="text-sm text-gray-500">ID: {student.student_id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.class}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.section || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-4">
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              name={`attendance-${student.student_id}`}
                              checked={student.isPresent}
                              onChange={() => handleAttendanceChange(student.student_id, true)}
                              className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                            />
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <span className="text-sm text-green-700">Present</span>
                          </label>
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              name={`attendance-${student.student_id}`}
                              checked={!student.isPresent}
                              onChange={() => handleAttendanceChange(student.student_id, false)}
                              className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
                            />
                            <XCircle className="w-5 h-5 text-red-600" />
                            <span className="text-sm text-red-700">Absent</span>
                          </label>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary and Save */}
            <div className="p-6 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex space-x-6">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-gray-700">
                      Present: {classStudents.filter(s => s.isPresent).length}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <XCircle className="w-5 h-5 text-red-600" />
                    <span className="text-sm text-gray-700">
                      Absent: {classStudents.filter(s => !s.isPresent).length}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-gray-600" />
                    <span className="text-sm text-gray-700">
                      Total: {classStudents.length}
                    </span>
                  </div>
                </div>
                <button
                  onClick={saveAttendance}
                  disabled={loading}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  <span>{loading ? 'Saving...' : 'Save Attendance'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Instructions when no class is selected */}
        {!showClassAttendance && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="bg-green-100 p-4 rounded-full w-16 h-16 mx-auto mb-4">
              <Calendar className="w-8 h-8 text-green-600 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Mark Attendance</h3>
            <p className="text-gray-600 mb-4">
              Select a class and subject from the filters above, then click "Search Students" to start marking attendance.
            </p>
            <div className="text-sm text-gray-500">
              <p>• You can only mark attendance for classes assigned to you</p>
              <p>• Section selection is optional - leave blank to include all sections</p>
              <p>• Click the "Search Students" button after selecting your filters</p>
            </div>
          </div>
        )}
        </>
        ) : (
          // View Attendance Section
          <>
            {/* View Attendance Filters */}
            <div className="bg-white rounded-xl shadow-sm mb-6 border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-medium text-gray-900 flex items-center">
                  <BarChart3 className="w-5 h-5 text-gray-500 mr-2" />
                  View Class Attendance Statistics
                </h3>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Class *</label>
                    <select
                      value={viewFilters.class}
                      onChange={(e) => handleViewFilterChange('class', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="">Select Class</option>
                      {availableClasses.map(cls => (
                        <option key={cls} value={cls}>{cls}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                    <select
                      value={viewFilters.subject}
                      onChange={(e) => handleViewFilterChange('subject', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="">Select Subject</option>
                      {availableSubjects.map(subject => (
                        <option key={subject} value={subject}>{subject}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={viewFilters.start_date}
                      onChange={(e) => handleViewFilterChange('start_date', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      value={viewFilters.end_date}
                      onChange={(e) => handleViewFilterChange('end_date', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="mt-4 flex space-x-3">
                  <button
                    onClick={loadAttendanceStats}
                    disabled={!viewFilters.class || !viewFilters.subject || loading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                    <span>{loading ? 'Loading...' : 'View Statistics'}</span>
                  </button>
                  <button
                    onClick={clearViewFilters}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>

            {/* Attendance Statistics Display */}
            {attendanceStats && (
              <div className="space-y-6">
                {/* Class Overview */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Class {attendanceStats.class_info.class} - {attendanceStats.class_info.subject}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Section: {attendanceStats.class_info.section} • Teacher: {attendanceStats.class_info.teacher_name}
                    </p>
                  </div>
                  
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-center">
                          <Users className="w-8 h-8 text-blue-600 mr-3" />
                          <div>
                            <p className="text-sm font-medium text-blue-900">Total Students</p>
                            <p className="text-2xl font-bold text-blue-600">{attendanceStats.class_statistics.total_students}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="flex items-center">
                          <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
                          <div>
                            <p className="text-sm font-medium text-green-900">Total Present</p>
                            <p className="text-2xl font-bold text-green-600">{attendanceStats.class_statistics.total_present}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-red-50 p-4 rounded-lg">
                        <div className="flex items-center">
                          <XCircle className="w-8 h-8 text-red-600 mr-3" />
                          <div>
                            <p className="text-sm font-medium text-red-900">Total Absent</p>
                            <p className="text-2xl font-bold text-red-600">{attendanceStats.class_statistics.total_absent}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <div className="flex items-center">
                          <BarChart3 className="w-8 h-8 text-purple-600 mr-3" />
                          <div>
                            <p className="text-sm font-medium text-purple-900">Class Average</p>
                            <p className="text-2xl font-bold text-purple-600">{attendanceStats.class_statistics.class_average_attendance || 0}%</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Student Attendance List */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Student Attendance Percentages</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Individual attendance percentages for each student
                    </p>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Student
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Class/Section
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Present
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Absent
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total Records
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Attendance %
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {attendanceStats.students.map((student) => (
                          <tr key={student.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center mr-3">
                                  <span className="text-sm font-medium text-gray-700">
                                    {student.student_name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{student.student_name}</div>
                                  <div className="text-sm text-gray-500">ID: {student.student_id}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {student.class}{student.section && `-${student.section}`}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {student.present_count}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                {student.absent_count}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                              {student.total_records}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <div className="flex items-center justify-center">
                                <div className="flex items-center space-x-2">
                                  <div className="w-16 bg-gray-200 rounded-full h-2">
                                    <div 
                                      className={`h-2 rounded-full ${
                                        student.attendance_percentage >= 80 ? 'bg-green-500' :
                                        student.attendance_percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                      }`}
                                      style={{ width: `${Math.min(student.attendance_percentage, 100)}%` }}
                                    ></div>
                                  </div>
                                  <span className={`text-sm font-medium ${
                                    student.attendance_percentage >= 80 ? 'text-green-600' :
                                    student.attendance_percentage >= 60 ? 'text-yellow-600' : 'text-red-600'
                                  }`}>
                                    {student.attendance_percentage}%
                                  </span>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Instructions when no data is loaded */}
            {!attendanceStats && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                <div className="bg-blue-100 p-4 rounded-full w-16 h-16 mx-auto mb-4">
                  <BarChart3 className="w-8 h-8 text-blue-600 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">View Attendance Statistics</h3>
                <p className="text-gray-600 mb-4">
                  Select a class and subject above, then click "View Statistics" to see student attendance percentages.
                </p>
                <div className="text-sm text-gray-500">
                  <p>• Choose date range to filter attendance records (optional)</p>
                  <p>• View individual student attendance percentages</p>
                  <p>• See overall class attendance statistics</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
    </TeacherAuthWrapper>
  );
};

export default TeacherAttendancePage;
