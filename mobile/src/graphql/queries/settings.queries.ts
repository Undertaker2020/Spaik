import { gql } from '@apollo/client';

// ── Password ──────────────────────────────────────────────────

export const CHANGE_PASSWORD = gql`
  mutation ChangePassword($data: ChangePasswordInput!) {
    changePassword(data: $data)
  }
`;

// ── Email ─────────────────────────────────────────────────────

export const CHANGE_EMAIL = gql`
  mutation ChangeEmail($data: ChangeEmailInput!) {
    changeEmail(data: $data)
  }
`;

// ── Sessions ──────────────────────────────────────────────────

export const FIND_SESSIONS = gql`
  query FindSessionByUser {
    findSessionByUser {
      id
      createdAt
      metadata {
        ip
        device { browser os type }
        location { city country }
      }
    }
  }
`;

export const FIND_CURRENT_SESSION = gql`
  query FindCurrentSession {
    findCurrentSession {
      id
      createdAt
      metadata {
        ip
        device { browser os type }
        location { city country }
      }
    }
  }
`;

export const REMOVE_SESSION = gql`
  mutation RemoveSession($id: String!) {
    removeSession(id: $id)
  }
`;

export interface SessionMetadata {
  ip: string;
  device: { browser: string; os: string; type: string };
  location: { city: string; country: string };
}

export interface SessionItem {
  id: string;
  createdAt: string;
  metadata: SessionMetadata;
}

// ── Stream keys ───────────────────────────────────────────────

export const CREATE_INGRESS = gql`
  mutation CreateIngress($ingressType: Float!) {
    createIngress(ingressType: $ingressType)
  }
`;

// ── Chat settings ─────────────────────────────────────────────

export const CHANGE_CHAT_SETTINGS = gql`
  mutation ChangeChatSettings($data: ChangeChatSettingsInput!) {
    changeChatSettings(data: $data)
  }
`;

// ── Two-factor auth ───────────────────────────────────────────

export const GENERATE_TOTP_SECRET = gql`
  query GenerateTotpSecret {
    generateTotpSecret {
      secret
      qrcodeUrl
    }
  }
`;

export const ENABLE_TOTP = gql`
  mutation EnableTotp($data: EnableTotpInput!) {
    enableTotp(data: $data)
  }
`;

export const DISABLE_TOTP = gql`
  mutation DisableTotp {
    disableTotp
  }
`;
