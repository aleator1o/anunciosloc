import { Platform } from "react-native";

// Para dispositivo físico Android, você precisa usar o IP local da sua máquina
// Exemplo: http://192.168.1.100:4000/api (substitua pelo IP da sua máquina na rede)
// Para descobrir seu IP: Windows: ipconfig | Linux/Mac: ifconfig
const getBaseUrl = () => {
  // Se houver variável de ambiente, usar ela (prioridade máxima)
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // Para web, detectar o hostname atual e usar o mesmo para a API
  if (Platform.OS === "web") {
    // Se estiver rodando no navegador, detectar o hostname
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname;
      // Se for localhost ou 127.0.0.1, usar localhost
      if (hostname === "localhost" || hostname === "127.0.0.1") {
        return "http://localhost:4000/api";
      }
      // Caso contrário, usar o mesmo hostname (IP da rede)
      return `http://${hostname}:4000/api`;
    }
    // Fallback para localhost se window não estiver disponível
    return "http://localhost:4000/api";
  }

  // Para Android emulador (padrão se não houver EXPO_PUBLIC_API_URL)
  if (Platform.OS === "android") {
    // Emulador Android usa 10.0.2.2 para acessar localhost da máquina host
    // Se for dispositivo físico, você precisa configurar EXPO_PUBLIC_API_URL
    // com o IP da sua máquina, exemplo: EXPO_PUBLIC_API_URL=http://192.168.1.100:4000/api
    return "http://10.0.2.2:4000/api"; // Emulador Android
  }

  // Para iOS emulador (padrão)
  return "http://127.0.0.1:4000/api";
};

const DEFAULT_BASE_URL = getBaseUrl();

// Log da URL base para debug
console.log(`[API] URL base configurada: ${DEFAULT_BASE_URL} (Platform: ${Platform.OS})`);

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

interface RequestOptions<T> {
  method?: HttpMethod;
  token?: string | null;
  body?: T;
  timeout?: number;
}

// Timeout padrão de 15 segundos
const DEFAULT_TIMEOUT = 15000;

class ApiClient {
  constructor(private readonly baseUrl: string) {}

  async request<Response, Body = unknown>(path: string, options: RequestOptions<Body> = {}) {
    const timeout = options.timeout ?? DEFAULT_TIMEOUT;
    const url = `${this.baseUrl}${path}`;

    console.log(`[API] ${options.method ?? "GET"} ${url}`);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (options.token) {
      headers.Authorization = `Bearer ${options.token}`;
    }

    try {
      // Criar um controller para timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        method: options.method ?? "GET",
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const text = await response.text();
      let data: any = {};

      try {
        data = text ? JSON.parse(text) : {};
      } catch (parseError) {
        console.error("[API] Erro ao fazer parse da resposta:", parseError);
        throw new Error("Resposta inválida do servidor");
      }

      if (!response.ok) {
        const error = data?.message || `Erro ${response.status}: ${response.statusText}`;
        console.error(`[API] Erro ${response.status}:`, error);
        throw new Error(error);
      }

      console.log(`[API] Sucesso:`, data);
      return data as Response;
    } catch (error: any) {
      if (error.name === "AbortError") {
        console.error("[API] Timeout na requisição");
        throw new Error("Tempo de espera esgotado. Verifique sua conexão com o servidor.");
      }

      if (error.message.includes("Network request failed") || error.message.includes("Failed to fetch")) {
        console.error("[API] Erro de rede:", error);
        throw new Error(
          `Não foi possível conectar ao servidor. Verifique:\n` +
          `1. Se o backend está rodando na porta 4000\n` +
          `2. Se está usando o IP correto (dispositivo físico precisa do IP da máquina)\n` +
          `3. Se o dispositivo e o computador estão na mesma rede WiFi\n` +
          `4. Configure EXPO_PUBLIC_API_URL no arquivo .env com o IP correto`
        );
      }

      console.error("[API] Erro:", error);
      throw error;
    }
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

// --------- Perfil (pares chave-valor) ---------
export interface ProfileAttribute {
  id: string;
  key: string;
  value: string;
  createdAt: string;
}

export async function fetchProfileAttributes(token: string) {
  return api.get<{ attributes: ProfileAttribute[] }>("/profile/attributes", token);
}

export async function upsertProfileAttribute(token: string, key: string, value: string) {
  return api.post<{ attribute: ProfileAttribute }, { key: string; value: string }>("/profile/attributes", { key, value }, token);
}

export async function deleteProfileAttribute(token: string, key: string) {
  return api.delete<void>(`/profile/attributes/${encodeURIComponent(key)}`, token);
}

export async function fetchPublicProfileKeys() {
  return api.get<{ keys: string[] }>("/profile/keys");
}

