import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, CheckCircle, Target, MessageCircle } from 'lucide-react';
import { Contact, Goal, ContactGoal } from '../types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { toast } from '@/components/ui/use-toast';

interface WhisperGoalsProps {
  contact: Contact;
  onGoalUpdate: (goalId: string, updates: Partial<ContactGoal>) => Promise<void>;
  onGoalAdd: (goal: Partial<Goal>) => Promise<void>;
}

export function WhisperGoals({ contact, onGoalUpdate, onGoalAdd }: WhisperGoalsProps) {
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [showFeedback, setShowFeedback] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [newGoal, setNewGoal] = useState<Partial<Goal>>({
    title: '',
    description: '',
    type: 'PERSONAL',
    priority: 1,
    successCriteria: [],
    category: '',
    feedback: [],
    contacts: [],
  });
  const [newFeedback, setNewFeedback] = useState('');
  const [newSuccessCriteria, setNewSuccessCriteria] = useState('');

  const handleProgressUpdate = async (goalId: string, progress: number) => {
    try {
      setIsUpdating(true);
      await onGoalUpdate(goalId, { progress });
      toast({
        title: 'Progress Updated',
        description: 'Goal progress has been successfully updated.',
      });
    } catch (error) {
      console.error('Failed to update progress:', error);
      toast({
        title: 'Error',
        description: 'Failed to update goal progress. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddFeedback = async (goalId: string) => {
    if (!newFeedback.trim()) return;
    
    try {
      setIsUpdating(true);
      const goal = contact.goals.find(g => g.goalId === goalId);
      if (goal) {
        const updatedFeedback = [...goal.feedback, newFeedback.trim()];
        await onGoalUpdate(goalId, { feedback: updatedFeedback });
        setNewFeedback('');
        setShowFeedback(null);
        toast({
          title: 'Feedback Added',
          description: 'Your feedback has been successfully added to the goal.',
        });
      }
    } catch (error) {
      console.error('Failed to add feedback:', error);
      toast({
        title: 'Error',
        description: 'Failed to add feedback. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddGoal = async () => {
    if (!newGoal.title) {
      toast({
        title: 'Error',
        description: 'Please provide a title for the goal.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsUpdating(true);
      await onGoalAdd({
        ...newGoal,
        contacts: [{ contactId: contact.id }],
      });
      setNewGoal({
        title: '',
        description: '',
        type: 'PERSONAL',
        priority: 1,
        successCriteria: [],
        category: '',
        feedback: [],
        contacts: [],
      });
      setShowAddGoal(false);
      toast({
        title: 'Goal Added',
        description: 'New goal has been successfully created.',
      });
    } catch (error) {
      console.error('Failed to add goal:', error);
      toast({
        title: 'Error',
        description: 'Failed to create goal. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddSuccessCriteria = () => {
    if (!newSuccessCriteria.trim()) return;
    setNewGoal(prev => ({
      ...prev,
      successCriteria: [...(prev.successCriteria || []), newSuccessCriteria.trim()],
    }));
    setNewSuccessCriteria('');
  };

  const handleRemoveSuccessCriteria = (index: number) => {
    setNewGoal(prev => ({
      ...prev,
      successCriteria: prev.successCriteria?.filter((_, i) => i !== index) || [],
    }));
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex justify-between items-center">
          <span>Goals</span>
          <Button
            size="sm"
            className="bg-teal-600 hover:bg-teal-700"
            onClick={() => setShowAddGoal(true)}
            disabled={isUpdating}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Goal
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {contact.goals.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              No goals set for this contact yet
            </div>
          ) : (
            contact.goals.map((contactGoal) => (
              <div
                key={contactGoal.id}
                className="mb-4 p-4 rounded-lg bg-gray-700 border border-gray-600"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{contactGoal.goal.title}</h3>
                    <p className="text-gray-400 text-sm">{contactGoal.goal.description}</p>
                  </div>
                  <div className="flex space-x-2">
                    <Badge variant={contactGoal.goal.type === 'PERSONAL' ? 'default' : 'secondary'}>
                      {contactGoal.goal.type}
                    </Badge>
                    {contactGoal.goal.category && (
                      <Badge variant="outline">{contactGoal.goal.category}</Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-sm text-gray-400">Progress</Label>
                    <div className="flex items-center space-x-2">
                      <Progress value={contactGoal.progress} className="flex-1" />
                      <span className="text-sm text-gray-400">{contactGoal.progress}%</span>
                    </div>
                  </div>

                  {contactGoal.goal.successCriteria.length > 0 && (
                    <div>
                      <Label className="text-sm text-gray-400">Success Criteria</Label>
                      <ul className="list-disc list-inside text-sm text-gray-300">
                        {contactGoal.goal.successCriteria.map((criteria, index) => (
                          <li key={index}>{criteria}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowFeedback(contactGoal.id)}
                      disabled={isUpdating}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Feedback ({contactGoal.feedback.length})
                    </Button>
                    <Select
                      value={contactGoal.status}
                      onValueChange={async (value) => {
                        try {
                          setIsUpdating(true);
                          await onGoalUpdate(contactGoal.goalId, { status: value as any });
                          toast({
                            title: 'Status Updated',
                            description: 'Goal status has been successfully updated.',
                          });
                        } catch (error) {
                          console.error('Failed to update status:', error);
                          toast({
                            title: 'Error',
                            description: 'Failed to update goal status. Please try again.',
                            variant: 'destructive',
                          });
                        } finally {
                          setIsUpdating(false);
                        }
                      }}
                      disabled={isUpdating}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NOT_STARTED">Not Started</SelectItem>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ))
          )}
        </ScrollArea>
      </CardContent>

      <Dialog open={showAddGoal} onOpenChange={setShowAddGoal}>
        <DialogContent className="bg-gray-800 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Add New Goal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={newGoal.title}
                onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newGoal.description}
                onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <div>
              <Label htmlFor="type">Type</Label>
              <Select
                value={newGoal.type}
                onValueChange={(value) => setNewGoal({ ...newGoal, type: value as any })}
              >
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERSONAL">Personal</SelectItem>
                  <SelectItem value="BUSINESS">Business</SelectItem>
                  <SelectItem value="BOTH">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={newGoal.category}
                onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value })}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <div>
              <Label>Success Criteria</Label>
              <div className="space-y-2">
                <div className="flex space-x-2">
                  <Input
                    value={newSuccessCriteria}
                    onChange={(e) => setNewSuccessCriteria(e.target.value)}
                    placeholder="Add success criteria"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                  <Button
                    onClick={handleAddSuccessCriteria}
                    disabled={!newSuccessCriteria.trim()}
                  >
                    Add
                  </Button>
                </div>
                {newGoal.successCriteria && newGoal.successCriteria.length > 0 && (
                  <ul className="list-disc list-inside text-sm text-gray-300">
                    {newGoal.successCriteria.map((criteria, index) => (
                      <li key={index} className="flex items-center justify-between">
                        <span>{criteria}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveSuccessCriteria(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setShowAddGoal(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddGoal}
              disabled={isUpdating || !newGoal.title.trim()}
            >
              Add Goal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!showFeedback} onOpenChange={() => setShowFeedback(null)}>
        <DialogContent className="bg-gray-800 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Goal Feedback</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {showFeedback && (
              <>
                <ScrollArea className="h-[200px]">
                  {contact.goals
                    .find((g) => g.id === showFeedback)
                    ?.feedback.map((feedback, index) => (
                      <div
                        key={index}
                        className="p-2 mb-2 rounded bg-gray-700 text-gray-300"
                      >
                        {feedback}
                      </div>
                    ))}
                </ScrollArea>
                <div>
                  <Label htmlFor="newFeedback">Add Feedback</Label>
                  <Textarea
                    id="newFeedback"
                    value={newFeedback}
                    onChange={(e) => setNewFeedback(e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setShowFeedback(null)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              onClick={() => showFeedback && handleAddFeedback(showFeedback)}
              disabled={isUpdating || !newFeedback.trim()}
            >
              Add Feedback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}