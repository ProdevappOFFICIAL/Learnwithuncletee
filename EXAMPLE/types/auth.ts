import { User, ApiResponse } from "./index";

export interface AuthData {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export type AuthResponse = ApiResponse<AuthData>;
