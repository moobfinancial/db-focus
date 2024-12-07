import { useState, useCallback, useEffect } from 'react';
import { Contact, WhisperGoal } from '@/types';

interface WhisperState {
  contacts: Contact[];
  selectedContact: Contact | null;
  showContactDialog: boolean;
  activeCall: boolean;
  micMuted: boolean;
  volume: number;
  messages: Array<{ text: string; sender: 'user' | 'assistant' }>;
  goals: WhisperGoal[];
}

const initialState: WhisperState = {
  contacts: [],
  selectedContact: null,
  showContactDialog: false,
  activeCall: false,
  micMuted: false,
  volume: 1,
  messages: [],
  goals: [],
};

export function useWhisperState() {
  const [state, setState] = useState<WhisperState>(initialState);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const set = useCallback(<K extends keyof WhisperState>(
    key: K,
    value: WhisperState[K]
  ) => {
    setState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleStartCall = useCallback(() => {
    if (!state.selectedContact) {
      setError(new Error('Please select a contact before starting a call'));
      return;
    }
    set('activeCall', true);
  }, [state.selectedContact, set]);

  const handleEndCall = useCallback(() => {
    set('activeCall', false);
    set('messages', []);
  }, [set]);

  const handleSelectContact = useCallback((contact: Contact) => {
    set('selectedContact', contact);
    // Load goals for the selected contact
    setIsLoading(true);
    fetch(`/api/goals?contactId=${contact.id}`)
      .then((res) => res.json())
      .then((goals) => {
        set('goals', goals);
      })
      .catch((err) => {
        setError(err);
        console.error('Error loading goals:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [set]);

  const handleSendMessage = useCallback((message: string) => {
    set('messages', [...state.messages, { text: message, sender: 'user' }]);
  }, [state.messages, set]);

  const handleVoiceInput = useCallback((transcript: string) => {
    set('messages', [...state.messages, { text: transcript, sender: 'user' }]);
  }, [state.messages, set]);

  const handleGoalUpdate = useCallback(async (goalId: string, completed: boolean) => {
    try {
      const response = await fetch(`/api/goals/${goalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed }),
      });
      
      if (!response.ok) throw new Error('Failed to update goal');
      
      set('goals', state.goals.map(goal => 
        goal.id === goalId ? { ...goal, completed } : goal
      ));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update goal'));
      console.error('Error updating goal:', err);
    }
  }, [state.goals, set]);

  const handleGoalAdd = useCallback(async (title: string) => {
    if (!state.selectedContact) return;
    
    try {
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          contactId: state.selectedContact.id,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to add goal');
      
      const newGoal = await response.json();
      set('goals', [...state.goals, newGoal]);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to add goal'));
      console.error('Error adding goal:', err);
    }
  }, [state.selectedContact, state.goals, set]);

  useEffect(() => {
    // Load initial contacts
    fetch('/api/contacts')
      .then((res) => res.json())
      .then((contacts) => {
        set('contacts', contacts);
      })
      .catch((err) => {
        setError(err);
        console.error('Error loading contacts:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [set]);

  return {
    state,
    set,
    handleStartCall,
    handleEndCall,
    handleSelectContact,
    handleSendMessage,
    handleVoiceInput,
    handleGoalUpdate,
    handleGoalAdd,
    isLoading,
    error,
  };
}