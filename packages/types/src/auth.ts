export interface User {
  id: string;
  phone: string;
  role: string;
  name?: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface Session {
  id: string;
  deviceLabel: string;
  ipAddress: string;
  createdAt: Date;
  expiresAt: Date;
}
