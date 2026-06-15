import axios, { AxiosInstance } from "axios";

export const getAxiosInstance = (baseURL: string | undefined): AxiosInstance => {
  if (!baseURL) {
    throw new Error("Base URL is missing. Check your .env file");
  }

  const instance = axios.create({
    baseURL,
    headers: {
      "Content-Type": "application/json",
    },
  });

  return instance;
};
