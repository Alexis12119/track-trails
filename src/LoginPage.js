import React, { useState, useEffect } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const LoginPage = ({ onLogin, onShowRegister, onShowResetPassword }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  useEffect(() => {
    const rememberedEmail = localStorage.getItem("rememberedEmail");
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await signInWithEmailAndPassword(auth, email, password);
      if (rememberMe) {
        localStorage.setItem("rememberedEmail", email);
      } else {
        localStorage.removeItem("rememberedEmail");
      }
      onLogin();
    } catch (error) {
      if (
        error.code === "auth/user-not-found" ||
        error.code === "auth/invalid-email"
      ) {
        setEmailError(error.message);
        setPasswordError("");
      } else if (error.code === "auth/wrong-password") {
        setPasswordError(error.message);
        setEmailError("");
      } else {
        setEmailError(error.message);
        setPasswordError("");
      }
    }
  };

  const handleFocus = (field) => {
    if (field === "email") {
      setEmailError("");
    } else if (field === "password") {
      setPasswordError("");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full relative">
        <h2 className="text-2xl font-bold mb-6">Login</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4 relative">
            <label className="block text-gray-700 mb=2">Email</label>
            <input
              type="email"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 ${emailError ? "border-red-500" : ""}`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => handleFocus("email")}
              autoComplete="off"
            />
            {emailError && (
              <div className="absolute left-0 mt-1 text-xs bg-red-500 text-white p-2 rounded">
                {emailError}
              </div>
            )}
          </div>
          <div className="mb-6 relative">
            <label className="block text-gray-700 mb=2">Password</label>
            <div className="relative">
            <input
              type={passwordVisible ? "text" : "password"}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 ${passwordError ? "border-red-500" : ""}`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => handleFocus("password")}
              autoComplete="new-password"
              name="new-password"
            />
            <div
              className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
              onClick={togglePasswordVisibility}
            >
              {passwordVisible ? <FaEyeSlash /> : <FaEye />}
            </div>
    </div>
            {passwordError && (
              <div className="absolute left-0 mt-1 text-xs bg-red-500 text-white p-2 rounded">
                {passwordError}
              </div>
            )}
          </div>
          <div className="mb-4 flex items-center">
            <input
              type="checkbox"
              className="mr-2"
              checked={rememberMe}
              onChange={() => setRememberMe(!rememberMe)}
            />
            <label className="text-gray-700">Remember Me</label>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition duration-300"
          >
            Login
          </button>
        </form>
        <div className="mt-4 text-center">
          <p>
            Forgot your password?{" "}
            <button
              onClick={onShowResetPassword}
              className="text-blue-600 hover:underline"
            >
              Reset Password
            </button>
          </p>
          <p>
            Don't have an account?{" "}
            <button
              onClick={onShowRegister}
              className="text-blue-600 hover:underline"
            >
              Register
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
