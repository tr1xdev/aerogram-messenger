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
  publicKey?: string;
  encryptedPrivKey?: string;
  encryptionIv?: string;
  lastSeen?: string | null;
  isVerified?: boolean;
  isTyping?: boolean;
}

export interface Message {
  id: string;
  chatId: string;
  text: string;
  sentAt: string;
  sequence?: number;
  isRead: boolean;
  isEdited: boolean;
  isEncrypted: boolean;
  encryptionIv?: string;
  sender: User;
  replyTo?: Message;
  forwardedFrom?: Message;
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
  photoUrl?: string | null;
  members: ChatMember[];
  lastMessage?: Message | null;
  unreadCount: number;
  lastReadSequence: number;
  isPinned: boolean;
  messages?: Message[];
  createdAt: string;
}

export interface Session {
  id: string;
  device?: string | null;
  ipAddress?: string | null;
  location?: string | null;
  isActive: boolean;
  isCurrent: boolean;
  createdAt: string;
}

export interface StatusChanged {
  userStatusChanged: {
    userId: string;
    status: string;
    lastSeen?: string;
  };
}
