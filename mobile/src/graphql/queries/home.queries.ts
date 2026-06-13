import { gql } from '@apollo/client';

export const FIND_RANDOM_STREAMS = gql`
  query FindRandomStreams($filters: FiltersInput) {
    findRandomStreams(filters: $filters) {
      title
      thumbnailUrl
      isLive
      user {
        username
        avatar
        isVerified
      }
      category {
        id
        title
        slug
      }
    }
  }
`;

export const FIND_RANDOM_CATEGORIES = gql`
  query FindRandomCategories {
    findRandomCategories {
      title
      slug
      thumbnailUrl
    }
  }
`;

export const FIND_ALL_STREAMS = gql`
  query FindAllStreams($filters: FiltersInput!) {
    findAllStreams(filters: $filters) {
      id
      title
      thumbnailUrl
      isLive
      user {
        username
        avatar
        isVerified
      }
      category {
        id
        title
        slug
      }
    }
  }
`;

export interface StreamItem {
  id?: string;
  title: string;
  thumbnailUrl: string | null;
  isLive: boolean;
  user: {
    username: string;
    avatar: string | null;
    isVerified: boolean;
  };
  category: {
    title: string;
    slug: string;
  } | null;
}

export interface CategoryItem {
  title: string;
  slug: string;
  thumbnailUrl: string | null;
}
