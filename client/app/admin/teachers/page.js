"use client";
import React, { useState, useEffect } from 'react';
import AuthWrapper from "../components/AuthWrapper";
import { Eye, X, Edit, Trash2, Users, Mail, Phone, DollarSign, Calendar, MapPin, GraduationCap, Briefcase, Upload, User } from 'lucide-react';

const TeachersPage = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [formData, setFormData] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);
  const [token, setToken] = useState('');
  const [user, setUser] = useState('');

  // Handle client-side mounting to avoid hydration issues
  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      setToken(localStorage.getItem('token') || '');
      setUser(localStorage.getItem('user') || '');
    }
  }, []);

  const subjects = [
    'Mathematics', 'English', 'Science', 'History', 'Geography',
    'Physics', 'Chemistry', 'Biology', 'Computer Science', 'Physical Education'
  ];

  const roles = ['teacher', 'head_teacher', 'admin'];

  // API base URL
  const API_URL = 'http://localhost:5001/admin/teacher';

  // Fetch teachers
  useEffect(() => {
    if (mounted && token) {
      setLoading(true);
      fetchTeachers();
    } else if (mounted && !token) {
      setError('No authentication token found. Please log in as admin.');
      setLoading(false);
    }
  }, [token, mounted]);

  const fetchTeachers = async () => {
    try {
      const response = await fetch(`${API_URL}/getALL`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch teachers');
      }
      const data = await response.json();
      setTeachers(data.data || []); // Extract the data array from the response
    } catch (err) {
      setError('Failed to fetch teachers: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle subject filter
  const handleSubjectChange = (e) => {
    setSelectedSubject(e.target.value);
  };

  // Handle view teacher
  const handleViewTeacher = async (teacher) => {
    try {
      const response = await fetch(`${API_URL}/get/${teacher.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch teacher details');
      }
      const data = await response.json();
      setSelectedTeacher(data.data); // Extract the teacher data from the response
      setFormData(null);
      setIsEditMode(false);
      setShowModal(true);
      setUploadedFile(null);
    } catch (err) {
      setError('Failed to fetch teacher details: ' + err.message);
    }
  };

  // Handle create/edit form
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle file upload
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const formData = new FormData();
        formData.append('profilePic', file);
        const response = await fetch(`${API_URL}/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'File upload failed');
        }
        const data = await response.json();
        setUploadedFile(file);
        setFormData({ ...formData, profile_pic_url: data.profile_pic_url });
      } catch (err) {
        setError('File upload failed: ' + err.message);
      }
    }
  };

  // Handle create teacher
  const handleCreate = () => {
    setFormData({
      teacher_id: '', name: '', email: '', password: '', phone: '', gender: '', dob: '', address: '',
      qualification: '', experience_years: '', subject_specialty: '', class_assigned: '',
      profile_pic_url: '', joining_date: '', salary: '', role: 'teacher'
    });
    setIsEditMode(false);
    setShowModal(true);
    setSelectedTeacher(null);
    setUploadedFile(null);
  };

  // Handle edit teacher
  const handleEdit = (teacher) => {
    setFormData({
      teacher_id: teacher.teacher_id || '',
      name: teacher.name,
      email: teacher.email,
      phone: teacher.phone || '',
      gender: teacher.gender || '',
      dob: teacher.dob ? teacher.dob.split('T')[0] : '',
      address: teacher.address || '',
      qualification: teacher.qualification || '',
      experience_years: teacher.experience_years || '',
      subject_specialty: teacher.subject_specialty || '',
      class_assigned: teacher.class_assigned || '',
      profile_pic_url: teacher.profile_pic_url || '',
      joining_date: teacher.joining_date ? teacher.joining_date.split('T')[0] : '',
      salary: teacher.salary || '',
      role: teacher.role || 'teacher'
    });
    setSelectedTeacher(teacher);
    setIsEditMode(true);
    setShowModal(true);
    setUploadedFile(null);
  };

  // Handle form submit (create or update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(isEditMode ? `${API_URL}/update/${selectedTeacher.id}` : `${API_URL}/create`, {
        method: isEditMode ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Operation failed');
      }
      alert(isEditMode ? 'Teacher updated successfully' : 'Teacher created successfully');
      fetchTeachers();
      handleCloseModal();
    } catch (err) {
      setError('Operation failed: ' + err.message);
    }
  };

  // Handle delete
  const handleDelete = async (teacherId) => {
    if (window.confirm('Are you sure you want to delete this teacher?')) {
      try {
        const response = await fetch(`${API_URL}/delete/${teacherId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || 'Delete failed');
        }
        alert('Teacher deleted successfully');
        fetchTeachers();
        handleCloseModal();
      } catch (err) {
        setError('Delete failed: ' + err.message);
      }
    }
  };

  // Handle modal close
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedTeacher(null);
    setFormData(null);
    setUploadedFile(null);
    setIsEditMode(false);
    setError('');
  };

  // Filter teachers
  const filteredTeachers = selectedSubject
    ? (teachers || []).filter(teacher => teacher.subject_specialty === selectedSubject)
    : (teachers || []);

  return (
    <AuthWrapper>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-4">
      {!mounted ? (
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading...</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto">
          {error && <p className="text-red-500 mb-4">{error}</p>}
          {/* Header */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-purple-600" />
              <h1 className="text-3xl font-bold text-gray-800">Teachers Management</h1>
            </div>
            <button
              onClick={handleCreate}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Add Teacher
            </button>
          </div>

          {/* Subject Filter Dropdown */}
          <div className="max-w-md">
            <label htmlFor="subject-filter" className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Subject
            </label>
            <select
              id="subject-filter"
              value={selectedSubject}
              onChange={handleSubjectChange}
              className="w-full px-4 py-3 text-black border rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="">All Subjects</option>
              {subjects.map((subject) => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Teachers Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4">
            <h2 className="text-xl font-semibold text-white">
              Teachers List ({filteredTeachers.length} {selectedSubject ? `in ${selectedSubject}` : 'total'})
            </h2>
          </div>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <svg className="animate-spin h-10 w-10 text-purple-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
              </svg>
              <span className="text-gray-500">Loading teachers...</span>
            </div>
          ) : filteredTeachers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Teacher ID</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Salary</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTeachers.map((teacher, idx) => (
                    <tr key={teacher.id} className={idx % 2 === 0 ? "bg-white hover:bg-purple-50 transition-colors" : "bg-purple-50 hover:bg-purple-100 transition-colors"}>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{teacher.id}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{teacher.teacher_id}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="flex items-center gap-2">
                          {teacher.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                          {teacher.subject_specialty}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{teacher.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{teacher.phone || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <span className="font-semibold text-green-600">₹{teacher.salary?.toLocaleString() || '-'}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <button
                          onClick={() => handleViewTeacher(teacher)}
                          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow"
                          title="View Teacher"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">
                {selectedSubject ? `No teachers found for ${selectedSubject}` : 'No teachers found'}
              </p>
            </div>
          )}
        </div>

        {/* Modal for View/Edit/Create */}
        {showModal && (
          <div className="fixed inset-0 backdrop-blur-sm bg-black/10 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-screen overflow-y-auto">
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 rounded-t-2xl sticky top-0 z-10">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                    <User className="w-6 h-6" />
                    {isEditMode ? 'Edit Teacher' : selectedTeacher ? 'Teacher Details' : 'Add Teacher'}
                  </h3>
                  <button
                    onClick={handleCloseModal}
                    className="text-white hover:text-gray-200"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                {error && <p className="text-red-500 mb-4">{error}</p>}
                {formData ? (
                  /* Form for Create/Edit */
                  <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-gray-800 border-b pb-2">Basic Information</h4>
                      <div className="grid grid-cols-1 text-black sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Name</label>
                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleFormChange}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">Teacher ID</label>
                          <input
                            type="text"
                            name="teacher_id"
                            value={formData.teacher_id}
                            onChange={handleFormChange}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                            placeholder="e.g., T001, TCH001, etc."
                            required
                          />
                        </div>
                        <div >
                          <label className="text-sm font-medium text-gray-700">Email</label>
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleFormChange}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                            required
                          />
                        </div>
                        {!isEditMode && (
                          <div>
                            <label className="text-sm font-medium text-gray-700">Password</label>
                            <input
                              type="password"
                              name="password"
                              value={formData.password}
                              onChange={handleFormChange}
                              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                              required
                            />
                          </div>
                        )}
                        <div>
                          <label className="text-sm font-medium text-gray-700">Gender</label>
                          <select
                            name="gender"
                            value={formData.gender}
                            onChange={handleFormChange}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                          >
                            <option value="">Select Gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">Date of Birth</label>
                          <input
                            type="date"
                            name="dob"
                            value={formData.dob}
                            onChange={handleFormChange}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">Role</label>
                          <select
                            name="role"
                            value={formData.role}
                            onChange={handleFormChange}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                            required
                          >
                            {roles.map((role) => (
                              <option key={role} value={role}>{role}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-gray-800 border-b pb-2">Contact Information</h4>
                      <div className="space-y-3 text-black">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Phone</label>
                          <input
                            type="text"
                            name="phone"
                            value={formData.phone}
                            onChange={handleFormChange}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">Address</label>
                          <textarea
                            name="address"
                            value={formData.address}
                            onChange={handleFormChange}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-gray-800 border-b pb-2">Professional Information</h4>
                      <div className="space-y-3 text-black">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Qualification</label>
                          <input
                            type="text"
                            name="qualification"
                            value={formData.qualification}
                            onChange={handleFormChange}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">Experience (Years)</label>
                          <input
                            type="number"
                            name="experience_years"
                            value={formData.experience_years}
                            onChange={handleFormChange}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">Subject Specialty</label>
                          <select
                            name="subject_specialty"
                            value={formData.subject_specialty}
                            onChange={handleFormChange}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                          >
                            <option value="">Select Subject</option>
                            {subjects.map((subject) => (
                              <option key={subject} value={subject}>{subject}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">Class Assigned</label>
                          <input
                            type="text"
                            name="class_assigned"
                            value={formData.class_assigned}
                            onChange={handleFormChange}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">Joining Date</label>
                          <input
                            type="date"
                            name="joining_date"
                            value={formData.joining_date}
                            onChange={handleFormChange}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-gray-800 border-b pb-2">Salary & Documents</h4>
                      <div className="space-y-3 text-black">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Salary</label>
                          <input
                            type="number"
                            name="salary"
                            value={formData.salary}
                            onChange={handleFormChange}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">Profile Picture</label>
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                            <div className="text-center">
                              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                              <label htmlFor="profile-pic-upload" className="cursor-pointer">
                                <span className="text-purple-600 hover:text-purple-700 font-medium">
                                  Upload profile picture
                                </span>
                                <input
                                  id="profile-pic-upload"
                                  type="file"
                                  accept="image/*"
                                  onChange={handleFileUpload}
                                  className="hidden"
                                />
                              </label>
                              <p className="text-xs text-gray-500 mt-1">JPEG, PNG up to 5MB</p>
                              {uploadedFile && (
                                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                                  <p className="text-sm text-green-700">✓ {uploadedFile.name} uploaded</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="col-span-2 flex justify-end gap-3 mt-4">
                      <button
                        type="submit"
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
                      >
                        {isEditMode ? 'Update' : 'Create'}
                      </button>
                      <button
                        type="button"
                        onClick={handleCloseModal}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  /* View Teacher Details */
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-gray-800 border-b pb-2">Basic Information</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500">System ID</label>
                          <p className="text-lg font-semibold text-gray-900">{selectedTeacher.id}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Teacher ID</label>
                          <p className="text-lg font-semibold text-gray-900">{selectedTeacher.teacher_id}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Name</label>
                          <p className="text-lg font-semibold text-gray-900">{selectedTeacher.name}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Username</label>
                          <p className="text-lg font-semibold text-gray-900">{selectedTeacher.username || '-'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Subject</label>
                          <p className="text-lg text-purple-600 font-medium">{selectedTeacher.subject_specialty}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Gender</label>
                          <p className="text-lg text-gray-900">{selectedTeacher.gender || '-'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                          <p className="text-lg text-gray-900">
                            {selectedTeacher.dob ? new Date(selectedTeacher.dob).toLocaleDateString('en-IN') : '-'}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Role</label>
                          <p className="text-lg text-gray-900">{selectedTeacher.role}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-gray-800 border-b pb-2">Contact Information</h4>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-500" />
                          <div>
                            <label className="text-sm font-medium text-gray-500">Email</label>
                            <p className="text-lg text-gray-900">{selectedTeacher.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-500" />
                          <div>
                            <label className="text-sm font-medium text-gray-500">Phone</label>
                            <p className="text-lg text-gray-900">{selectedTeacher.phone || '-'}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-gray-500 mt-1" />
                          <div>
                            <label className="text-sm font-medium text-gray-500">Address</label>
                            <p className="text-lg text-gray-900">{selectedTeacher.address || '-'}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-gray-800 border-b pb-2">Professional Information</h4>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="w-4 h-4 text-gray-500" />
                          <div>
                            <label className="text-sm font-medium text-gray-500">Qualification</label>
                            <p className="text-lg text-gray-900">{selectedTeacher.qualification || '-'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-gray-500" />
                          <div>
                            <label className="text-sm font-medium text-gray-500">Experience</label>
                            <p className="text-lg text-gray-900">{selectedTeacher.experience_years || 0} years</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <div>
                            <label className="text-sm font-medium text-gray-500">Class Assigned</label>
                            <p className="text-lg text-gray-900">{selectedTeacher.class_assigned || '-'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <div>
                            <label className="text-sm font-medium text-gray-500">Joining Date</label>
                            <p className="text-lg text-gray-900">
                              {selectedTeacher.joining_date ? new Date(selectedTeacher.joining_date).toLocaleDateString('en-IN') : '-'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-gray-800 border-b pb-2">Salary & Documents</h4>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-gray-500" />
                          <div>
                            <label className="text-sm font-medium text-gray-500">Monthly Salary</label>
                            <p className="text-xl font-bold text-green-600">₹{selectedTeacher.salary?.toLocaleString() || '-'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Upload className="w-4 h-4 text-gray-500" />
                          <div>
                            <label className="text-sm font-medium text-gray-500">Profile Picture</label>
                            {selectedTeacher.profile_pic_url ? (
                              <img
                                src={selectedTeacher.profile_pic_url}
                                alt="Profile"
                                className="w-24 h-24 rounded-full object-cover mt-2"
                              />
                            ) : (
                              <p className="text-lg text-gray-900">-</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {!formData && (
                  <div className="flex justify-end gap-3 mt-4">
                    <button
                      onClick={() => handleEdit(selectedTeacher)}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg flex items-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(selectedTeacher.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        </div>
      )}
    </div>
    </AuthWrapper>
  );
};

export default TeachersPage;