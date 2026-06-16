import axios, { AxiosInstance } from "axios";

export const getAxiosInstance = (baseURL: string | undefined): AxiosInstance => {
  if (!baseURL) {
    throw new Error("Base URL is missing. Check your .env file");
  }

  const instance = axios.create({
    baseURL,
    withCredentials: true, // Automatically send HttpOnly cookies with every request
    headers: {
      "Content-Type": "application/json",
    },
  });

  // Response interceptor to handle silent token refreshing
  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      // If error is 401 (Unauthorized) and we haven't already retried
      if (error.response?.status === 401 && !originalRequest._retry) {
        
        // Prevent infinite loops if the refresh or login endpoint itself fails
        if (
          !originalRequest.url.includes("/api/auth/refresh") &&
          !originalRequest.url.includes("/api/auth/login")
        ) {
          originalRequest._retry = true;

          try {
            // Call the refresh endpoint. Since it's a cookie, the browser sends it automatically.
            await axios.post("/api/auth/refresh", {}, { withCredentials: true });
            
            // The browser just received the new access_token cookie! 
            // Now, we retry the original request that failed
            return instance(originalRequest);
          } catch (refreshError) {
            // If refresh fails (token is totally expired or stolen), redirect to login
            if (typeof window !== "undefined") {
              window.location.href = "/login";
            }
            return Promise.reject(refreshError);
          }
        }
      }

      return Promise.reject(error);
    }
  );

  return instance;
};
