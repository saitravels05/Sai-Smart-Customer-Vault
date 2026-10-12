export type AssistantRole = 'user' | 'assistant' | 'system';

export interface AssistantSourceReference {
  entityType: 'CUSTOMER' | 'DOCUMENT' | 'PASSPORT' | 'VISA' | 'TRAVEL_BOOKING';
  entityId: string;
  title: string;
  link: string;
  details?: string;
}

export interface AssistantSuggestedAction {
  label: string;
  action: 'VIEW_CUSTOMER' | 'OPEN_DOCUMENT' | 'WHATSAPP_CUSTOMER' | 'RENEW_PASSPORT';
  payload?: Record<string, any>;
}

export interface AssistantChatMessage {
  id: string;
  role: AssistantRole;
  content: string;
  sources?: AssistantSourceReference[];
  suggestedActions?: AssistantSuggestedAction[];
  timestamp: string;
}

export interface AskAssistantDto {
  question: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  contextCustomerId?: string;
  branchId?: string;
}

export interface AssistantResponseDto {
  answer: string;
  sources: AssistantSourceReference[];
  suggestedQuestions: string[];
  suggestedActions?: AssistantSuggestedAction[];
  modelUsed: string;
  processingTimeMs: number;
}
