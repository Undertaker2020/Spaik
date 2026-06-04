import { gql } from '@apollo/client';

// ── Documents ──────────────────────────────────────────────

export const LOGIN_MUTATION = gql`
  mutation LoginUser($data: LoginInput!) {
    login(data: $data) {
      user {
        username
      }
      message
    }
  }
`;

export const CREATE_USER_MUTATION = gql`
  mutation CreateUser($data: CreateUserInput!) {
    createUser(data: $data)
  }
`;

export const VERIFY_ACCOUNT_MUTATION = gql`
  mutation VerifyAccount($data: VerificationInput!) {
    verifyAccount(data: $data) {
      user {
        username
      }
      message
    }
  }
`;

// ── Types ──────────────────────────────────────────────────

export interface LoginData {
  login: {
    user: { username: string } | null;
    message: string | null;
  };
}

export interface LoginVars {
  data: { login: string; password: string; pin?: string };
}

export interface CreateUserData {
  createUser: boolean;
}

export interface CreateUserVars {
  data: { username: string; email: string; password: string };
}

