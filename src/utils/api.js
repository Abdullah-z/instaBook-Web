import axios from "axios";

const API = axios.create({
  baseURL: "https://instabook-server-production.up.railway.app/api",
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
