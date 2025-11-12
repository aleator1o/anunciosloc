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

// Log da URL base para debug com informações detalhadas
const hasEnvUrl = !!process.env.EXPO_PUBLIC_API_URL;
console.log(`[API] ========================================`);
console.log(`[API] URL base configurada: ${DEFAULT_BASE_URL}`);
console.log(`[API] Platform: ${Platform.OS}`);
console.log(`[API] EXPO_PUBLIC_API_URL configurado: ${hasEnvUrl ? '✅ SIM' : '❌ NÃO'}`);
if (!hasEnvUrl && Platform.OS === "android") {
  console.log(`[API] ⚠️  ATENÇÃO: Usando IP de emulador (10.0.2.2)`);
  console.log(`[API] ⚠️  Se estiver usando dispositivo físico ou Expo Go:`);
  console.log(`[API] ⚠️  1. Crie arquivo .env na raiz do projeto`);
  console.log(`[API] ⚠️  2. Adicione: EXPO_PUBLIC_API_URL=http://192.168.100.13:4000/api`);
  console.log(`[API] ⚠️  3. Reinicie o Expo`);
}
console.log(`[API] ========================================`);

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

interface RequestOptions<T> {
  method?: HttpMethod;
  token?: string | null;
  body?: T;
  timeout?: number;
}

// Timeout padrão de 30 segundos (aumentado para conexões mais lentas)
const DEFAULT_TIMEOUT = 30000;

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
        const currentUrl = url;
        const isEmulator = currentUrl.includes("10.0.2.2");
        const isPhysicalDevice = !isEmulator && Platform.OS === "android";
        
        let errorMsg = "Tempo de espera esgotado ao conectar ao servidor.\n\n";
        errorMsg += `URL tentada: ${currentUrl}\n\n`;
        
        if (isPhysicalDevice || !process.env.EXPO_PUBLIC_API_URL) {
          errorMsg += "⚠️ Dispositivo físico detectado!\n\n";
          errorMsg += "Para dispositivos físicos, você precisa:\n";
          errorMsg += "1. Criar arquivo .env na raiz do projeto\n";
          errorMsg += "2. Adicionar: EXPO_PUBLIC_API_URL=http://192.168.100.13:4000/api\n";
          errorMsg += "3. Reiniciar o Expo (Ctrl+C e depois 'npm start')\n\n";
          errorMsg += "Seu IP atual: 192.168.100.13\n";
        } else {
          errorMsg += "Verifique:\n";
          errorMsg += "1. Se o backend está rodando (npm run dev no diretório backend)\n";
          errorMsg += "2. Se está na mesma rede WiFi\n";
          errorMsg += "3. Se o firewall não está bloqueando a porta 4000\n";
        }
        
        throw new Error(errorMsg);
      }

      if (error.message.includes("Network request failed") || error.message.includes("Failed to fetch")) {
        console.error("[API] Erro de rede:", error);
        const currentUrl = url;
        const isEmulator = currentUrl.includes("10.0.2.2");
        const isPhysicalDevice = !isEmulator && Platform.OS === "android";
        
        let errorMsg = "Não foi possível conectar ao servidor.\n\n";
        errorMsg += `URL tentada: ${currentUrl}\n\n`;
        
        if (isPhysicalDevice || !process.env.EXPO_PUBLIC_API_URL) {
          errorMsg += "⚠️ Dispositivo físico detectado!\n\n";
          errorMsg += "Para dispositivos físicos, você precisa:\n";
          errorMsg += "1. Criar arquivo .env na raiz do projeto\n";
          errorMsg += "2. Adicionar: EXPO_PUBLIC_API_URL=http://192.168.100.13:4000/api\n";
          errorMsg += "3. Reiniciar o Expo (Ctrl+C e depois 'npm start')\n\n";
          errorMsg += "Seu IP atual: 192.168.100.13\n";
        } else {
          errorMsg += "Verifique:\n";
          errorMsg += "1. Se o backend está rodando na porta 4000\n";
          errorMsg += "2. Se está usando o IP correto\n";
          errorMsg += "3. Se o dispositivo e o computador estão na mesma rede WiFi\n";
        }
        
        throw new Error(errorMsg);
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

// --------- Presença e Localização ---------
export interface LocationUpdate {
  latitude?: number;
  longitude?: number;
  wifiIds?: string[];
}

export async function updateUserLocation(token: string, location: LocationUpdate) {
  return api.post<{ status: string }, LocationUpdate>("/presence/location", location, token);
}

// --------- Anúncios Disponíveis e Recebidos ---------
export async function fetchAvailableAnnouncements(token: string) {
  return api.get<{ announcements: any[] }>("/announcements/available", token);
}

export async function receiveAnnouncement(token: string, announcementId: string) {
  return api.post<{ received: any }, void>(`/announcements/${announcementId}/receive`, undefined, token);
}

// --------- Modo Descentralizado (P2P) ---------
export async function fetchDecentralizedAnnouncements(token: string) {
  return api.get<{ announcements: any[] }>("/announcements/decentralized", token);
}

export async function verifyAnnouncementLocation(token: string, announcementId: string) {
  return api.post<{ isAtLocation: boolean; reason?: string }, void>(
    `/announcements/${announcementId}/verify-location`,
    undefined,
    token
  );
}

