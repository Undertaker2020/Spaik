import { gql } from '@apollo/client';

export const FIND_MY_STREAM = gql`
  query FindMyStream {
    findProfile {
      id
      stream {
        id
        title
        isLive
        serverUrl
        streamKey
        thumbnailUrl
        isChatEnabled
        isChatFollowersOnly
        isChatPremiumFollowersOnly
        category { id title }
      }
    }
  }
`;

export const FIND_ALL_CATEGORIES = gql`
  query FindAllCategories {
    findAllCategories {
      id
      title
      slug
    }
  }
`;

export const CHANGE_STREAM_INFO = gql`
  mutation ChangeStreamInfo($data: ChangeStreamInfoInput!) {
    changeStreamInfo(data: $data)
  }
`;

export const CHANGE_CHAT_SETTINGS = gql`
  mutation ChangeChatSettings($data: ChangeChatSettingsInput!) {
    changeChatSettings(data: $data)
  }
`;

export const CREATE_INGRESS = gql`
  mutation CreateIngress($ingressType: Float!) {
    createIngress(ingressType: $ingressType)
  }
`;

export const GENERATE_STREAM_TOKEN = gql`
  mutation GenerateStreamToken($data: GenerateStreamTokenInput!) {
    generateStreamToken(data: $data) {
      token
    }
  }
`;

export interface StreamSettings {
  id: string;
  title: string;
  isLive: boolean;
  serverUrl: string | null;
  streamKey: string | null;
  thumbnailUrl: string | null;
  isChatEnabled: boolean;
  isChatFollowersOnly: boolean;
  isChatPremiumFollowersOnly: boolean;
  category: { id: string; title: string } | null;
}

export interface CategoryOption {
  id: string;
  title: string;
  slug: string;
}
