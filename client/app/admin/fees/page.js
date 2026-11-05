"use client";
import React, { useState, useEffect } from 'react';
import AuthWrapper from "../components/AuthWrapper";
import { CreditCard, Calendar, DollarSign, History, User, Hash, FileText, Trash2, Search, Printer } from 'lucide-react';


const FeesPage = () => {
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    month_for: '',
    payment_date: new Date().toISOString().split('T')[0],
    total_amount: '',
    amount_paid: '',
    fee_type: '',
    payment_mode: '',
    academic_year: '2025-2026',
    receipt_no: '',
    remarks: '',
    due_date: '',
    discount: 0,
    fine: 0,
    // school_id: '',
  });
  const [classes] = useState([
    'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
    'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
    'Class 11', 'Class 12'
  ]);
  const [allStudents, setAllStudents] = useState([]);
  const [feeHistory, setFeeHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const STUDENT_API_BASE_URL = 'http://localhost:5001/admin/student';
  const FEES_API_BASE_URL = 'http://localhost:5001/admin/fees';

  // Fetch all students
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await fetch(`${STUDENT_API_BASE_URL}/getallstudents`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        setAllStudents(Array.isArray(data) ? data : data.data || []);
      } catch (err) {
        console.error('Fetch students error:', err);
        setError('Error fetching students: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  // Fetch fee history when student is selected
  useEffect(() => {
    if (!selectedStudent) {
      setFeeHistory([]);
      return;
    }

    const fetchFeeHistory = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await fetch(`${FEES_API_BASE_URL}/getfees/${selectedStudent}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const data = await response.json();
        if (!data.success) throw new Error(data.message || 'Failed to fetch fee history');
        setFeeHistory(data.data || []);
      } catch (err) {
        console.error('Fetch fee history error:', err);
        setError('Error fetching fee history: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFeeHistory();
  }, [selectedStudent]);

  // Log selectedClass, studentsInClass, and currentStudent for debugging
  useEffect(() => {
    
  }, [selectedClass, selectedStudent, searchTerm]);

  const handleClassChange = (e) => {
    const newClass = e.target.value;
    setSelectedClass(newClass);
    setSelectedStudent('');
    setSearchTerm('');
    setFormData({
      month_for: '',
      payment_date: new Date().toISOString().split('T')[0],
      total_amount: '',
      amount_paid: '',
      fee_type: '',
      payment_mode: '',
      academic_year: '2025-2026',
      receipt_no: '',
      remarks: '',
      due_date: '',
      discount: 0,
      fine: 0,
      // school_id: '',
    });
    setFeeHistory([]);
  };

  const handleStudentChange = (e) => {
    const newStudent = e.target.value;
    setSelectedStudent(newStudent);
    setFormData({
      month_for: '',
      payment_date: new Date().toISOString().split('T')[0],
      total_amount: '',
      amount_paid: '',
      fee_type: '',
      payment_mode: '',
      academic_year: '2025-2026',
      receipt_no: '',
      remarks: '',
      due_date: '',
      discount: 0,
      fine: 0,
      // school_id: '',
    });
  };

  const handleSearchChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    setSelectedStudent('');
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!formData.month_for || !formData.payment_date || !formData.total_amount || !formData.amount_paid || !formData.fee_type || !formData.payment_mode ) {
      setError('Please fill all required fields');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await fetch(`${FEES_API_BASE_URL}/createfees`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          student_id: selectedStudent,
          // school_id: formData.school_id,
          fee_type: formData.fee_type,
          month_for: formData.month_for,
          academic_year: formData.academic_year,
          total_amount: parseFloat(formData.total_amount),
          amount_paid: parseFloat(formData.amount_paid),
          due_date: formData.due_date || formData.payment_date,
          payment_date: formData.payment_date,
          payment_mode: formData.payment_mode,
          receipt_no: formData.receipt_no || `REC-${Date.now()}`,
          discount: parseFloat(formData.discount) || 0,
          fine: parseFloat(formData.fine) || 0,
          remarks: formData.remarks,
        }),
      });

      const data = await response.json();
      if (!data.success) {
        if (data.message === 'Invalid or expired token') {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          router.replace("/login");
          return;
        }
        throw new Error(data.message || 'Failed to create fee');
      }
      alert('Fee record submitted successfully!');

      // Refresh fee history
      const historyResponse = await fetch(`${FEES_API_BASE_URL}/getfees/${selectedStudent}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const historyData = await historyResponse.json();
      if (historyData.success) setFeeHistory(historyData.data || []);

      // Reset form
      setFormData({
        month_for: '',
        payment_date: new Date().toISOString().split('T')[0],
        total_amount: '',
        amount_paid: '',
        fee_type: '',
        payment_mode: '',
        academic_year: '2025-2026',
        receipt_no: '',
        remarks: '',
        due_date: '',
        discount: 0,
        fine: 0,
        school_id: '',
      });
    } catch (err) {
      console.error('Create fee error:', err);
      setError('Error submitting fee: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (feeId) => {
    if (!confirm('Are you sure you want to delete this fee record?')) return;

    try {
      setLoading(true);
      setError('');
      const response = await fetch(`${FEES_API_BASE_URL}/deletefees/${feeId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await response.json();
      if (!data.success) {
        if (data.message === 'Invalid or expired token') {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          router.replace("/login");
          return;
        }
        throw new Error(data.message || 'Failed to delete fee');
      }

      // Refresh fee history
      const historyResponse = await fetch(`${FEES_API_BASE_URL}/getfees/${selectedStudent}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const historyData = await historyResponse.json();
      if (historyData.success) setFeeHistory(historyData.data || []);
      alert('Fee record deleted successfully!');
    } catch (err) {
      console.error('Delete fee error:', err);
      setError('Error deleting fee: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const printFeeHistory = (record = null) => {
    const recordsToPrint = record ? [record] : feeHistory;
    if (!recordsToPrint.length || !currentStudent) {
      alert('No fee records to print.');
      return;
    }

    // Retrieve school info from localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const schoolName = user.name || 'Unknown School';
    const schoolEmail = user.email || '-';
    const schoolPhone = user.phone || '-';
    const schoolAddress = user.address || '-';

    // Create hidden iframe
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    // Write print content to iframe
    const printContent = `
      <html>
        <head>
          <title>Fee Receipt - ${currentStudent.student_name}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              color: #333;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              color: #000;
            }
            .header p {
              margin: 5px 0;
              font-size: 14px;
            }
            .student-info {
              margin-bottom: 20px;
              border-bottom: 2px solid #000;
              padding-bottom: 10px;
            }
            .student-info .grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 10px;
              font-size: 14px;
            }
            .student-info p {
              margin: 5px 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
              font-size: 12px;
            }
            th, td {
              border: 1px solid #000;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #f2f2f2;
              font-weight: bold;
            }
            @media print {
              body {
                margin: 0;
              }
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${schoolName}</h1>
            <p>${schoolAddress}</p>
            <p>Email: ${schoolEmail} | Phone: ${schoolPhone}</p>
            <p>Fee Receipt - Generated on: ${new Date().toLocaleDateString('en-IN')}</p>
          </div>
          <div class="student-info">
            <div class="grid">
              <p><strong>Student Name:</strong> ${currentStudent.student_name || '-'}</p>
              <p><strong>Student ID:</strong> ${currentStudent.student_id || '-'}</p>
              <p><strong>Class:</strong> ${selectedClass || '-'}</p>
              <p><strong>Section:</strong> ${currentStudent.section || '-'}</p>
              <p><strong>Father's Name:</strong> ${currentStudent.father_name || '-'}</p>
              <p><strong>Mother's Name:</strong> ${currentStudent.mother_name || '-'}</p>
              <p><strong>Date of Birth:</strong> ${currentStudent.dob ? new Date(currentStudent.dob).toLocaleDateString('en-IN') : '-'}</p>
              <p><strong>Gender:</strong> ${currentStudent.gender || '-'}</p>
              <p><strong>Contact No:</strong> ${currentStudent.contact_no || '-'}</p>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Month</th>
                <th>Fee Type</th>
                <th>Payment Date</th>
                <th>Total Amount (₹)</th>
                <th>Paid Amount (₹)</th>
                <th>Balance (₹)</th>
                <th>Discount (₹)</th>
                <th>Fine (₹)</th>
                <th>Payment Mode</th>
                <th>Receipt No</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              ${recordsToPrint.map(record => {
                const totalAmount = typeof record.total_amount === 'number' ? record.total_amount : parseFloat(record.total_amount) || 0;
                const amountPaid = typeof record.amount_paid === 'number' ? record.amount_paid : parseFloat(record.amount_paid) || 0;
                const discount = typeof record.discount === 'number' ? record.discount : parseFloat(record.discount) || 0;
                const fine = typeof record.fine === 'number' ? record.fine : parseFloat(record.fine) || 0;
                const balance = record.balance !== undefined && typeof record.balance === 'number'
                  ? record.balance
                  : (totalAmount - amountPaid);
                return `
                  <tr>
                    <td>${record.month_for || '-'}</td>
                    <td>${record.fee_type || '-'}</td>
                    <td>${record.payment_date ? new Date(record.payment_date).toLocaleDateString('en-IN') : '-'}</td>
                    <td>${totalAmount.toLocaleString()}</td>
                    <td>${amountPaid.toLocaleString()}</td>
                    <td>${balance.toLocaleString()}</td>
                    <td>${discount > 0 ? discount.toLocaleString() : '-'}</td>
                    <td>${fine > 0 ? fine.toLocaleString() : '-'}</td>
                    <td>${record.payment_mode || '-'}</td>
                    <td>${record.receipt_no || '-'}</td>
                    <td>${record.remarks || '-'}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    // Write content to iframe and trigger print
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(printContent);
    iframeDoc.close();

    // Ensure content is loaded before printing
    iframe.onload = () => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        setTimeout(() => document.body.removeChild(iframe), 1000);
      } catch (err) {
        console.error('Print error:', err);
        document.body.removeChild(iframe);
        alert('Error triggering print: ' + err.message);
      }
    };
  };

  // Map selected class to numerical value
  const getClassNumber = (className) => {
    if (!className) return null;
    const match = className.match(/\d+/);
    return match ? parseInt(match[0], 10) : null;
  };

  // Filter students by selected class
  const studentsInClass = selectedClass
    ? allStudents.filter(student => {
        const classNumber = getClassNumber(selectedClass);
        const studentClass = parseInt(student.class, 10);
        return studentClass === classNumber;
      })
    : [];

  // Filter students by search term
  const filteredStudents = searchTerm
    ? studentsInClass.filter(student =>
        student.student_id.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    : studentsInClass;

  const currentStudent = filteredStudents.find(s => s.id.toString() === selectedStudent);

  const getStatusColor = (amount, paidAmount) => {
    if (typeof amount !== 'number' || typeof paidAmount !== 'number') return 'bg-red-100 text-red-800';
    if (paidAmount >= amount) return 'bg-green-100 text-green-800';
    if (paidAmount > 0) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getStatusText = (amount, paidAmount) => {
    if (typeof amount !== 'number' || typeof paidAmount !== 'number') return 'Invalid';
    if (paidAmount >= amount) return 'Paid';
    if (paidAmount > 0) return 'Partial';
    return 'Pending';
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const feeTypes = ['Tuition', 'Transport', 'Lab', 'Admission', 'Other'];
  const paymentModes = ['Cash', 'Card', 'Online', 'UPI', 'Bank Transfer'];

  return (
    <AuthWrapper>
      <div
        className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-4"
        suppressHydrationWarning={true}
      >
        <div className="max-w-7xl mx-auto">
          {error && (
            <div className="bg-red-100 text-red-800 p-4 rounded-lg mb-6">
              {error}
            </div>
          )}
          {loading && (
            <div className="bg-blue-100 text-blue-800 p-4 rounded-lg mb-6">
              Loading...
            </div>
          )}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <CreditCard className="w-8 h-8 text-emerald-600" />
              <h1 className="text-3xl font-bold text-gray-800">Fees Management</h1>
            </div>
            <div className="space-y-6">
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <label htmlFor="class-select" className="block text-sm font-medium text-gray-700 mb-2">
                  Select Class
                </label>
                <select
                  id="class-select"
                  value={selectedClass}
                  onChange={handleClassChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white text-gray-900"
                >
                  <option value="">Choose a class...</option>
                  {classes.map((cls) => (
                    <option key={cls} value={cls}>
                      {cls}
                    </option>
                  ))}
                </select>
              </div>

              {selectedClass && (
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                  <label htmlFor="student-search" className="block text-sm font-medium text-gray-700 mb-2">
                    Search Student
                  </label>
                  <div className="relative">
                    <input
                      id="student-search"
                      type="text"
                      value={searchTerm}
                      onChange={handleSearchChange}
                      placeholder="Search by Student ID..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white text-gray-900 pl-10"
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                  </div>
                </div>
              )}

              {selectedClass && (
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                  <label htmlFor="student-select" className="block text-sm font-medium text-gray-700 mb-2">
                    Select Student from List
                  </label>
                  <select
                    id="student-select"
                    value={selectedStudent}
                    onChange={handleStudentChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white text-gray-900"
                  >
                    <option value="">Choose a student...</option>
                    {filteredStudents.length > 0 ? (
                      filteredStudents.map((student) => (
                        <option key={student.id} value={student.id.toString()}>
                          {student.student_name} (ID: {student.student_id})
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>
                        No students found
                      </option>
                    )}
                  </select>
                </div>
              )}
            </div>
          </div>
          {selectedStudent && currentStudent && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4">
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Fee Submission Form
                  </h2>
                </div>
                <div className="p-6">
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Hash className="w-4 h-4 text-gray-500" />
                        <div>
                          <span className="font-medium text-gray-600">Student ID:</span>
                          <p className="font-semibold text-gray-900">{currentStudent.id}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <div>
                          <span className="font-medium text-gray-600">Name:</span>
                          <p className="font-semibold text-gray-900">{currentStudent.student_name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Hash className="w-4 h-4 text-gray-500" />
                        <div>
                          <span className="font-medium text-gray-600">Student ID:</span>
                          <p className="font-semibold text-gray-900">{currentStudent.student_id}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <label htmlFor="month_for" className="block text-sm font-medium text-gray-700 mb-2">
                        Month *
                      </label>
                      <select
                        id="month_for"
                        name="month_for"
                        value={formData.month_for}
                        onChange={handleFormChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      >
                        <option value="">Select month...</option>
                        {months.map((month) => (
                          <option key={month} value={month}>
                            {month}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="fee_type" className="block text-sm font-medium text-gray-700 mb-2">
                        Fee Type *
                      </label>
                      <select
                        id="fee_type"
                        name="fee_type"
                        value={formData.fee_type}
                        onChange={handleFormChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      >
                        <option value="">Select fee type...</option>
                        {feeTypes.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="payment_mode" className="block text-sm font-medium text-gray-700 mb-2">
                        Payment Mode *
                      </label>
                      <select
                        id="payment_mode"
                        name="payment_mode"
                        value={formData.payment_mode}
                        onChange={handleFormChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      >
                        <option value="">Select payment mode...</option>
                        {paymentModes.map((mode) => (
                          <option key={mode} value={mode}>
                            {mode}
                          </option>
                        ))}
                      </select>
                    </div>
                    {/* <div>
                      <label htmlFor="school_id" className="block text-sm font-medium text-gray-700 mb-2">
                        School ID *
                      </label>
                      <input
                        type="text"
                        id="school_id"
                        name="school_id"
                        value={formData.school_id}
                        onChange={handleFormChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        placeholder="Enter school ID"
                      />
                    </div> */}
                    <div>
                      <label htmlFor="payment_date" className="block text-sm font-medium text-gray-700 mb-2">
                        Submission Date *
                      </label>
                      <input
                        type="date"
                        id="payment_date"
                        name="payment_date"
                        value={formData.payment_date}
                        onChange={handleFormChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label htmlFor="due_date" className="block text-sm font-medium text-gray-700 mb-2">
                        Due Date
                      </label>
                      <input
                        type="date"
                        id="due_date"
                        name="due_date"
                        value={formData.due_date}
                        onChange={handleFormChange}
                        className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="total_amount" className="block text-sm font-medium text-gray-700 mb-2">
                          Total Amount (₹) *
                        </label>
                        <input
                          type="number"
                          id="total_amount"
                          name="total_amount"
                          value={formData.total_amount}
                          onChange={handleFormChange}
                          required
                          min="0"
                          step="0.01"
                          className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          placeholder="5000"
                        />
                      </div>
                      <div>
                        <label htmlFor="amount_paid" className="block text-sm font-medium text-gray-700 mb-2">
                          Paid Amount (₹) *
                        </label>
                        <input
                          type="number"
                          id="amount_paid"
                          name="amount_paid"
                          value={formData.amount_paid}
                          onChange={handleFormChange}
                          required
                          min="0"
                          step="0.01"
                          className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          placeholder="5000"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="discount" className="block text-sm font-medium text-gray-700 mb-2">
                          Discount (₹)
                        </label>
                        <input
                          type="number"
                          id="discount"
                          name="discount"
                          value={formData.discount}
                          onChange={handleFormChange}
                          min="0"
                          step="0.01"
                          className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label htmlFor="fine" className="block text-sm font-medium text-gray-700 mb-2">
                          Fine (₹)
                        </label>
                        <input
                          type="number"
                          id="fine"
                          name="fine"
                          value={formData.fine}
                          onChange={handleFormChange}
                          min="0"
                          step="0.01"
                          className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="receipt_no" className="block text-sm font-medium text-gray-700 mb-2">
                        Receipt Number
                      </label>
                      <input
                        type="text"
                        id="receipt_no"
                        name="receipt_no"
                        value={formData.receipt_no}
                        onChange={handleFormChange}
                        className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        placeholder="REC-XXXX"
                      />
                    </div>
                    <div>
                      <label htmlFor="remarks" className="block text-sm font-medium text-gray-700 mb-2">
                        Remarks
                      </label>
                      <textarea
                        id="remarks"
                        name="remarks"
                        value={formData.remarks}
                        onChange={handleFormChange}
                        className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        rows="4"
                        placeholder="Any additional notes..."
                      />
                    </div>
                    <button
                      onClick={handleSubmit}
                      disabled={loading}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:bg-emerald-400 disabled:cursor-not-allowed"
                    >
                      <DollarSign className="w-5 h-5" />
                      Submit Fee Record
                    </button>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-lg overflow-y-auto max-h-[600px]">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    <History className="w-5 h-5" />
                    Fee History
                  </h2>
                  {feeHistory.length > 0 && (
                    <button
                      onClick={() => printFeeHistory()}
                      className="bg-white text-indigo-600 hover:bg-gray-100 font-semibold py-2 px-4 rounded-lg flex items-center gap-2"
                    >
                      <Printer className="w-5 h-5" />
                      Print All
                    </button>
                  )}
                </div>
                <div className="p-6">
                  {feeHistory.length > 0 ? (
                    <div className="space-y-4">
                      {feeHistory.map((record) => {
                        const totalAmount = typeof record.total_amount === 'number' ? record.total_amount : parseFloat(record.total_amount) || 0;
                        const amountPaid = typeof record.amount_paid === 'number' ? record.amount_paid : parseFloat(record.amount_paid) || 0;
                        const discount = typeof record.discount === 'number' ? record.discount : parseFloat(record.discount) || 0;
                        const fine = typeof record.fine === 'number' ? record.fine : parseFloat(record.fine) || 0;
                        const balance = record.balance !== undefined && typeof record.balance === 'number'
                          ? record.balance
                          : (totalAmount - amountPaid);

                        if (isNaN(totalAmount) || isNaN(amountPaid) || isNaN(balance)) {
                          console.error('Invalid fee record:', record);
                          return (
                            <div key={record.id} className="border border-red-200 rounded-lg p-4">
                              <p className="text-red-600">Error: Invalid fee data for {record.month_for || 'Unknown Month'}</p>
                            </div>
                          );
                        }

                        return (
                          <div key={record.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h4 className="font-semibold text-gray-900 text-lg">{record.month_for}</h4>
                                <p className="text-sm text-gray-600 flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  {new Date(record.payment_date).toLocaleDateString('en-IN')}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(totalAmount, amountPaid)}`}>
                                  {getStatusText(totalAmount, amountPaid)}
                                </span>
                                <button
                                  onClick={() => printFeeHistory(record)}
                                  className="text-blue-600 hover:text-blue-800"
                                  title="Print Fee Record"
                                >
                                  <Printer className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(record.id)}
                                  className="text-red-600 hover:text-red-800"
                                  title="Delete Fee Record"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600">Fee Type:</span>
                                <p className="font-semibold text-gray-900">{record.fee_type}</p>
                              </div>
                              <div>
                                <span className="text-gray-600">Payment Mode:</span>
                                <p className="font-semibold text-gray-900">{record.payment_mode}</p>
                              </div>
                              <div>
                                <span className="text-gray-600">Total Amount:</span>
                                <p className="font-semibold text-gray-900">₹{totalAmount.toLocaleString()}</p>
                              </div>
                              <div>
                                <span className="text-gray-600">Paid Amount:</span>
                                <p className="font-semibold text-gray-900">₹{amountPaid.toLocaleString()}</p>
                              </div>
                              <div>
                                <span className="text-gray-600">Balance:</span>
                                <p className={`font-semibold ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                  ₹{balance.toLocaleString()}
                                </p>
                              </div>
                              {discount > 0 && (
                                <div>
                                  <span className="text-gray-600">Discount:</span>
                                  <p className="font-semibold text-gray-900">₹{discount.toLocaleString()}</p>
                                </div>
                              )}
                              {fine > 0 && (
                                <div>
                                  <span className="text-gray-600">Fine:</span>
                                  <p className="font-semibold text-gray-900">₹{fine.toLocaleString()}</p>
                                </div>
                              )}
                              {record.receipt_no && (
                                <div>
                                  <span className="text-gray-600">Receipt No:</span>
                                  <p className="font-semibold text-gray-900">{record.receipt_no}</p>
                                </div>
                              )}
                              {record.remarks && (
                                <div className="col-span-2">
                                  <span className="text-gray-600">Remarks:</span>
                                  <p className="font-semibold text-gray-900">{record.remarks}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-600 mb-2">No Fee History</h3>
                      <p className="text-gray-500">No fee records found for this student</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          {!selectedStudent && (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <CreditCard className="w-20 h-20 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">Select Student</h3>
              <p className="text-gray-500">Choose a class and student to manage fee records</p>
            </div>
          )}
        </div>
      </div>
    </AuthWrapper>
  );
};

export default FeesPage;
