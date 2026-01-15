export interface Location {
  id: string;
  name: string;
  latitude?: number | null;
  longitude?: number | null;
  radiusMeters?: number | null;
  type: "GEO" | "WIFI" | "BLE";
  identifiers: string[];
  createdAt: string;
}

export interface Announcement {
  id: string;
  content: string;
  visibility: "PUBLIC" | "PRIVATE";
  deliveryMode: "CENTRALIZED" | "DECENTRALIZED";
  startsAt?: string | null;
  endsAt?: string | null;
  createdAt: string;
  author: {
    id: string;
    username: string;
  };
  location?: {
    id: string;
    name: string;
  } | null;
  reactions: Array<{ id: string; userId: string; type: "LIKE" }>;
  bookmarks: Array<{ id: string; userId: string }>;
  isVerified?: boolean;
  receivedViaMule?: boolean;
}

