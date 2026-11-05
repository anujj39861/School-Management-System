"use client";
import React, { useState, useEffect } from 'react';
import TeacherAuthWrapper from "../components/AuthWrapper";
import { Users, BookOpen, Calendar, Clock, Award, ChevronRight, Search, Filter, MapPin } from 'lucide-react';

const TeacherClassesPage = () => {
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachingStats, setTeachingStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);
  const [token, setToken] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');

  // Handle client-side mounting
  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      setToken(localStorage.getItem('teacher_token') || '');
    }
  }, []);

  // API base URL
  const API_URL = 'http://localhost:5001/teacher';

  // Fetch data when component mounts
  useEffect(() => {
    if (mounted && token) {
      fetchAllData();
    } else if (mounted && !token) {
      setError('No authentication token found. Please log in.');
      setLoading(false);
    }
  }, [token, mounted]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      await fetchTeacherData();
    } catch (err) {
      setError('Failed to fetch data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch teacher's data using the working students API
  const fetchTeacherData = async () => {
    try {
      const response = await fetch(`${API_URL}/students`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch teacher data');
      }

      const data = await response.json();
      const teacherData = data.data || {};
      
      // Process the data to create class information
      const availableClasses = teacherData.availableClasses || [];
      const availableSubjects = teacherData.availableSubjects || [];
      const students = teacherData.students || [];
      
      // Create class objects with student counts
      const classesWithData = availableClasses.map(className => {
        const classStudents = students.filter(student => {
          // Handle both "8A" format and "8" format
          const classMatch = className.match(/^(\d+)([A-Z]?)$/);
          if (classMatch) {
            const classNumber = classMatch[1];
            const sectionLetter = classMatch[2];
            
            if (sectionLetter) {
              // Specific section like "8A"
              return student.class === classNumber && student.section === sectionLetter;
            } else {
              // All sections like "8"
              return student.class === classNumber;
            }
          }
          return false;
        });
        
        return {
          id: className,
          name: className,
          class: className,
          studentCount: classStudents.length,
          students: classStudents,
          subjects: availableSubjects
        };
      });
      
      setClasses(classesWithData);
      setSubjects(availableSubjects);
      
      // Set teaching stats
      setTeachingStats({
        totalClasses: availableClasses.length,
        totalStudents: students.length,
        totalSubjects: availableSubjects.length,
        averageClassSize: availableClasses.length > 0 ? Math.round(students.length / availableClasses.length) : 0
      });
      
    } catch (err) {
      console.error('Fetch teacher data error:', err);
      throw err;
    }
  };

  // Filter classes based on search and subject
  const filteredClasses = classes.filter(classItem => {
    const matchesSearch = classItem.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = selectedSubject === '' || classItem.subjects.includes(selectedSubject);
    
    return matchesSearch && matchesSubject;
  });

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading classes...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <TeacherAuthWrapper>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-purple-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-800">My Classes</h1>
                <p className="text-gray-600">Manage your assigned classes and subjects</p>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Statistics Cards */}
        {teachingStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Classes</p>
                  <p className="text-2xl font-bold text-gray-800">{teachingStats.total_classes}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Subjects</p>
                  <p className="text-2xl font-bold text-gray-800">{teachingStats.total_subjects}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Periods</p>
                  <p className="text-2xl font-bold text-gray-800">{teachingStats.total_periods}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Teaching Days</p>
                  <p className="text-2xl font-bold text-gray-800">{teachingStats.teaching_days}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filter */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search classes or subjects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
            <div className="md:w-64">
              <div className="relative">
                <Filter className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 appearance-none"
                >
                  <option value="">All Subjects</option>
                  {subjects.map(subject => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Classes Grid */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">
              Your Classes ({filteredClasses.length})
            </h2>
          </div>

          {filteredClasses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClasses.map((classItem, index) => (
                <div key={`${classItem.id}-${index}`} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Users className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">Class {classItem.name}</h3>
                        <p className="text-sm text-gray-500">{classItem.studentCount} students</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Subject:</span>
                      <span className="text-sm font-medium text-purple-600">
                        {classItem.subjects.join(', ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Students:</span>
                      <span className="text-sm font-medium text-blue-600">{classItem.studentCount}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <button 
                      onClick={() => window.location.href = `/teacher/attendance?class=${classItem.name}`}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg transition-colors"
                    >
                      Mark Attendance
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">
                {searchTerm || selectedSubject ? 'No classes found matching your filters' : 'No classes assigned'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
    </TeacherAuthWrapper>
  );
};

export default TeacherClassesPage;
