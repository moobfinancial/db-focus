import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Eye, Edit, Trash2, Target, MessageSquare, Phone } from 'lucide-react';
import { Contact } from '@/types/contact';

interface ContactTableProps {
  contacts: Contact[];
  selectedContacts: string[];
  onSelectContact: (id: string) => void;
  onSelectAll: (selected: boolean) => void;
  onEdit: (contact: Contact) => void;
  onDelete: (id: string) => void;
  onQuickView: (contact: Contact) => void;
  onManageGoals: (contact: Contact) => void;
  onStartCall: (contact: Contact) => void;
  onSendMessage: (contact: Contact) => void;
}

export const ContactTable = React.forwardRef<HTMLDivElement, ContactTableProps>(
  ({ contacts, selectedContacts, onSelectContact, onSelectAll, onEdit, onDelete, onQuickView, onManageGoals, onStartCall, onSendMessage }, ref) => {
    return (
      <div ref={ref} className="bg-gray-800 rounded-lg p-4">
        <TooltipProvider>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Contact Info</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Transparency</TableHead>
                <TableHead>Last Contact</TableHead>
                <TableHead>Goals</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.map((contact) => (
                <TableRow key={contact.id} className="hover:bg-gray-700/50">
                  <TableCell>
                    <div>
                      <p className="font-medium text-white">{contact.name}</p>
                      <p className="text-sm text-gray-400">{contact.email}</p>
                      <p className="text-sm text-gray-400">{contact.phone}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={contact.type === 'Personal' ? 'default' : 'secondary'}>
                      {contact.type}
                    </Badge>
                    {contact.subcategory && (
                      <Badge variant="outline" className="ml-2">
                        {contact.subcategory}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      contact.transparencyLevel === 'Full' ? 'default' :
                      contact.transparencyLevel === 'Partial' ? 'secondary' : 'destructive'
                    }>
                      {contact.transparencyLevel}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {contact.lastContactedAt ? (
                      <span className="text-sm text-gray-400">
                        {new Date(contact.lastContactedAt).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-500">Never</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {contact.goals?.length || 0} goals
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end space-x-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onStartCall(contact)}
                            className="hover:bg-green-900/20 text-green-400"
                          >
                            <Phone className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Start Call</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onSendMessage(contact)}
                            className="hover:bg-blue-900/20 text-blue-400"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Send Message</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onManageGoals(contact)}
                            className="hover:bg-yellow-900/20 text-yellow-400"
                          >
                            <Target className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Manage Goals</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onQuickView(contact)}
                            className="hover:bg-teal-900/20 text-teal-400"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Quick View</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(contact)}
                            className="hover:bg-orange-900/20 text-orange-400"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Edit Contact</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(contact.id)}
                            className="hover:bg-red-900/20 text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete Contact</TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TooltipProvider>
      </div>
    );
  }
);

ContactTable.displayName = 'ContactTable';

export default ContactTable;