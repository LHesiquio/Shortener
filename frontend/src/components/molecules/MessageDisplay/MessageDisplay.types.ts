export interface MessageData {
  message: string;
  mongoConnected: boolean;
  collectionsCount?: number;
}

export interface MessageDisplayProps {
  data: MessageData;
}
