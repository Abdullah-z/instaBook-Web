import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL + "/api",
  timeout: 15000,
});

API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = token;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

export default API;
