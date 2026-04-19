import axios from "axios";

const publicApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL + "/api",
  timeout: 15000,
});

export default publicApi;
