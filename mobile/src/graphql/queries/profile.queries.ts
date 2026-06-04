import { gql } from '@apollo/client';

export const FIND_MY_PROFILE = gql`
  query FindMyProfile {
    findProfile {
      id
      username
      displayName
      avatar
      email
      bio
      isVerified
      isTotpEnabled
      stream {
        id
        isLive
        title
        serverUrl
        streamKey
        isChatEnabled
        isChatFollowersOnly
        isChatPremiumFollowersOnly
      }
    }
  }
`;

export const CHANGE_PROFILE_INFO = gql`
  mutation ChangeProfileInfo($data: ChangeProfileInfoInput!) {
    changeProfileInfo(data: $data)
  }
`;

export const REMOVE_PROFILE_AVATAR = gql`
  mutation RemoveProfileAvatar {
    removeProfileAvatar
  }
`;

export const LOGOUT_MUTATION = gql`
  mutation LogoutUser {
    logout
  }
`;

export interface MyProfile {
  id: string;
  username: string;
  displayName: string;
  avatar: string | null;
  email: string;
  bio: string | null;
  isVerified: boolean;
  isTotpEnabled: boolean;
  stream: {
    id: string;
    isLive: boolean;
    title: string;
    serverUrl: string | null;
    streamKey: string | null;
    isChatEnabled: boolean;
    isChatFollowersOnly: boolean;
    isChatPremiumFollowersOnly: boolean;
  } | null;
}
