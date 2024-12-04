import { useState, useCallback, useEffect } from 'react';
import { useToast } from "@/components/ui/use-toast";
import type { WhisperState, Contact, CallTranscriptEntry, Goal, ContactGoal } from '../types';
import { useContactContext } from '@/lib/contexts/ContactContext';

const initialState: WhisperState = {
  activeCall: false,
  selectedContact: null,
  goals: [],
  showContactDialog: false,
  showWhisperSetupDialog: false,
  whisperEnabled: false,
  micMuted: false,
  volume: 50,
  callTranscript: [],
  userMessage: '',
  isListening: false,
  contacts: [],
};

export function useWhisperState() {
  const context = useContactContext();
  const [state, setState] = useState<WhisperState>({
    ...initialState,
    contacts: context.contacts || [],
  });
  const { toast } = useToast();

  // Memoize context-dependent functions
  const addContact = useCallback(async (contact: Partial<Contact>) => {
    try {
      if (context.addContact) {
        await context.addContact(contact);
      } else {
        console.warn('Add contact method not available');
        toast({
          title: 'Error',
          description: 'Cannot add contact at this time',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to add contact:', error);
      toast({
        title: 'Error',
        description: 'Failed to add contact',
        variant: 'destructive',
      });
    }
  }, [context.addContact, toast]);

  // Update contacts when context changes
  useEffect(() => {
    setState(prev => ({
      ...prev,
      contacts: context.contacts || [],
    }));
  }, [context.contacts]);

  const set = useCallback((field: keyof WhisperState, value: any) => {
    setState(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSelectContact = useCallback((contact: Contact) => {
    setState(prev => ({
      ...prev,
      selectedContact: contact,
      showContactDialog: false,
    }));
    toast({
      title: "Contact Selected",
      description: `Selected ${contact.name}`,
    });
  }, [toast]);

  const handleStartCall = useCallback(() => {
    if (!state.selectedContact) {
      toast({
        title: "Error",
        description: "Please select a contact before starting a call.",
        variant: "destructive"
      });
      return;
    }

    setState(prev => ({
      ...prev,
      activeCall: true,
      callTranscript: [],
    }));
  }, [state.selectedContact, toast]);

  const handleEndCall = useCallback(() => {
    setState(prev => ({
      ...prev,
      activeCall: false,
      selectedContact: null,
      callTranscript: [],
    }));
  }, []);

  const handleSendMessage = useCallback((message: string) => {
    setState(prev => ({
      ...prev,
      callTranscript: [
        ...prev.callTranscript,
        { 
          type: 'user', 
          content: message, 
          timestamp: new Date() 
        } as CallTranscriptEntry
      ],
      userMessage: '',
    }));
  }, []);

  const handleVoiceInput = useCallback((transcript: string) => {
    setState(prev => ({
      ...prev,
      userMessage: transcript,
    }));
  }, []);

  return {
    state,
    set,
    handleStartCall,
    handleEndCall,
    handleSelectContact,
    handleSendMessage,
    handleVoiceInput,
    addContact,
  };
}