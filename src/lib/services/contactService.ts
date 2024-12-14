import axios from 'axios';
import { Contact } from '@/types/contact';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const contactService = {
  // Get all contacts
  async getContacts(): Promise<Contact[]> {
    const response = await axios.get(`${API_URL}/api/contacts`);
    return response.data;
  },

  // Get a single contact
  async getContact(id: string): Promise<Contact> {
    const response = await axios.get(`${API_URL}/api/contacts/${id}`);
    return response.data;
  },

  // Create a new contact
  async createContact(contact: Partial<Contact>): Promise<Contact> {
    const response = await axios.post(`${API_URL}/api/contacts`, contact);
    return response.data;
  },

  // Update a contact
  async updateContact(id: string, contact: Partial<Contact>): Promise<Contact> {
    const response = await axios.patch(`${API_URL}/api/contacts/${id}`, contact);
    return response.data;
  },

  // Delete a contact
  async deleteContact(id: string): Promise<void> {
    await axios.delete(`${API_URL}/api/contacts/${id}`);
  }
};
