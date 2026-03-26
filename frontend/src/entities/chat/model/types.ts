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
  isBot: boolean;
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
  isSending?: boolean;
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
