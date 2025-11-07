import { Platform } from "react-native";

const DEFAULT_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (Platform.OS === "android" ? "http://10.0.2.2:4000/api" : "http://127.0.0.1:4000/api");

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

interface RequestOptions<T> {
  method?: HttpMethod;
  token?: string | null;
  body?: T;
}

class ApiClient {
  constructor(private readonly baseUrl: string) {}

  async request<Response, Body = unknown>(path: string, options: RequestOptions<Body> = {}) {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (options.token) {
      headers.Authorization = `Bearer ${options.token}`;
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    const text = await response.text();
    const data = text ? (JSON.parse(text) as Response) : ({} as Response);

    if (!response.ok) {
      const error = (data as any)?.message || "Erro inesperado";
      throw new Error(error);
    }

    return data;
  }

  get<Response>(path: string, token?: string | null) {
    return this.request<Response>(path, { method: "GET", token });
  }

  post<Response, Body = unknown>(path: string, body: Body, token?: string | null) {
    return this.request<Response, Body>(path, { method: "POST", body, token });
  }

  put<Response, Body = unknown>(path: string, body: Body, token?: string | null) {
    return this.request<Response, Body>(path, { method: "PUT", body, token });
  }

  delete<Response>(path: string, token?: string | null) {
    return this.request<Response>(path, { method: "DELETE", token });
  }
}

export const api = new ApiClient(DEFAULT_BASE_URL);
export const API_BASE_URL = DEFAULT_BASE_URL;

