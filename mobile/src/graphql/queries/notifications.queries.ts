import { gql } from '@apollo/client';

export const FIND_NOTIFICATIONS = gql`
  query FindNotificationByUser {
    findNotificationByUser {
      id
      message
      type
      isRead
      createdAt
    }
  }
`;

export const FIND_NOTIFICATION_UNREAD_COUNT = gql`
  query FindNotificationUnreadCount {
    findNotificationUnreadCount
  }
`;

export enum NotificationType {
  ENABLE_TWO_FACTOR = 'ENABLE_TWO_FACTOR',
  NEW_FOLLOWER = 'NEW_FOLLOWER',
  NEW_SPONSORSHIP = 'NEW_SPONSORSHIP',
  STREAM_START = 'STREAM_START',
  VERIFIED_CHANNEL = 'VERIFIED_CHANNEL',
}

export interface NotificationItem {
  id: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
}
