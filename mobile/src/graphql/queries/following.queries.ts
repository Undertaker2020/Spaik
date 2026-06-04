import { gql } from '@apollo/client';

export const FIND_MY_FOLLOWINGS = gql`
  query FindMyFollowings {
    findMyFollowings {
      createdAt
      following {
        id
        username
        displayName
        avatar
        isVerified
        stream {
          isLive
          title
          thumbnailUrl
          category { title }
        }
      }
    }
  }
`;

export interface FollowingChannel {
  id: string;
  username: string;
  displayName: string;
  avatar: string | null;
  isVerified: boolean;
  stream: {
    isLive: boolean;
    title: string;
    thumbnailUrl: string | null;
    category: { title: string } | null;
  } | null;
}

export interface FollowItem {
  createdAt: string;
  following: FollowingChannel;
}
