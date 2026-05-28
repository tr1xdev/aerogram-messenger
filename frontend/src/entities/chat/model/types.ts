export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName?: string | null;
  username?: string;
  photoUrl?: string | null;
  status: string;
  bio?: string | null;
  lastSeen?: string | null;
  isVerified?: boolean;
  isBot: boolean;
  isTyping?: boolean;
}

export interface Message {
  __typename?: "Message";
  id: string;
  chatId: string;
  text: string;
  sentAt: string;
  sequence?: number;
  isRead: boolean;
  isEdited: boolean;
  isSending?: boolean;
  sender: User;
  replyTo?: Message | null;
  forwardedFrom?: Message | null;
}

export type ChatType = "PRIVATE" | "GROUP" | "CHANNEL" | "DIRECT";

export interface ChatMember {
  user: User;
  lastReadSequence: number;
}

export interface Chat {
  id: string;
  type: ChatType;
  title: string;
  slug?: string | null;
  membersCount?: number;
  photoUrl?: string | null;
  members: ChatMember[];
  lastMessage?: Message | null;
  unreadCount: number;
  lastReadSequence: number;
  myReadSequence: number;
  isPinned: boolean;
  messages?: Message[];
  createdAt: string;
}

export interface Session {
  id: string;
  device?: string | null;
  ipAddress: string;
  location?: string | null;
  isActive: boolean;
  isCurrent: boolean;
  createdAt: string;
}
