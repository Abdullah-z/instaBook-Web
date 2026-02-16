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

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If the error is 400/401 and it's not already a refresh token request
    if (
      (error.response?.status === 400 || error.response?.status === 401) &&
      !originalRequest._retry &&
      !originalRequest.url.includes("/refresh_token")
    ) {
      originalRequest._retry = true;
      try {
        const res = await axios.get(
          (import.meta.env.VITE_API_URL || "") + "/api/refresh_token",
          { withCredentials: true },
        );

        if (res.data.access_token) {
          localStorage.setItem("token", res.data.access_token);
          localStorage.setItem("user", JSON.stringify(res.data.user));
          API.defaults.headers.common["Authorization"] = res.data.access_token;
          originalRequest.headers["Authorization"] = res.data.access_token;
          return API(originalRequest);
        }
      } catch (refreshError) {
        // If refresh fails, clear storage and redirect (handled by AuthContext state ideally)
        localStorage.removeItem("firstLogin");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        // We can't use useNavigate here, but window.location works
        // window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export default API;
