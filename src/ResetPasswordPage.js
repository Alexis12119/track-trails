import React, { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "./firebase";

const ResetPasswordPage = ({ onBackToLogin }) => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const handlePasswordReset = async () => {
    if (!email) {
      setError("Please enter your email address");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setResetEmailSent(true);
      setError("");
    } catch (error) {
      setError(error.message);
    }
  };

  const handleFocus = () => {
    setError("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full relative">
        <h2 className="text-2xl font-bold mb-6">Reset Password</h2>
        <div className="mb-4 relative">
          <label className="block text-gray-700 mb-2">Email</label>
          <input
            type="email"
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 ${error ? "border-red-500" : ""}`}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={handleFocus}
          />
          {error && (
            <div className="absolute left-4 mt-1 text-xs bg-red-500 text-white p-2 rounded">
              {error}
            </div>
          )}
          {resetEmailSent && (
            <p className="text-green-500 mb-4">Password reset email sent!</p>
          )}
        </div>
        <button
          onClick={handlePasswordReset}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition duration-300"
        >
          Reset Password
        </button>
        <div className="mt-4 text-center">
          <button
            onClick={onBackToLogin}
            className="text-blue-600 hover:underline"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
