import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import api from "../api/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");

    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      const accessToken = localStorage.getItem("accessToken");

      if (!accessToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get("/auth/profile/");

        setUser(response.data);

        localStorage.setItem(
          "user",
          JSON.stringify(response.data),
        );
      } catch {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");

        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const login = async (credentials) => {
    const response = await api.post(
      "/auth/login/",
      credentials,
    );

    const {
      access,
      refresh,
      user: loggedInUser,
    } = response.data;

    localStorage.setItem("accessToken", access);
    localStorage.setItem("refreshToken", refresh);
    localStorage.setItem(
      "user",
      JSON.stringify(loggedInUser),
    );

    setUser(loggedInUser);

    return loggedInUser;
  };

  const register = async (formData) => {
    const response = await api.post(
      "/auth/register/",
      formData,
    );

    return response.data;
  };

  const refreshProfile = async () => {
    const response = await api.get("/auth/profile/");

    const updatedUser = response.data;

    setUser(updatedUser);

    localStorage.setItem(
      "user",
      JSON.stringify(updatedUser),
    );

    return updatedUser;
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");

    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      refreshProfile,
      isAuthenticated: Boolean(user),
    }),
    [user, loading],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider",
    );
  }

  return context;
}