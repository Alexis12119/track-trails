import React, { useState, useEffect } from 'react';
import { ColorRing } from 'react-loader-spinner';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';
import ResetPasswordPage from './ResetPasswordPage';
import LocationTracker from './LocationTracker';
import { auth } from './firebase';
import { onAuthStateChanged } from "firebase/auth";

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [loadingAuthState, setLoadingAuthState] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      setLoadingAuthState(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleRegister = () => {
    setIsAuthenticated(true);
  };

  const handleShowRegister = () => {
    setIsRegistering(true);
    setIsResettingPassword(false);
  };

  const handleShowLogin = () => {
    setIsRegistering(false);
    setIsResettingPassword(false);
  };

  const handleShowResetPassword = () => {
    setIsResettingPassword(true);
    setIsRegistering(false);
  };

  if (loadingAuthState) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <ColorRing
          visible={true}
          height="80"
          width="80"
          ariaLabel="color-ring-loading"
          wrapperStyle={{}}
          wrapperClass="color-ring-wrapper"
          colors={['#e15b64', '#f47e60', '#f8b26a', '#abbd81', '#849b87']}
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    if (isResettingPassword) {
      return <ResetPasswordPage onBackToLogin={handleShowLogin} />;
    }
    return isRegistering ? (
      <RegisterPage onRegister={handleRegister} onShowLogin={handleShowLogin} />
    ) : (
      <LoginPage onLogin={handleLogin} onShowRegister={handleShowRegister} onShowResetPassword={handleShowResetPassword} />
    );
  }

  return (
    <div className="App">
      <LocationTracker />
    </div>
  );
};

export default App;
