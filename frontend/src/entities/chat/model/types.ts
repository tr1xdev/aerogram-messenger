export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  username?: string;
  photoUrl?: string;
  status: string;
  publicKey?: string;
  encryptedPrivKey?: string;
  encryptionIv?: string;
  lastSeen?: string;
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
  photoUrl?: string;
  members: ChatMember[];
  lastMessage?: Message;
  unreadCount: number;
  lastReadSequence: number;
  messages?: Message[];
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
