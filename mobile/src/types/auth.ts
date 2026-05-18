export type AuthTokens = {
  accessToken: string;
  idToken: string;
  refreshToken?: string;
  expiresIn: number;
  tokenType: string;
};

export type AuthUser = {
  email: string;
};

export type AuthSession = {
  user: AuthUser;
  tokens: AuthTokens;
};

export type AuthMode = 'login' | 'register' | 'confirm' | 'forgot' | 'reset';
