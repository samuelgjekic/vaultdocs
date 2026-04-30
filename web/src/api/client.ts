import axios from "axios";

export const apiBaseURL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1";

export const api = axios.create({
  baseURL: apiBaseURL,
  withCredentials: true,
});
