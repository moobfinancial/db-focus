import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Search, UserPlus, Phone, Mail, Calendar, Tag } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format } from 'date-fns';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ContactForm } from '@/components/ContactList/ContactForm';
import type { Contact } from '../types';

interface ContactSelectorProps {
  contacts: Contact[];
  selectedContact: Contact | null;
  onSelectContact: (contact: Contact) => void;
  onAddContact?: (contact: Contact) => void;
}

export function ContactSelector({ contacts, selectedContact, onSelectContact, onAddContact }: ContactSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddContact, setShowAddContact] = useState(false);

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.phone.includes(searchTerm) ||
    contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddContact = (newContact: Contact) => {
    onAddContact?.(newContact);
    setShowAddContact(false);
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex justify-between items-center">
          <span>Select Contact</span>
          <Sheet open={showAddContact} onOpenChange={setShowAddContact}>
            <SheetTrigger asChild>
              <Button size="sm" className="bg-teal-600 hover:bg-teal-700">
                <UserPlus className="h-4 w-4 mr-2" />
                Add Contact
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[400px] sm:w-[540px] bg-gray-800 border-gray-700">
              <SheetHeader>
                <SheetTitle className="text-white">Add New Contact</SheetTitle>
              </SheetHeader>
              <ContactForm onSubmit={handleAddContact} onCancel={() => setShowAddContact(false)} />
            </SheetContent>
          </Sheet>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-700 border-gray-600 text-white"
            />
          </div>

          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {filteredContacts.map((contact) => (
                <div
                  key={contact.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedContact?.id === contact.id
                      ? 'bg-teal-600'
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                  onClick={() => onSelectContact(contact)}
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div>
                        <p className="font-medium text-white">{contact.name}</p>
                        <div className="flex items-center space-x-2 text-sm text-gray-300">
                          <Phone className="h-3 w-3" />
                          <span>{contact.phone}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-300">
                          <Mail className="h-3 w-3" />
                          <span>{contact.email}</span>
                        </div>
                      </div>
                      {contact.lastContactedAt && (
                        <div className="flex items-center space-x-2 text-xs text-gray-400">
                          <Calendar className="h-3 w-3" />
                          <span>Last contacted: {format(contact.lastContactedAt, 'MMM d, yyyy')}</span>
                        </div>
                      )}
                      {contact.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {contact.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              <Tag className="h-3 w-3 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {contact.goals.length > 0 && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge variant="secondary" className="text-xs">
                                {contact.goals.length} Active Goals
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <ul className="list-disc list-inside">
                                {contact.goals.map((goal, index) => (
                                  <li key={index}>{goal.title}</li>
                                ))}
                              </ul>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <Badge variant={contact.type === 'campaign' ? 'default' : 'secondary'}>
                        {contact.type}
                      </Badge>
                      {contact.campaignName && (
                        <Badge variant="outline">
                          {contact.campaignName}
                        </Badge>
                      )}
                      {contact.isShared && (
                        <Badge variant="outline" className="bg-blue-500/20">
                          Shared
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}