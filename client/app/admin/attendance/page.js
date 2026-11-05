"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AuthWrapper from "../components/AuthWrapper";
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
  BarChart3,
  TrendingUp,
  Eye,
  BookOpen,
  School,
  PieChart
} from "lucide-react";

const API_BASE = "http://localhost:5001/admin/attendance";

const AttendancePage = () => {
  const [isHydrated, setIsHydrated] = useState(false);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    subject: "",
    teacher_id: "",
    class: "",
    section: ""
  });
  const [showClassAttendance, setShowClassAttendance] = useState(false);
  const [classStudents, setClassStudents] = useState([]);
  const [classAttendanceData, setClassAttendanceData] = useState({
    subject: "",
    date: new Date().toISOString().split('T')[0],
    teacher_id: "",
    class: "",
    section: "",
    student_records: []
  });
  const [showFilters, setShowFilters] = useState(true);
  
  // View Attendance States
  const [showViewAttendance, setShowViewAttendance] = useState(false);
  const [viewType, setViewType] = useState('subject'); // 'subject' or 'overall'
  const [viewFilters, setViewFilters] = useState({
    subject: "",
    class: "",
    section: ""
  });
  const [overallViewFilters, setOverallViewFilters] = useState({
    class: "",
    section: ""
  });
  const [attendanceStats, setAttendanceStats] = useState([]);
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [studentWiseAttendance, setStudentWiseAttendance] = useState([]);
  const [overallStudentAttendance, setOverallStudentAttendance] = useState([]);
  const [overallRecentAttendance, setOverallRecentAttendance] = useState([]);
  const [attendanceOverview, setAttendanceOverview] = useState({
    totalStudents: 0,
    averageAttendance: 0,
    classWiseStats: [],
    subjectWiseStats: []
  });
  const [overallAttendanceOverview, setOverallAttendanceOverview] = useState({
    totalStudents: 0,
    averageAttendance: 0,
    totalClasses: 0,
    totalPresent: 0,
    totalAbsent: 0
  });

  const router = useRouter();

  // Handle hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchData();
  }, []);

  // Fetch all data
  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchStudents(),
        fetchTeachers()
      ]);
    } catch (error) {
      setError("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  // Fetch students
  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5001/admin/student/getallstudents", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) throw new Error("Failed to fetch students");
      
      const data = await response.json();
      // Ensure we always set an array
      const studentsArray = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
      setStudents(studentsArray);
    } catch (error) {
      console.error("Failed to fetch students:", error);
      setStudents([]); // Ensure students is always an array on error
    }
  };

  // Fetch teachers
  const fetchTeachers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5001/admin/teacher/getALL", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) throw new Error("Failed to fetch teachers");
      
      const data = await response.json();
      // Ensure we always set an array
      const teachersArray = Array.isArray(data) ? data : (data?.data && Array.isArray(data.data)) ? data.data : [];
      setTeachers(teachersArray);
    } catch (error) {
      console.error("Failed to fetch teachers:", error);
      setTeachers([]); // Ensure teachers is always an array on error
    }
  };

  // Fetch attendance statistics for view section
  const fetchAttendanceStats = async (filterParams = {}) => {
    try {
      const token = localStorage.getItem("token");
      const queryParams = new URLSearchParams();
      
      Object.keys(filterParams).forEach(key => {
        if (filterParams[key]) {
          queryParams.append(key, filterParams[key]);
        }
      });

      const response = await fetch(`${API_BASE}/stats?${queryParams}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) throw new Error("Failed to fetch attendance stats");
      
      const data = await response.json();
      return data.data || {
        total_records: 0,
        present_count: 0,
        absent_count: 0,
        attendance_percentage: 0
      };
    } catch (error) {
      console.error("Failed to fetch attendance stats:", error);
      return {
        total_records: 0,
        present_count: 0,
        absent_count: 0,
        attendance_percentage: 0
      };
    }
  };

  // Fetch recent attendance data (last 5 dates)
  const fetchRecentAttendance = async (filterParams = {}) => {
    try {
      const token = localStorage.getItem("token");
      const queryParams = new URLSearchParams();
      
      Object.keys(filterParams).forEach(key => {
        if (filterParams[key]) {
          queryParams.append(key, filterParams[key]);
        }
      });

      // Add limit for recent records
      queryParams.append('limit', '50');
      queryParams.append('orderBy', 'date');
      queryParams.append('order', 'DESC');

      const response = await fetch(`${API_BASE}?${queryParams}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) throw new Error("Failed to fetch recent attendance");
      
      const data = await response.json();
      const records = data.data || [];
      
      // Group by date and get last 5 dates
      const dateGroups = {};
      records.forEach(record => {
        const date = record.date.split('T')[0];
        if (!dateGroups[date]) {
          dateGroups[date] = [];
        }
        dateGroups[date].push(record);
      });

      const sortedDates = Object.keys(dateGroups).sort((a, b) => new Date(b) - new Date(a)).slice(0, 5);
      
      return sortedDates.map(date => ({
        date,
        records: dateGroups[date],
        totalStudents: dateGroups[date].length,
        presentCount: dateGroups[date].filter(r => r.status === 'Present').length,
        attendancePercentage: Math.round((dateGroups[date].filter(r => r.status === 'Present').length / dateGroups[date].length) * 100)
      }));
    } catch (error) {
      console.error("Failed to fetch recent attendance:", error);
      return [];
    }
  };

  // Fetch student-wise attendance details
  const fetchStudentWiseAttendance = async (filterParams = {}) => {
    try {
      const token = localStorage.getItem("token");
      const queryParams = new URLSearchParams();
      
      Object.keys(filterParams).forEach(key => {
        if (filterParams[key]) {
          queryParams.append(key, filterParams[key]);
        }
      });

      const response = await fetch(`${API_BASE}?${queryParams}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) throw new Error("Failed to fetch student attendance");
      
      const data = await response.json();
      const records = data.data || [];
      
      // Group by student and calculate individual stats
      const studentGroups = {};
      records.forEach(record => {
        const studentId = record.student_id;
        if (!studentGroups[studentId]) {
          studentGroups[studentId] = {
            student_id: studentId,
            student_name: record.student_name,
            class: record.class,
            section: record.section,
            records: [],
            totalRecords: 0,
            presentCount: 0,
            absentCount: 0,
            attendancePercentage: 0
          };
        }
        studentGroups[studentId].records.push(record);
        studentGroups[studentId].totalRecords++;
        if (record.status && (record.status === 'Present' || record.status.toLowerCase() === 'present')) {
          studentGroups[studentId].presentCount++;
        } else {
          studentGroups[studentId].absentCount++;
        }
      });

      // Calculate percentages
      Object.values(studentGroups).forEach(student => {
        student.attendancePercentage = student.totalRecords > 0 
          ? Math.round((student.presentCount / student.totalRecords) * 100)
          : 0;
      });

      return Object.values(studentGroups).sort((a, b) => a.student_name.localeCompare(b.student_name));
    } catch (error) {
      console.error("Failed to fetch student-wise attendance:", error);
      return [];
    }
  };

  // Load attendance view data
  const loadAttendanceView = async () => {
    if (!viewFilters.subject || !viewFilters.class) {
      setAttendanceStats([]);
      setRecentAttendance([]);
      setStudentWiseAttendance([]);
      setAttendanceOverview({
        totalStudents: 0,
        averageAttendance: 0,
        classWiseStats: [],
        subjectWiseStats: []
      });
      return;
    }

    setLoading(true);
    try {
      // Fetch overall stats
      const overallStats = await fetchAttendanceStats(viewFilters);
      
      // Fetch recent attendance
      const recentData = await fetchRecentAttendance(viewFilters);
      setRecentAttendance(recentData);

      // Fetch student-wise attendance
      const studentData = await fetchStudentWiseAttendance(viewFilters);
      setStudentWiseAttendance(studentData);

      // Calculate class-wise and section-wise stats
      const classWisePromises = [];
      const sectionWisePromises = [];

      if (viewFilters.class && !viewFilters.section) {
        // Get all sections for this class
        const classSections = [...new Set(students
          .filter(s => s.class === viewFilters.class)
          .map(s => s.section))];
        
        for (const section of classSections) {
          const sectionStats = await fetchAttendanceStats({
            ...viewFilters,
            section
          });
          sectionWisePromises.push({
            section,
            ...sectionStats
          });
        }
      }

      // Get subject-wise stats for this class
      const subjectStats = await fetchAttendanceStats({
        class: viewFilters.class,
        section: viewFilters.section
      });

      setAttendanceStats(sectionWisePromises);
      setAttendanceOverview({
        totalStudents: students.filter(s => 
          s.class === viewFilters.class && 
          (!viewFilters.section || s.section === viewFilters.section)
        ).length,
        averageAttendance: overallStats.attendance_percentage,
        classWiseStats: sectionWisePromises,
        subjectWiseStats: [{ subject: viewFilters.subject, ...overallStats }]
      });

    } catch (error) {
      console.error("Failed to load attendance view:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch overall attendance stats (without subject filter)
  const fetchOverallAttendanceStats = async (filterParams = {}) => {
    try {
      const token = localStorage.getItem("token");
      const queryParams = new URLSearchParams();
      
      // Only add class and section filters for overall stats
      if (filterParams.class) queryParams.append('class', filterParams.class);
      if (filterParams.section) queryParams.append('section', filterParams.section);

      const response = await fetch(`${API_BASE}/stats?${queryParams}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) throw new Error("Failed to fetch overall attendance stats");
      
      const data = await response.json();
      return {
        totalStudents: students.filter(s => 
          s.class === filterParams.class && 
          (!filterParams.section || s.section === filterParams.section)
        ).length,
        averageAttendance: data.data?.attendance_percentage || 0,
        totalClasses: data.data?.total_records || 0,
        totalPresent: data.data?.present_count || 0,
        totalAbsent: data.data?.absent_count || 0
      };
    } catch (error) {
      console.error("Failed to fetch overall attendance stats:", error);
      return {
        totalStudents: 0,
        averageAttendance: 0,
        totalClasses: 0,
        totalPresent: 0,
        totalAbsent: 0
      };
    }
  };

  // Fetch overall student-wise attendance (without subject filter)
  const fetchOverallStudentAttendance = async (filterParams = {}) => {
    try {
      const token = localStorage.getItem("token");
      const queryParams = new URLSearchParams();
      
      // Only add class and section filters
      if (filterParams.class) queryParams.append('class', filterParams.class);
      if (filterParams.section) queryParams.append('section', filterParams.section);

      const response = await fetch(`${API_BASE}?${queryParams}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) throw new Error("Failed to fetch overall student attendance");
      
      const data = await response.json();
      const records = data.data || [];
      
      
      
      // Group by student and calculate overall stats across all subjects
      const studentGroups = {};
      records.forEach(record => {
        const studentId = record.student_id;
        if (!studentGroups[studentId]) {
          studentGroups[studentId] = {
            student_id: studentId,
            student_name: record.student_name,
            class: record.class,
            section: record.section,
            records: [],
            totalRecords: 0,
            presentCount: 0,
            absentCount: 0,
            attendancePercentage: 0
          };
        }
        studentGroups[studentId].records.push(record);
        studentGroups[studentId].totalRecords++;
        // Case-insensitive status comparison - backend uses 'Present'/'Absent'
        if (record.status && (record.status === 'Present' || record.status.toLowerCase() === 'present')) {
          studentGroups[studentId].presentCount++;
        } else {
          studentGroups[studentId].absentCount++;
        }
      });

      // Calculate percentages and sort
      const studentAttendance = Object.values(studentGroups).map(student => ({
        ...student,
        attendancePercentage: student.totalRecords > 0 
          ? ((student.presentCount / student.totalRecords) * 100).toFixed(1)
          : 0
      })).sort((a, b) => b.attendancePercentage - a.attendancePercentage);

      return studentAttendance;
    } catch (error) {
      console.error("Failed to fetch overall student attendance:", error);
      return [];
    }
  };

  // Fetch overall recent attendance (without subject filter)
  const fetchOverallRecentAttendance = async (filterParams = {}) => {
    try {
      const token = localStorage.getItem("token");
      const queryParams = new URLSearchParams();
      
      // Only add class and section filters
      if (filterParams.class) queryParams.append('class', filterParams.class);
      if (filterParams.section) queryParams.append('section', filterParams.section);
      
      // Add limit for recent records
      queryParams.append('limit', '50');
      queryParams.append('orderBy', 'date');
      queryParams.append('order', 'DESC');

      const response = await fetch(`${API_BASE}?${queryParams}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) throw new Error("Failed to fetch overall recent attendance");
      
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error("Failed to fetch overall recent attendance:", error);
      return [];
    }
  };

  // Handle view filter changes
  const handleViewFilterChange = (key, value) => {
    const newFilters = { ...viewFilters, [key]: value };
    setViewFilters(newFilters);
    // Remove automatic loading - now triggered by search button
  };

  // Handle overall view filter changes
  const handleOverallViewFilterChange = (key, value) => {
    const newFilters = { ...overallViewFilters, [key]: value };
    setOverallViewFilters(newFilters);
    // Remove automatic loading - now triggered by search button
  };

  // Load overall attendance view
  const loadOverallAttendanceView = async () => {
    try {
      setLoading(true);
      
      // Fetch overall attendance stats
      const statsData = await fetchOverallAttendanceStats(overallViewFilters);
      const studentData = await fetchOverallStudentAttendance(overallViewFilters);
      const recentData = await fetchOverallRecentAttendance(overallViewFilters);
      
      setOverallAttendanceOverview(statsData);
      setOverallStudentAttendance(studentData);
      setOverallRecentAttendance(recentData);
      
    } catch (error) {
      setError("Failed to load overall attendance view");
      console.error("Failed to load overall attendance view:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle class/section filter change for main table
  const handleClassFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    // Check if all required filters are selected
    const allFiltersSelected = newFilters.subject && 
                              newFilters.teacher_id && 
                              newFilters.class && 
                              newFilters.section;
    
    if (allFiltersSelected) {
      loadStudentsForAttendance(newFilters.class, newFilters.section);
      // Update class attendance data with filter values
      setClassAttendanceData(prev => ({
        ...prev,
        subject: newFilters.subject,
        teacher_id: newFilters.teacher_id,
        class: newFilters.class,
        section: newFilters.section
      }));
    } else {
      setClassStudents([]);
      setShowClassAttendance(false);
    }
  };

  // Load students for attendance marking in main table
  const loadStudentsForAttendance = (selectedClass, selectedSection) => {
    if (!selectedClass) {
      setClassStudents([]);
      setShowClassAttendance(false);
      return;
    }

    const filteredStudents = students.filter(student => {
      if (selectedClass && student.class !== selectedClass) return false;
      if (selectedSection && student.section !== selectedSection) return false;
      return true;
    });

    const studentRecords = filteredStudents.map(student => ({
      student_id: student.id,
      student_name: student.student_name,
      class: student.class,
      section: student.section,
      status: "Present",
      isPresent: true
    }));

    setClassStudents(studentRecords);
    setShowClassAttendance(filteredStudents.length > 0);
    
    // Update class attendance data
    setClassAttendanceData(prev => ({
      ...prev,
      class: selectedClass || "",
      section: selectedSection || "",
      student_records: studentRecords
    }));
  };

  // Handle student checkbox change in main table
  const handleMainTableCheckboxChange = (studentId, isChecked) => {
    const updatedStudents = classStudents.map(student =>
      student.student_id === studentId 
        ? { 
            ...student, 
            status: isChecked ? "Present" : "Absent",
            isPresent: isChecked 
          } 
        : student
    );
    
    setClassStudents(updatedStudents);
    setClassAttendanceData(prev => ({
      ...prev,
      student_records: updatedStudents
    }));
  };

  // Save class attendance from main table
  const saveClassAttendance = async () => {
    if (!classAttendanceData.subject || !classAttendanceData.teacher_id) {
      alert("Please select subject and teacher from filters above before saving attendance.");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const attendanceRecords = classAttendanceData.student_records.map(record => ({
        student_id: record.student_id,
        subject: classAttendanceData.subject,
        date: classAttendanceData.date,
        status: record.status,
        teacher_id: classAttendanceData.teacher_id
      }));

      const response = await fetch(`${API_BASE}/bulk-create`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ attendance_records: attendanceRecords })
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 400 && (
          data.message.includes('already been marked') || 
          data.message.includes('once per day') ||
          data.error === 'DUPLICATE_ATTENDANCE' ||
          data.message.includes('already exists')
        )) {
          alert(data.message);
          return;
        }
        throw new Error(data.message || "Failed to save attendance");
      }

      // Check if there were any duplicate errors in bulk response
      if (data.data && data.data.error_count > 0) {
        const duplicateErrors = data.data.failed_records.filter(record => 
          record.error.includes('DUPLICATE_ATTENDANCE') || 
          record.error.includes('already exists')
        );
        
        if (duplicateErrors.length > 0) {
          alert(`Attendance has already been marked for this class on ${classAttendanceData.date} for ${classAttendanceData.subject}. You can only mark attendance once per day for each class.`);
          return;
        }
      }

      alert(`Attendance saved successfully: ${data.data.success_count} records created`);
      fetchData(); // Refresh all data
      
      // Clear the class attendance
      setShowClassAttendance(false);
      setClassStudents([]);
      setFilters(prev => ({ ...prev, class: "", section: "" }));
      
    } catch (error) {
      // Don't show generic server errors to user
      if (!error.message.includes('already been marked') && 
          !error.message.includes('once per day')) {
        console.error('Error saving attendance:', error);
        alert('An unexpected error occurred while saving attendance. Please try again.');
      } else {
        alert(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Update class attendance data when filters change
  useEffect(() => {
    setClassAttendanceData(prev => ({
      ...prev,
      subject: filters.subject || "",
      teacher_id: filters.teacher_id || ""
    }));
  }, [filters.subject, filters.teacher_id]);

  // Clear filters
  const clearFilters = () => {
    setFilters({
      subject: "",
      teacher_id: "",
      class: "",
      section: ""
    });
    
    // Clear class attendance
    setShowClassAttendance(false);
    setClassStudents([]);
  };

  // Get unique classes and sections
  const uniqueClasses = [...new Set(Array.isArray(students) ? students.map(s => s.class) : [])].filter(Boolean);
  const uniqueSections = [...new Set(Array.isArray(students) ? students.map(s => s.section) : [])].filter(Boolean);

  // Prevent hydration mismatch by not rendering until client-side
  if (!isHydrated) {
    return null;
  }

  if (loading && students.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" suppressHydrationWarning>
        <div className="text-center" suppressHydrationWarning>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" suppressHydrationWarning></div>
          <p className="mt-4 text-gray-600">Loading attendance data...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthWrapper>
      <div className="min-h-screen bg-gray-50" suppressHydrationWarning>
      {/* Header */}
      <div className="bg-white shadow-sm border-b" suppressHydrationWarning>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6" suppressHydrationWarning>
          <div className="flex items-center space-x-3 mb-4" suppressHydrationWarning>
            <div className="bg-blue-100 p-2 rounded-lg" suppressHydrationWarning>
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div suppressHydrationWarning>
              <h1 className="text-2xl font-bold text-gray-900">Attendance Management</h1>
              <p className="text-gray-600">Mark and view attendance records</p>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex space-x-1" suppressHydrationWarning>
            <button
              onClick={() => {
                setShowViewAttendance(false);
                setShowClassAttendance(false);
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                !showViewAttendance 
                  ? 'bg-blue-100 text-blue-700 border border-blue-200' 
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
                  ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              View Attendance
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" suppressHydrationWarning>
        {!showViewAttendance ? (
          // Mark Attendance Section
          <>
            {/* Filters */}
            <div className="text-black bg-white rounded-xl shadow-sm mb-6 border border-gray-200" suppressHydrationWarning>
          <div className="p-4 border-b border-gray-200" suppressHydrationWarning>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-between w-full text-left"
            >
              <div className="flex items-center space-x-2" suppressHydrationWarning>
                <Filter className="w-5 h-5 text-gray-500" />
                <span className="font-medium text-gray-900">Filters</span>
              </div>
              {showFilters ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </button>
          </div>

          {showFilters && (
            <div className="p-4" suppressHydrationWarning>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" suppressHydrationWarning>
                <div suppressHydrationWarning>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <input
                    type="text"
                    value={filters.subject}
                    onChange={(e) => handleClassFilterChange('subject', e.target.value)}
                    placeholder="Enter subject"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div suppressHydrationWarning>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teacher</label>
                  <select
                    value={filters.teacher_id}
                    onChange={(e) => handleClassFilterChange('teacher_id', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Teacher</option>
                    {Array.isArray(teachers) && teachers.map(teacher => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div suppressHydrationWarning>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                  <select
                    value={filters.class}
                    onChange={(e) => handleClassFilterChange('class', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Class</option>
                    {uniqueClasses.map(cls => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                </div>

                <div suppressHydrationWarning>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                  <select
                    value={filters.section}
                    onChange={(e) => handleClassFilterChange('section', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Section</option>
                    {uniqueSections.map(section => (
                      <option key={section} value={section}>{section}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4 flex space-x-3" suppressHydrationWarning>
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

        {/* Class Attendance Section */}
        {showClassAttendance && classStudents.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6" suppressHydrationWarning>
            <div className="p-6 border-b border-gray-200" suppressHydrationWarning>
              <div className="flex items-center justify-between" suppressHydrationWarning>
                <div suppressHydrationWarning>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Mark Attendance - Class {filters.class}{filters.section && `-${filters.section}`}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {classStudents.length} students • Subject: {filters.subject} • Teacher: {Array.isArray(teachers) ? teachers.find(t => t.id == filters.teacher_id)?.name || 'Unknown' : 'Unknown'} • Date: {new Date().toLocaleDateString()}
                  </p>
                </div>
                <div className="flex space-x-3" suppressHydrationWarning>
                  <button
                    onClick={() => {
                      const updatedStudents = classStudents.map(student => ({
                        ...student,
                        status: "Present",
                        isPresent: true
                      }));
                      setClassStudents(updatedStudents);
                      setClassAttendanceData(prev => ({
                        ...prev,
                        student_records: updatedStudents
                      }));
                    }}
                    className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                  >
                    Mark All Present
                  </button>
                  <button
                    onClick={() => {
                      const updatedStudents = classStudents.map(student => ({
                        ...student,
                        status: "Absent",
                        isPresent: false
                      }));
                      setClassStudents(updatedStudents);
                      setClassAttendanceData(prev => ({
                        ...prev,
                        student_records: updatedStudents
                      }));
                    }}
                    className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                  >
                    Mark All Absent
                  </button>
                  <button
                    onClick={saveClassAttendance}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Saving..." : "Save Attendance"}
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Class & Section
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Present
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {classStudents.map((student, index) => (
                    <tr 
                      key={student.student_id} 
                      className={`${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      } hover:bg-blue-50 transition-colors`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center" suppressHydrationWarning>
                          <div className="bg-blue-100 p-2 rounded-full mr-3" suppressHydrationWarning>
                            <Users className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="text-sm font-medium text-gray-900">
                            {student.student_name}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          Class {student.class}-{student.section}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <label className="flex items-center justify-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={student.isPresent}
                            onChange={(e) => handleMainTableCheckboxChange(student.student_id, e.target.checked)}
                            className="w-5 h-5 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                          />
                          <span className="sr-only">Mark as present</span>
                        </label>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          student.isPresent 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {student.isPresent ? (
                            <CheckCircle className="w-3 h-3 mr-1" />
                          ) : (
                            <XCircle className="w-3 h-3 mr-1" />
                          )}
                          {student.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-200" suppressHydrationWarning>
              <div className="flex justify-between text-sm" suppressHydrationWarning>
                <span className="text-gray-700">
                  Present: <span className="font-semibold text-green-600">
                    {classStudents.filter(s => s.isPresent).length}
                  </span>
                </span>
                <span className="text-gray-700">
                  Absent: <span className="font-semibold text-red-600">
                    {classStudents.filter(s => !s.isPresent).length}
                  </span>
                </span>
                <span className="text-gray-700">
                  Total: <span className="font-semibold text-blue-600">
                    {classStudents.length}
                  </span>
                </span>
              </div>
            </div>
          </div>
        )}
          </>
        ) : (
          // View Attendance Section
          <>
            {/* View Attendance Filters */}
            <div className="text-black bg-white rounded-xl shadow-sm mb-6 border border-gray-200" suppressHydrationWarning>
              <div className="p-4 border-b border-gray-200" suppressHydrationWarning>
                <div className="flex items-center justify-between" suppressHydrationWarning>
                  <div className="flex items-center space-x-2" suppressHydrationWarning>
                    <Eye className="w-5 h-5 text-gray-500" />
                    <span className="font-medium text-gray-900">View Attendance</span>
                  </div>
                  
                  {/* View Type Tabs */}
                  <div className="flex space-x-2" suppressHydrationWarning>
                    <button
                      onClick={() => {
                        setViewType('subject');
                        // Clear previous data when switching tabs
                        setStudentWiseAttendance([]);
                        setRecentAttendance([]);
                        setAttendanceOverview({
                          totalStudents: 0,
                          averageAttendance: 0,
                          classWiseStats: [],
                          subjectWiseStats: []
                        });
                      }}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        viewType === 'subject'
                          ? 'bg-blue-100 text-blue-700 border border-blue-200'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-1">
                        <BookOpen className="w-4 h-4" />
                        <span>Subject-wise</span>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        setViewType('overall');
                        // Clear previous data when switching tabs
                        setOverallStudentAttendance([]);
                        setOverallRecentAttendance([]);
                        setOverallAttendanceOverview({
                          totalStudents: 0,
                          averageAttendance: 0,
                          totalClasses: 0,
                          totalPresent: 0,
                          totalAbsent: 0
                        });
                      }}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        viewType === 'overall'
                          ? 'bg-green-100 text-green-700 border border-green-200'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-1">
                        <PieChart className="w-4 h-4" />
                        <span>Overall</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-4">
                {viewType === 'subject' ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                      <input
                        type="text"
                        value={viewFilters.subject}
                        onChange={(e) => handleViewFilterChange('subject', e.target.value)}
                        placeholder="Enter subject"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                      <select
                        value={viewFilters.class}
                        onChange={(e) => handleViewFilterChange('class', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select Class</option>
                        {uniqueClasses.map(cls => (
                          <option key={cls} value={cls}>{cls}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Section (Optional)</label>
                      <select
                        value={viewFilters.section}
                        onChange={(e) => handleViewFilterChange('section', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">All Sections</option>
                        {uniqueSections.map(section => (
                          <option key={section} value={section}>{section}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                      <select
                        value={overallViewFilters.class}
                        onChange={(e) => handleOverallViewFilterChange('class', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="">Select Class</option>
                        {uniqueClasses.map(cls => (
                          <option key={cls} value={cls}>{cls}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Section (Optional)</label>
                      <select
                        value={overallViewFilters.section}
                        onChange={(e) => handleOverallViewFilterChange('section', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="">All Sections</option>
                        {uniqueSections.map(section => (
                          <option key={section} value={section}>{section}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
                
                {/* Search Buttons */}
                <div className="mt-4 flex justify-between">
                  <button
                    onClick={() => {
                      if (viewType === 'subject') {
                        setViewFilters({ subject: "", class: "", section: "" });
                        setStudentWiseAttendance([]);
                        setRecentAttendance([]);
                        setAttendanceOverview({
                          totalStudents: 0,
                          averageAttendance: 0,
                          classWiseStats: [],
                          subjectWiseStats: []
                        });
                      } else {
                        setOverallViewFilters({ class: "", section: "" });
                        setOverallStudentAttendance([]);
                        setOverallRecentAttendance([]);
                        setOverallAttendanceOverview({
                          totalStudents: 0,
                          averageAttendance: 0,
                          totalClasses: 0,
                          totalPresent: 0,
                          totalAbsent: 0
                        });
                      }
                    }}
                    className="px-4 py-2 rounded-lg font-medium transition-colors text-gray-600 bg-gray-100 hover:bg-gray-200 focus:ring-2 focus:ring-gray-400 flex items-center space-x-2"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Clear</span>
                  </button>
                  
                  {viewType === 'subject' ? (
                    <button
                      onClick={() => {
                        if (viewFilters.subject && viewFilters.class) {
                          loadAttendanceView();
                        } else {
                          alert('Please select both subject and class to view attendance.');
                        }
                      }}
                      disabled={!viewFilters.subject || !viewFilters.class || loading}
                      className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                        viewFilters.subject && viewFilters.class && !loading
                          ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Loading...</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4" />
                          <span>View Subject-wise Attendance</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        if (overallViewFilters.class) {
                          loadOverallAttendanceView();
                        } else {
                          alert('Please select a class to view overall attendance.');
                        }
                      }}
                      disabled={!overallViewFilters.class || loading}
                      className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                        overallViewFilters.class && !loading
                          ? 'bg-green-600 text-white hover:bg-green-700 focus:ring-2 focus:ring-green-500'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Loading...</span>
                        </>
                      ) : (
                        <>
                          <PieChart className="w-4 h-4" />
                          <span>View Overall Attendance</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Attendance Overview Cards */}
            {((viewType === 'subject' && studentWiseAttendance.length > 0) || 
              (viewType === 'overall' && overallStudentAttendance.length > 0)) && (
              <>
                {viewType === 'subject' ? (
                  // Subject-wise overview
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Total Students</p>
                          <p className="text-2xl font-bold text-blue-600">{attendanceOverview.totalStudents}</p>
                        </div>
                        <div className="bg-blue-100 p-3 rounded-lg">
                          <Users className="w-6 h-6 text-blue-600" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Average Attendance</p>
                          <p className="text-2xl font-bold text-green-600">{attendanceOverview.averageAttendance}%</p>
                        </div>
                        <div className="bg-green-100 p-3 rounded-lg">
                          <TrendingUp className="w-6 h-6 text-green-600" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Subject</p>
                          <p className="text-lg font-bold text-purple-600">{viewFilters.subject}</p>
                          <p className="text-xs text-gray-500">Class {viewFilters.class}{viewFilters.section && `-${viewFilters.section}`}</p>
                        </div>
                        <div className="bg-purple-100 p-3 rounded-lg">
                          <BookOpen className="w-6 h-6 text-purple-600" />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Overall attendance overview
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Total Students</p>
                          <p className="text-2xl font-bold text-blue-600">{overallAttendanceOverview.totalStudents}</p>
                        </div>
                        <div className="bg-blue-100 p-3 rounded-lg">
                          <Users className="w-6 h-6 text-blue-600" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Overall Attendance</p>
                          <p className="text-2xl font-bold text-green-600">{overallAttendanceOverview.averageAttendance}%</p>
                        </div>
                        <div className="bg-green-100 p-3 rounded-lg">
                          <TrendingUp className="w-6 h-6 text-green-600" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Total Present</p>
                          <p className="text-2xl font-bold text-emerald-600">{overallAttendanceOverview.totalPresent}</p>
                        </div>
                        <div className="bg-emerald-100 p-3 rounded-lg">
                          <CheckCircle className="w-6 h-6 text-emerald-600" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Total Absent</p>
                          <p className="text-2xl font-bold text-red-600">{overallAttendanceOverview.totalAbsent}</p>
                        </div>
                        <div className="bg-red-100 p-3 rounded-lg">
                          <XCircle className="w-6 h-6 text-red-600" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Student-wise Attendance */}
                {((viewType === 'subject' && studentWiseAttendance.length > 0) || 
                  (viewType === 'overall' && overallStudentAttendance.length > 0)) && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
                    <div className="p-6 border-b border-gray-200">
                      <h2 className="text-lg font-semibold text-gray-900">
                        {viewType === 'subject' ? 'Subject-wise Attendance' : 'Overall Student Attendance'}
                      </h2>
                      <p className="text-sm text-gray-600 mt-1">
                        {viewType === 'subject' 
                          ? `Individual attendance records for ${viewFilters.subject} - Class ${viewFilters.class}${viewFilters.section ? `-${viewFilters.section}` : ''}`
                          : `Overall attendance across all subjects - Class ${overallViewFilters.class}${overallViewFilters.section ? `-${overallViewFilters.section}` : ''}`
                        }
                      </p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class & Section</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {viewType === 'subject' ? 'Total Classes' : 'Total Records'}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Present</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Absent</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendance %</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {(viewType === 'subject' ? studentWiseAttendance : overallStudentAttendance).map((student, index) => (
                            <tr key={student.student_id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="bg-blue-100 p-2 rounded-full mr-3">
                                    <Users className="w-4 h-4 text-blue-600" />
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">{student.student_name}</div>
                                    <div className="text-xs text-gray-500">ID: {student.student_id}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">Class {student.class}-{student.section}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="text-sm font-medium text-gray-900">{student.totalRecords}</span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  {student.presentCount}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  <XCircle className="w-3 h-3 mr-1" />
                                  {student.absentCount}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                    <div 
                                      className={`h-2 rounded-full ${
                                        student.attendancePercentage >= 75 ? 'bg-green-600' : 
                                        student.attendancePercentage >= 60 ? 'bg-yellow-600' : 'bg-red-600'
                                      }`}
                                      style={{ width: `${student.attendancePercentage}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-sm font-medium text-gray-900">{student.attendancePercentage}%</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  student.attendancePercentage >= 75 
                                    ? 'bg-green-100 text-green-800' 
                                    : student.attendancePercentage >= 60 
                                    ? 'bg-yellow-100 text-yellow-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {student.attendancePercentage >= 75 ? 'Excellent' : 
                                   student.attendancePercentage >= 60 ? 'Good' : 'Poor'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Summary */}
                    <div className="p-4 bg-gray-50 border-t border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                        <div>
                          <div className="text-lg font-bold text-blue-600">{studentWiseAttendance.length}</div>
                          <div className="text-xs text-gray-600">Total Students</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-green-600">
                            {studentWiseAttendance.filter(s => s.attendancePercentage >= 75).length}
                          </div>
                          <div className="text-xs text-gray-600">Excellent (≥75%)</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-yellow-600">
                            {studentWiseAttendance.filter(s => s.attendancePercentage >= 60 && s.attendancePercentage < 75).length}
                          </div>
                          <div className="text-xs text-gray-600">Good (60-74%)</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-red-600">
                            {studentWiseAttendance.filter(s => s.attendancePercentage < 60).length}
                          </div>
                          <div className="text-xs text-gray-600">Poor (&lt;60%)</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recent Attendance - Last 5 Dates */}
                {((viewType === 'subject' && recentAttendance.length > 0) || 
                  (viewType === 'overall' && overallRecentAttendance.length > 0)) && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    <div className="p-6 border-b border-gray-200">
                      <h2 className="text-lg font-semibold text-gray-900">Recent Attendance Records</h2>
                      <p className="text-sm text-gray-600 mt-1">
                        {viewType === 'subject' 
                          ? `Subject: ${viewFilters.subject} • Class ${viewFilters.class}${viewFilters.section ? `-${viewFilters.section}` : ''}`
                          : `Overall attendance • Class ${overallViewFilters.class}${overallViewFilters.section ? `-${overallViewFilters.section}` : ''}`
                        }
                      </p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                            {viewType === 'subject' && (
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                            )}
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class & Section</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            {viewType === 'overall' && (
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                            )}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {(viewType === 'subject' ? recentAttendance : overallRecentAttendance).map((record, index) => (
                            <tr key={`${record.date}-${record.student_id}-${record.subject}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                                  <span className="text-sm font-medium text-gray-900">
                                    {new Date(record.date).toLocaleDateString()}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{record.student_name}</div>
                                <div className="text-sm text-gray-500">ID: {record.student_id}</div>
                              </td>
                              {viewType === 'subject' && (
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.subject}</td>
                              )}
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {record.class}-{record.section}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  record.status && (record.status === 'Present' || record.status.toLowerCase() === 'present')
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {record.status && (record.status === 'Present' || record.status.toLowerCase() === 'present') ? (
                                    <><CheckCircle className="w-3 h-3 mr-1" />Present</>
                                  ) : (
                                    <><XCircle className="w-3 h-3 mr-1" />Absent</>
                                  )}
                                </span>
                              </td>
                              {viewType === 'overall' && (
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.subject}</td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* No Data Message */}
                {((viewType === 'subject' && viewFilters.subject && viewFilters.class && studentWiseAttendance.length === 0) ||
                  (viewType === 'overall' && overallViewFilters.class && overallStudentAttendance.length === 0)) && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 text-center py-12">
                    <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Attendance Records Available</h3>
                    <p className="text-gray-600">
                      {viewType === 'subject' 
                        ? `No attendance records found for subject "${viewFilters.subject}" in class ${viewFilters.class}${viewFilters.section ? `-${viewFilters.section}` : ''}.`
                        : `No attendance records found for class ${overallViewFilters.class}${overallViewFilters.section ? `-${overallViewFilters.section}` : ''}.`
                      }
                    </p>
                    <p className="text-gray-500 text-sm mt-1">
                      Make sure attendance has been marked for this {viewType === 'subject' ? 'subject and ' : ''}class using the "Mark Attendance" tab.
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Initial Message */}
            {((viewType === 'subject' && studentWiseAttendance.length === 0) ||
              (viewType === 'overall' && overallStudentAttendance.length === 0)) && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 text-center py-12">
                <PieChart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {viewType === 'subject' ? 'Search Subject-wise Attendance' : 'Search Overall Attendance'}
                </h3>
                <p className="text-gray-600">
                  {viewType === 'subject' 
                    ? 'Select a subject and class, then click "View Subject-wise Attendance" to see attendance statistics and records.'
                    : 'Select a class, then click "View Overall Attendance" to see overall attendance statistics and records.'
                  }
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
    </AuthWrapper>
  );
};

export default AttendancePage;
