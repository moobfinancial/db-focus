import axios from 'axios';
import { Goal, ContactGoal } from '@/components/Whisper/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const goalService = {
  // Get all goals for the current user
  async getGoals(): Promise<Goal[]> {
    const response = await axios.get(`${API_URL}/api/goals`);
    return response.data;
  },

  // Create a new goal
  async createGoal(goal: Partial<Goal>): Promise<Goal> {
    const response = await axios.post(`${API_URL}/api/goals`, goal);
    return response.data;
  },

  // Update goal progress and feedback
  async updateGoalProgress(goalId: string, progress: number, feedback?: string): Promise<Goal> {
    const response = await axios.patch(`${API_URL}/api/goals/${goalId}/progress`, {
      progress,
      feedback
    });
    return response.data;
  },

  // Associate a goal with a contact
  async associateGoalWithContact(goalId: string, contactId: string): Promise<ContactGoal> {
    const response = await axios.post(`${API_URL}/api/goals/${goalId}/contacts/${contactId}`);
    return response.data;
  },

  // Update contact goal status and progress
  async updateContactGoal(
    goalId: string,
    contactId: string,
    updates: Partial<ContactGoal>
  ): Promise<ContactGoal> {
    const response = await axios.patch(
      `${API_URL}/api/goals/${goalId}/contacts/${contactId}`,
      updates
    );
    return response.data;
  },

  // Get all goals for a specific contact
  async getContactGoals(contactId: string): Promise<ContactGoal[]> {
    const response = await axios.get(`${API_URL}/api/contacts/${contactId}/goals`);
    return response.data;
  }
};
