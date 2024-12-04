import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Contact } from '@/types/contact';
import { Search } from 'lucide-react';
import { ContactForm } from '@/components/ContactList/ContactForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useContactContext } from '@/lib/contexts/ContactContext';

interface ContactSelectorProps {
  contacts: Contact[];
  selectedContact: Contact | null;
  onSelectContact: (contact: Contact) => void;
  showAddContactModal: boolean;
  setShowAddContactModal: (show: boolean) => void;
}

export function ContactSelector({
  contacts,
  selectedContact,
  onSelectContact,
  showAddContactModal,
  setShowAddContactModal,
}: ContactSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { addContact } = useContactContext();

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.phone?.includes(searchQuery)
  );

  const handleAddContact = async (contact: Partial<Contact>) => {
    try {
      const newContact = await addContact(contact);
      setShowAddContactModal(false);
      onSelectContact(newContact);
    } catch (error) {
      console.error('Failed to add contact:', error);
    }
  };

  return (
    <Card className="p-4 bg-gray-800 border-gray-700">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-teal-400">Select Contact</h2>
          <Button
            onClick={() => setShowAddContactModal(true)}
            variant="outline"
            className="text-teal-400 border-teal-400 hover:bg-teal-400/10"
          >
            Add Contact
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 bg-gray-700 border-gray-600 text-gray-100"
          />
        </div>

        <ScrollArea className="h-[400px]">
          <div className="space-y-2">
            {filteredContacts.map((contact) => (
              <div
                key={contact.id}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedContact?.id === contact.id
                    ? 'bg-teal-400/20 border-teal-400'
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
                onClick={() => onSelectContact(contact)}
              >
                <div className="font-medium">{contact.name}</div>
                {contact.phone && (
                  <div className="text-sm text-gray-400">{contact.phone}</div>
                )}
                {contact.email && (
                  <div className="text-sm text-gray-400">{contact.email}</div>
                )}
                {contact.type && (
                  <Badge variant={contact.type === 'PERSONAL' ? 'default' : 'secondary'} className="mt-2">
                    {contact.type}
                  </Badge>
                )}
              </div>
            ))}
            {filteredContacts.length === 0 && (
              <div className="text-center text-gray-400 py-4">
                No contacts found
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      <Dialog open={showAddContactModal} onOpenChange={setShowAddContactModal}>
        <DialogContent className="bg-gray-800 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Add New Contact</DialogTitle>
          </DialogHeader>
          <ContactForm
            isOpen={showAddContactModal}
            onClose={() => setShowAddContactModal(false)}
            onSave={handleAddContact}
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
}