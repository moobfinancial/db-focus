export interface Contact {
  id: string;
  name: string;
  phone: string;
  email: string;
  type: 'personal' | 'campaign';
  isShared: boolean;
  campaignId?: string;
  campaignName?: string;
  tags: string[];
  goals: WhisperGoal[];
  lastContactedAt?: Date;
  notes?: string;
}

export interface WhisperGoal {
  id: string;
  title: string;
  description: string;
  goalType: 'business' | 'personal' | 'both';
  campaignId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContactTag {
  id: string;
  contactId: string;
  campaignId?: string;
  tagName: string;
  createdAt: Date;
}

export interface CallTranscriptEntry {
  type: 'ai' | 'user';
  message: string;
  timestamp?: string;
}

export interface WhisperState {
  activeCall: boolean;
  selectedContact: Contact | null;
  goals: any[];
  contacts: Contact[];
  showContactDialog: boolean;
  showWhisperSetupDialog: boolean;
  newContact: {
    name: string;
    phone: string;
    email: string;
    type: 'personal' | 'campaign';
  };
  contactSearch: string;
  showContactsSheet: boolean;
  whisperEnabled: boolean;
  micMuted: boolean;
  volume: number;
  callTranscript: CallTranscriptEntry[];
  userMessage: string;
  isListening: boolean;
}