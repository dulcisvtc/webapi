export interface PostAuthLoginResponse {
  access_token: string;
}

export interface PostAuthLogoutResponse {
  message: string;
}

export interface SessionInfoResponse {
  access_token: string;
  steamId: string;
  avatarUrl: string;
  createdAt: number;
  expiresAt: number;
}

export interface UserInfoResponse {
  steamId: string;
  discordId: string;
  username: string;
  avatarUrl: string;
  permissions: number;
}
