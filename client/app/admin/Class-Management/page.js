"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Eye,
  Edit,
  Trash2,
  Plus,
  X,
  BookOpen,
} from "lucide-react";
import AuthWrapper from "../components/AuthWrapper";

const API_BASE = "http://localhost:5001/admin/api/classes";

const initialClass = {
  class_name: "",
  section: "",
  class_teacher_id: "",
};

const ClassManagementPage = () => {
  const [selectedClass, setSelectedClass] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [selectedClassData, setSelectedClassData] = useState(null);
  const [allClasses, setAllClasses] = useState([]);
  const [allTeachers, setAllTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [addForm, setAddForm] = useState(initialClass);
  const [updateForm, setUpdateForm] = useState(initialClass);

  const router = useRouter();

  useEffect(() => {
    fetchClasses();
    fetchTeachers();
  }, []);

  const fetchClasses = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "Invalid token") {
          localStorage.removeItem("token");
          router.replace("/login");
          return;
        }
        throw new Error(data.error || "Failed to fetch classes");
      }
      setAllClasses(data || []);
    } catch (err) {
      setError(err.message);
      setAllClasses([]);
    }
    setLoading(false);
  };

  const fetchTeachers = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5001/admin/api/teachers", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch teachers");
      setAllTeachers(data || []);
    } catch (err) {
      setError(err.message);
    }
  };

  // Add Class Handlers
  const handleAddFormChange = (e) => {
    const { name, value } = e.target;
    setAddForm((prev) => ({ ...prev, [name]: value }));
  };

  const openAddForm = () => {
    setAddForm(initialClass);
    setShowAddForm(true);
  };

  const closeAddForm = () => {
    setShowAddForm(false);
    setAddForm(initialClass);
  };

  const addClass = async (classData) => {
    const res = await fetch(`${API_BASE}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(classData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to add class");
    return data;
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      await addClass(addForm);
      alert("Class added successfully!");
      fetchClasses();
      closeAddForm();
    } catch (err) {
      alert(err.message);
    }
  };

  // Update Class Handlers
  const handleUpdateFormChange = (e) => {
    const { name, value } = e.target;
    setUpdateForm((prev) => ({ ...prev, [name]: value }));
  };

  const openUpdateForm = (classData) => {
    setUpdateForm({
      ...initialClass,
      ...classData,
    });
    setShowUpdateForm(true);
    setShowPopup(false);
  };

  const closeUpdateForm = () => {
    setShowUpdateForm(false);
    setUpdateForm(initialClass);
  };

  const updateClass = async (id, classData) => {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(classData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to update class");
    return data;
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    const updatedData = { ...updateForm };
    delete updatedData.id;
    delete updatedData.created_at;
    delete updatedData.updated_at;
    delete updatedData.school_id;
    delete updatedData.teacher_name;

    try {
      await updateClass(updateForm.id, updatedData);
      alert("Class updated successfully!");
      fetchClasses();
      closeUpdateForm();
    } catch (err) {
      alert(err.message);
    }
  };

  // Delete Class
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this class?")) {
      try {
        const res = await fetch(`${API_BASE}/${id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to delete class");
        alert("Class deleted successfully!");
        fetchClasses();
        setShowPopup(false);
      } catch (err) {
        alert(err.message);
      }
    }
  };

  // View Class
  const handleViewClass = (classData) => {
    setSelectedClassData(classData);
    setShowPopup(true);
  };

  const handleClosePopup = () => {
    setShowPopup(false);
    setSelectedClassData(null);
  };

  // Class dropdown
  const classNames = Array.from(
    new Set(allClasses.map((c) => c.class_name).filter(Boolean))
  ).sort();

  const classesToShow = selectedClass
    ? allClasses.filter((c) => c.class_name === selectedClass)
    : allClasses;

  return (
    <AuthWrapper>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <BookOpen className="w-8 h-8 text-indigo-600" />
                <h1 className="text-3xl font-bold text-gray-800">
                  Class Management
                </h1>
              </div>
              <button
                onClick={openAddForm}
                className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-base transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <Plus className="w-5 h-5" />
                Add Class
              </button>
            </div>
            <div className="max-w-md">
              <label
                htmlFor="class-select"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Select Class
              </label>
              <select
                id="class-select"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-900"
              >
                <option value="">All Classes</option>
                {classNames.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            </div>
            {error && (
              <div className="mt-4 text-red-600 text-sm">{error}</div>
            )}
          </div>

          {/* Classes Table */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
              <h2 className="text-xl font-semibold text-white">
                {selectedClass
                  ? `Classes in ${selectedClass}`
                  : "All Classes"}{" "}
                ({classesToShow.length} classes)
              </h2>
            </div>
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading...</div>
            ) : classesToShow.length > 0 ? (
              <div className="overflow-x-auto text-black">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4">ID</th>
                      <th className="px-6 py-4">Class Name</th>
                      <th className="px-6 py-4">Section</th>
                      <th className="px-6 py-4">Teacher</th>
                      <th className="px-6 py-4">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {classesToShow.map((classData) => (
                      <tr key={classData.id}>
                        <td className="px-6 py-4 text-center">{classData.id}</td>
                        <td className="px-6 py-4 text-center">{classData.class_name}</td>
                        <td className="px-6 py-4 text-center">{classData.section}</td>
                        <td className="px-6 py-4 text-center">{classData.teacher_name || "-"}</td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleViewClass(classData)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
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
              <div className="px-6 py-12 text-center text-black">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">
                  {selectedClass
                    ? `No classes found for ${selectedClass}`
                    : "No classes found"}
                </p>
              </div>
            )}
          </div>

          {/* Add Class Modal */}
          {showAddForm && (
            <div className="fixed inset-0 backdrop-blur-sm bg-black/20 flex items-center justify-center p-4 z-50 text-black">
              <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4 rounded-t-2xl flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-semibold text-white">
                      Add New Class
                    </h3>
                  </div>
                  <button
                    onClick={closeAddForm}
                    className="text-white hover:text-gray-200"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <form className="p-6" onSubmit={handleAddSubmit}>
                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Class Name
                      </label>
                      <input
                        type="text"
                        name="class_name"
                        value={addForm.class_name}
                        onChange={handleAddFormChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Section
                      </label>
                      <input
                        type="text"
                        name="section"
                        value={addForm.section}
                        onChange={handleAddFormChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Class Teacher
                      </label>
                      <select
                        name="class_teacher_id"
                        value={addForm.class_teacher_id}
                        onChange={handleAddFormChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                      >
                        <option value="">Select Teacher</option>
                        {allTeachers.map((teacher) => (
                          <option key={teacher.id} value={teacher.id}>
                            {teacher.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="mt-8 flex justify-end gap-4">
                    <button
                      type="button"
                      onClick={closeAddForm}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Class
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Update Class Modal */}
          {showUpdateForm && (
            <div className="fixed inset-0 backdrop-blur-sm bg-black/20 flex items-center justify-center p-4 z-50 text-black">
              <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4 rounded-t-2xl flex justify-between items-center">
                  <h3 className="text-xl font-semibold text-white">
                    Update Class
                  </h3>
                  <button
                    onClick={closeUpdateForm}
                    className="text-white hover:text-gray-200"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <form className="p-6" onSubmit={handleUpdateSubmit}>
                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Class Name
                      </label>
                      <input
                        type="text"
                        name="class_name"
                        value={updateForm.class_name}
                        onChange={handleUpdateFormChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Section
                      </label>
                      <input
                        type="text"
                        name="section"
                        value={updateForm.section}
                        onChange={handleUpdateFormChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Class Teacher
                      </label>
                      <select
                        name="class_teacher_id"
                        value={updateForm.class_teacher_id || ""}
                        onChange={handleUpdateFormChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                      >
                        <option value="">Select Teacher</option>
                        {allTeachers.map((teacher) => (
                          <option key={teacher.id} value={teacher.id}>
                            {teacher.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="mt-8 flex justify-end gap-4">
                    <button
                      type="button"
                      onClick={closeUpdateForm}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg flex items-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Update Class
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* View Class Modal */}
          {showPopup && selectedClassData && (
            <div className="fixed inset-0 backdrop-blur-sm bg-black/10 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-screen overflow-y-auto">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 rounded-t-2xl flex justify-between items-center">
                  <h3 className="text-xl font-semibold text-white">
                    Class Details
                  </h3>
                  <button
                    onClick={handleClosePopup}
                    className="text-white hover:text-gray-200"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        ID
                      </label>
                      <p className="text-lg font-semibold text-gray-900">
                        {selectedClassData.id}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Class Name
                      </label>
                      <p className="text-lg text-gray-900">
                        {selectedClassData.class_name}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Section
                      </label>
                      <p className="text-lg text-gray-900">
                        {selectedClassData.section}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Class Teacher
                      </label>
                      <p className="text-lg text-gray-900">
                        {selectedClassData.teacher_name || "-"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Created At
                      </label>
                      <p className="text-lg text-gray-900">
                        {selectedClassData.created_at
                          ? new Date(selectedClassData.created_at).toLocaleDateString("en-IN")
                          : "-"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Updated At
                      </label>
                      <p className="text-lg text-gray-900">
                        {selectedClassData.updated_at
                          ? new Date(selectedClassData.updated_at).toLocaleDateString("en-IN")
                          : "-"}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="px-6 py-4 bg-gray-50 rounded-b-2xl flex justify-end gap-3">
                  <button
                    onClick={() => openUpdateForm(selectedClassData)}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    Update
                  </button>
                  <button
                    onClick={() => handleDelete(selectedClassData.id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthWrapper>
  );
};

export default ClassManagementPage;