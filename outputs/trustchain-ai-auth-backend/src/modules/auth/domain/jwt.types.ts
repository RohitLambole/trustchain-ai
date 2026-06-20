export interface JwtAccessClaims {
  sub: string;
  email: string;
  roles: string[];
  permissions: string[];
  sessionId: string;
  jti: string;
  authLevel: "PASSWORD" | "TOTP";
  trustScore: number;
  tokenUse: "access";
}

export interface JwtRefreshClaims {
  sub: string;
  sessionId: string;
  jti: string;
  tokenUse: "refresh";
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
}
