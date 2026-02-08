import React, { createContext, useState, useEffect } from "react";
import API from "../utils/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const firstLogin = localStorage.getItem("firstLogin");
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (firstLogin && storedToken && storedUser) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
      setLoading(false);
    } else if (firstLogin) {
      const checkUser = async () => {
        try {
          const res = await API.get("/refresh_token");
          setUser(res.data.user);
          setToken(res.data.access_token);
          localStorage.setItem("token", res.data.access_token);
          localStorage.setItem("user", JSON.stringify(res.data.user)); // Store user
        } catch (err) {
          localStorage.removeItem("firstLogin");
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setToken(null);
          setUser(null);
        }
        setLoading(false);
      };
      checkUser();
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await API.post("/login", { email, password });
    if (res.data.access_token) {
      localStorage.setItem("firstLogin", "true");
      localStorage.setItem("token", res.data.access_token);
      localStorage.setItem("user", JSON.stringify(res.data.user)); // Store user
      setToken(res.data.access_token);
      setUser(res.data.user);
      return res.data;
    }
    throw new Error(res.data.msg || "Login failed");
  };

  const logout = () => {
    localStorage.removeItem("firstLogin");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    API.post("/logout");
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
