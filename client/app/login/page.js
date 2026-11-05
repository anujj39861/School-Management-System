"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  Eye,
  EyeOff,
  User,
  Mail,
  Lock,
  GraduationCap,
  ArrowRight,
  ArrowLeft,
  School,
  MapPin,
  Phone,
} from "lucide-react";

const InputField = ({
  icon: Icon,
  type,
  name,
  placeholder,
  value,
  error,
  onChange,
  showToggle = false,
  showPassword,
  setShowPassword,
  showConfirmPassword,
  setShowConfirmPassword,
}) => {
  const isPasswordField = name === "password";
  const isConfirmPasswordField = name === "confirmPassword";

  const resolvedType = showToggle
    ? isPasswordField
      ? showPassword
        ? "text"
        : "password"
      : showConfirmPassword
      ? "text"
      : "password"
    : type;

  const handleToggle = () => {
    if (isPasswordField) setShowPassword?.(!showPassword);
    else if (isConfirmPasswordField)
      setShowConfirmPassword?.(!showConfirmPassword);
  };

  return (
    <div className="relative mb-3 sm:mb-4">
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
        )}
        <input
          type={resolvedType}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={`w-full pl-10 sm:pl-12 pr-10 text-black sm:pr-12 py-2.5 sm:py-3 border-2 rounded-lg focus:outline-none focus:border-blue-500 transition-colors text-sm sm:text-base ${
            error ? "border-red-500" : "border-gray-200"
          } placeholder:text-gray-400`}
        />
        {showToggle && (
          <button
            type="button"
            onClick={handleToggle}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {(isPasswordField ? showPassword : showConfirmPassword) ? (
              <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
            ) : (
              <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
          </button>
        )}
      </div>
      {error && <p className="text-red-500 text-xs sm:text-sm mt-1">{error}</p>}
    </div>
  );
};

export default function AuthPages() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    schoolName: "",
    email: "",
    address: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const router = useRouter();
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!isLogin) {
      if (!formData.schoolName.trim()) {
        newErrors.schoolName = "School name is required";
      }

      if (!formData.address.trim()) {
        newErrors.address = "Address is required";
      }

      if (!formData.phone.trim()) {
        newErrors.phone = "Phone number is required";
      } else if (!/^\+?[\d\s\-\(\)]{10,}$/.test(formData.phone)) {
        newErrors.phone = "Please enter a valid phone number";
      }
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!isLogin && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setIsLoading(true);

    try {
      let response;
      if (isLogin) {
        // Login API
        response = await fetch("http://localhost:5001/admin/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        });
      } else {
        // Register API
        response = await fetch("http://localhost:5001/admin/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.schoolName,
            email: formData.email,
            address: formData.address,
            phone: formData.phone,
            password: formData.password,
          }),
        });
      }

      const data = await response.json();
      if (!response.ok) {
        alert(
          data.message
        )
        setErrors({ api: data.message || "Something went wrong" });
      } else {
        if (isLogin) {
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));
          router.push("/");
        } else {
          setIsLogin(true);
        }
        alert(
          data.message || (isLogin ? "Login successful!" : "Signup successful!")
        );
      }
    } catch (err) {
      setErrors({ api: "Network error. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Token presence check on mount if needed
    localStorage.getItem("token");
  }, []);

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setFormData({
      schoolName: "",
      email: "",
      address: "",
      phone: "",
      password: "",
      confirmPassword: "",
    });
    setErrors({});
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden w-full max-w-6xl min-h-[500px] sm:min-h-[600px] flex flex-col lg:flex-row">
        <div
          className={`w-full lg:w-1/2 bg-gradient-to-br from-blue-500 to-purple-600 p-6 sm:p-8 lg:p-12 flex flex-col justify-center items-center text-white relative overflow-hidden transition-all duration-700 ${
            isLogin ? "lg:rounded-r-[100px]" : "lg:rounded-l-[100px]"
          } ${isLogin ? "order-1 lg:order-1" : "order-2 lg:order-1"}`}
        >
          <div className="absolute inset-0 bg-black opacity-10"></div>
          <div className="relative z-10 text-center">
            <GraduationCap className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-6" />
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">
              {isLogin ? "Welcome Back!" : "Join Us Today!"}
            </h2>
            <p className="text-base sm:text-lg mb-6 sm:mb-8 opacity-90 px-2">
              {isLogin
                ? "Access your student portal and manage your academic journey"
                : "Create your account and start your educational adventure"}
            </p>
            <button
              onClick={toggleMode}
              className="flex items-center gap-2 bg-white bg-opacity-20 backdrop-blur-sm border border-white border-opacity-30 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-full hover:bg-opacity-30 transition-all duration-300 font-medium text-sm sm:text-base"
            >
              {isLogin ? (
                <>
                  <span className="text-black">New here? Sign Up</span>
                  <ArrowRight className="w-4 h-4 text-blue-500" />
                </>
              ) : (
                <>
                  <ArrowLeft className="text-blue-500 w-4 h-4" />
                  <span className="text-black">
                    Already have account? Sign In
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

        <div
          className={`w-full lg:w-1/2 p-4 sm:p-6 lg:p-12 flex flex-col justify-center ${
            isLogin ? "order-2 lg:order-2" : "order-1 lg:order-2"
          }`}
        >
          <div className="max-w-md mx-auto w-full">
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2 text-center">
              {isLogin ? "Sign In" : "Create Account"}
            </h3>
            <p className="text-gray-600 text-center mb-6 sm:mb-8 text-sm sm:text-base px-2">
              {isLogin
                ? "Enter your credentials to access your account"
                : "Fill in your information to get started"}
            </p>

            <div className="space-y-3 sm:space-y-4">
              {!isLogin && (
                <>
                  <InputField
                    icon={School}
                    type="text"
                    name="schoolName"
                    placeholder="School Name"
                    value={formData.schoolName}
                    error={errors.schoolName}
                    onChange={handleInputChange}
                  />

                  <InputField
                    icon={MapPin}
                    type="text"
                    name="address"
                    placeholder="Address"
                    value={formData.address}
                    error={errors.address}
                    onChange={handleInputChange}
                  />

                  <InputField
                    icon={Phone}
                    type="tel"
                    name="phone"
                    placeholder="Phone Number"
                    value={formData.phone}
                    error={errors.phone}
                    onChange={handleInputChange}
                  />
                </>
              )}

              <InputField
                icon={Mail}
                type="email"
                name="email"
                placeholder="Email Address"
                value={formData.email}
                error={errors.email}
                onChange={handleInputChange}
              />

              <InputField
                icon={Lock}
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                error={errors.password}
                showToggle={true}
                showPassword={showPassword}
                setShowPassword={setShowPassword}
                onChange={handleInputChange}
              />

              {!isLogin && (
                <InputField
                  icon={Lock}
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  error={errors.confirmPassword}
                  showToggle={true}
                  showConfirmPassword={showConfirmPassword}
                  setShowConfirmPassword={setShowConfirmPassword}
                  onChange={handleInputChange}
                />
              )}

              {isLogin && (
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 gap-2 sm:gap-0">
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-sm text-gray-600">Remember me</span>
                  </label>
                  <a
                    href="#"
                    className="text-sm text-blue-500 hover:text-blue-700"
                  >
                    Forgot Password?
                  </a>
                </div>
              )}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 sm:py-4 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    {isLogin ? "Signing In..." : "Creating Account..."}
                  </div>
                ) : isLogin ? (
                  "Sign In"
                ) : (
                  "Create Account"
                )}
              </button>
            </div>

            <div className="mt-4 sm:mt-6 text-center">
              <p className="text-gray-600 text-xs sm:text-sm">
                {isLogin
                  ? "Don't have an account? "
                  : "Already have an account? "}
                <button
                  onClick={toggleMode}
                  className="text-blue-500 hover:text-blue-700 font-medium"
                >
                  {isLogin ? "Sign Up" : "Sign In"}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
