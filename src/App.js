import React, { useState, useEffect } from 'react';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';
import LocationTracker from './LocationTracker';
import { auth } from './firebase';
import { onAuthStateChanged } from "firebase/auth";

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
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
  };

  const handleShowLogin = () => {
    setIsRegistering(false);
  };

  if (!isAuthenticated) {
    return isRegistering ? (
      <RegisterPage onRegister={handleRegister} onShowLogin={handleShowLogin} />
    ) : (
      <LoginPage onLogin={handleLogin} onShowRegister={handleShowRegister} />
    );
  }

  return (
    <div className="App">
      <LocationTracker />
    </div>
  );
};

export default App;
