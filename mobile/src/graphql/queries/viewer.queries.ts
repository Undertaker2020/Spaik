import { gql } from '@apollo/client';

export const FIND_CHANNEL_BY_USERNAME = gql`
  query FindChannelByUsername($username: String!) {
    findChannelByUsername(username: $username) {
      id
      username
      displayName
      avatar
      bio
      isVerified
      followers  { id }
      followings { id }
      socialLinks { id title url }
      stream {
        id
        title
        isLive
        thumbnailUrl
        isChatEnabled
        isChatFollowersOnly
        category { id title }
      }
    }
  }
`;

export const FIND_CHAT_MESSAGES = gql`
  query FindChatMessages($streamId: String!) {
    findChatMessagesByStream(streamId: $streamId) {
      id
      text
      createdAt
      user { id username avatar }
    }
  }
`;

export const CHAT_MESSAGE_ADDED = gql`
  subscription ChatMessageAdded($streamId: String!) {
    chatMessageAdded(streamId: $streamId) {
      id
      text
      createdAt
      user { id username avatar }
    }
  }
`;

export const SEND_CHAT_MESSAGE = gql`
  mutation SendChatMessage($data: SendMessageInput!) {
    sendChatMessage(data: $data) { id }
  }
`;

export const FIND_RECORDINGS_BY_CHANNEL = gql`
  query FindRecordingsByChannel($channelId: String!) {
    findRecordingsByChannel(channelId: $channelId) {
      id
      title
      url
      thumbnailUrl
      duration
      createdAt
    }
  }
`;

export const FOLLOW_CHANNEL = gql`
  mutation FollowChannel($channelId: String!) {
    followChannel(channelId: $channelId)
  }
`;

export const UNFOLLOW_CHANNEL = gql`
  mutation UnfollowChannel($channelId: String!) {
    unfollowChannel(channelId: $channelId)
  }
`;

export interface ChatMessage {
  id: string;
  text: string;
  createdAt: string;
  user: { id: string; username: string; avatar: string | null };
}

export interface Recording {
  id: string;
  title: string;
  url: string;
  thumbnailUrl: string | null;
  duration: number | null;
  createdAt: string;
}

export interface ChannelInfo {
  id: string;
  username: string;
  displayName: string;
  avatar: string | null;
  bio: string | null;
  isVerified: boolean;
  followers:   { id: string }[] | null;
  followings:  { id: string }[] | null;
  socialLinks: { id: string; title: string; url: string }[] | null;
  stream: {
    id: string;
    title: string;
    isLive: boolean;
    thumbnailUrl: string | null;
    isChatEnabled: boolean;
    isChatFollowersOnly: boolean;
    category: { title: string } | null;
  } | null;
}
