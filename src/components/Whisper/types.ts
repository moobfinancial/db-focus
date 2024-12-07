import { Contact as BaseContact } from '@/types/contact';

export type { Contact } from '@/types/contact';

export interface Goal {
  id: string;
  title: string;
  description?: string;
  type: 'BUSINESS' | 'PERSONAL' | 'BOTH';
  priority: number;
  isTemplate: boolean;
  prompt?: string;
  successCriteria: string[];
  progress: number;
  category?: string;
  feedback: string[];
  contacts: ContactGoal[];
}

export interface ContactGoal {
  id: string;
  contactId: string;
  goalId: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  progress: number;
  feedback: string[];
  dueDate?: Date;
  lastUpdated: Date;
  contact: BaseContact;
  goal: Goal;
}

export interface WhisperGoal extends Omit<ContactGoal, 'contact' | 'goal'> {
  userId: string;
  templateId: string;
}

export interface WhisperTemplate {
  id: string;
  title: string;
  description?: string;
  type: 'BUSINESS' | 'PERSONAL';
  prompt: string;
  systemPrompt?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CallTranscriptEntry {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface WhisperState {
  activeCall: boolean;
  selectedContact: BaseContact | null;
  goals: Goal[];
  contacts: BaseContact[];
  showContactDialog: boolean;
  showWhisperSetupDialog: boolean;
  whisperEnabled: boolean;
  micMuted: boolean;
  volume: number;
  callTranscript: CallTranscriptEntry[];
  userMessage: string;
  isListening: boolean;
}