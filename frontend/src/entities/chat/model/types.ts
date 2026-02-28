export interface User {
  id: string;
  first_name: string;
  last_name: string;
  username?: string;
  photoUrl?: string;
  status: string;
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
  sender: User;
  replyTo?: Message;
  forwardedFrom?: Message;
}

export type ChatType = "PRIVATE" | "GROUP" | "CHANNEL";

export interface Chat {
  id: string;
  type: ChatType;
  title: string;
  photoUrl?: string;
  members: User[];
  lastMessage?: Message;
  unreadCount: number;
  lastReadSequence: number;
}
