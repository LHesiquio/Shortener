export interface PublicUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  nickname?: string;
  status: 'active' | 'inactive';
  timezone?: string;
  twoFactorEnabled?: boolean;
  createdAt: string;
}

export interface LoginResponsePayload {
  user?: PublicUser;
  accessToken?: string;
  mfaRequired?: boolean;
  mfaToken?: string;
  email?: string;
}

export interface RegisterResponsePayload {
  user: PublicUser;
  accessToken?: string;
  message?: string;
}

export interface VerifyEmailResponsePayload {
  activated?: boolean;
  alreadyActive?: boolean;
  userId: string;
}

export interface ResendVerificationResponsePayload {
  message: string;
}
