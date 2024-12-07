import React, { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  useMemo, 
  ReactNode 
} from 'react';
import { Contact } from '@/types/contact';
import { contactService } from '@/lib/services/contactService';
import { useToast } from '@/components/ui/use-toast';

interface ContactContextType {
  contacts: Contact[];
  loading: boolean;
  error: string | null;
  showAddContactModal: boolean;
  setShowAddContactModal: (show: boolean) => void;
  addContact: (contact: Partial<Contact>) => Promise<Contact | null>;
  updateContact: (id: string, contact: Partial<Contact>) => Promise<Contact | null>;
  deleteContact: (id: string) => Promise<boolean>;
  refreshContacts: () => Promise<void>;
}

// Create a default context with safe, no-op functions
const createDefaultContactContext = (): ContactContextType => ({
  contacts: [],
  loading: false,
  error: null,
  showAddContactModal: false,
  setShowAddContactModal: () => {},
  addContact: async () => null,
  updateContact: async () => null,
  deleteContact: async () => false,
  refreshContacts: async () => {},
});

const ContactContext = createContext<ContactContextType>(createDefaultContactContext());

export function ContactProvider({ children }: { children: ReactNode }) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const { toast } = useToast();

  const fetchContacts = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedContacts = await contactService.getContacts();
      setContacts(fetchedContacts);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch contacts';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const addContact = async (contactData: Partial<Contact>): Promise<Contact | null> => {
    try {
      const newContact = await contactService.createContact(contactData);
      setContacts(prev => [...prev, newContact]);
      toast({
        title: 'Contact Added',
        description: `Added ${newContact.name}`,
      });
      return newContact;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add contact';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateContact = async (
    id: string, 
    contactData: Partial<Contact>
  ): Promise<Contact | null> => {
    try {
      const updatedContact = await contactService.updateContact(id, contactData);
      setContacts(prev => 
        prev.map(contact => contact.id === id ? updatedContact : contact)
      );
      toast({
        title: 'Contact Updated',
        description: `Updated ${updatedContact.name}`,
      });
      return updatedContact;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update contact';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    }
  };

  const deleteContact = async (id: string): Promise<boolean> => {
    try {
      await contactService.deleteContact(id);
      setContacts(prev => prev.filter(contact => contact.id !== id));
      toast({
        title: 'Contact Deleted',
        description: 'Contact removed successfully',
      });
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete contact';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return false;
    }
  };

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    contacts,
    loading,
    error,
    showAddContactModal,
    setShowAddContactModal,
    addContact,
    updateContact,
    deleteContact,
    refreshContacts: fetchContacts,
  }), [contacts, loading, error, showAddContactModal]);

  return (
    <ContactContext.Provider value={contextValue}>
      {children}
    </ContactContext.Provider>
  );
}

export function useContactContext(): ContactContextType {
  const context = useContext(ContactContext);
  
  // Optional: Add a warning if used outside of provider
  if (context.contacts.length === 0 && !context.loading) {
    console.warn('useContactContext used outside of ContactProvider or no contacts loaded.');
  }
  
  return context;
}