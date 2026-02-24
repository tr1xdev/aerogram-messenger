export interface User {
  id: string;
  first_name: string;
  last_name?: string;
  username?: string;
  status: string;
}

export interface Message {
  id: string;
  chatId: string;
  text: string;
  sentAt: string;
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
  members?: User[];
}
