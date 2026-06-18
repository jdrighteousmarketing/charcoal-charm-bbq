import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState(null);

  useEffect(() => {
    checkUserAuth();
  }, []);

  const checkUserAuth = async () => {
    setIsLoadingAuth(true);
    setAuthError(null);

    const demoUser = localStorage.getItem("pitstop_demo_user");

    if (demoUser) {
      const parsedUser = JSON.parse(demoUser);

      setUser({
        id: "demo-user-1",
        email: parsedUser.email,
        full_name: "Demo Customer",
        role: parsedUser.role || "user",
      });

      setIsAuthenticated(true);
    } else {
      setUser(null);
      setIsAuthenticated(false);
    }

    setIsLoadingAuth(false);
    setAuthChecked(true);
  };

  const checkAppState = async () => {
    await checkUserAuth();
  };

  const logout = (shouldRedirect = true) => {
    localStorage.removeItem("pitstop_demo_user");
    setUser(null);
    setIsAuthenticated(false);

    if (shouldRedirect) {
      window.location.href = "/login";
    }
  };

  const navigateToLogin = () => {
    window.location.href = "/login";
  };

  const isAdminRole =
    ['owner_admin', 'employee', 'admin'].includes(user?.role) ||
    ['editor', 'admin', 'owner'].includes(user?.collaborator_role);

  const isOwnerAdmin =
    user?.role === 'owner_admin' ||
    user?.role === 'admin' ||
    ['editor', 'admin', 'owner'].includes(user?.collaborator_role);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      authChecked,
      logout,
      navigateToLogin,
      checkUserAuth,
      checkAppState,
      isAdminRole,
      isOwnerAdmin
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};