import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, CheckCircle, Target } from 'lucide-react';

interface WhisperGoal {
  id: string;
  title: string;
  prompt: string;
  successCriteria: string[];
  progress: number;
  isSelected?: boolean;
  category: string;
  priority: 'low' | 'medium' | 'high';
  feedback: string[];
  lastUpdated: Date;
}

interface WhisperGoalsProps {
  selectedGoals: string[];
  onGoalsChange: (goals: string[]) => void;
  onProgressUpdate?: (goalId: string, progress: number) => void;
  onFeedbackAdd?: (goalId: string, feedback: string) => void;
}

export function WhisperGoals({ 
  selectedGoals, 
  onGoalsChange, 
  onProgressUpdate, 
  onFeedbackAdd 
}: WhisperGoalsProps) {
  const [goals, setGoals] = useState<WhisperGoal[]>([
    {
      id: '1',
      title: 'Active Listening',
      prompt: 'Help me demonstrate active listening by suggesting appropriate responses and follow-up questions.',
      successCriteria: [
        'Acknowledge speaker\'s points',
        'Ask relevant follow-up questions',
        'Summarize key points'
      ],
      progress: 0,
      category: 'Communication',
      priority: 'high',
      feedback: [],
      lastUpdated: new Date()
    }
  ]);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editingGoal, setEditingGoal] = useState<WhisperGoal | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleGoalSelect = (goalId: string) => {
    if (selectedGoals.includes(goalId)) {
      onGoalsChange(selectedGoals.filter(id => id !== goalId));
    } else {
      onGoalsChange([...selectedGoals, goalId]);
    }
  };

  const handleAddGoal = () => {
    const newGoal: WhisperGoal = {
      id: Date.now().toString(),
      title: '',
      prompt: '',
      successCriteria: [],
      progress: 0,
      category: '',
      priority: 'low',
      feedback: [],
      lastUpdated: new Date()
    };
    setEditingGoal(newGoal);
    setIsEditing(true);
  };

  const handleSaveGoal = () => {
    if (editingGoal) {
      if (editingGoal.id === 'new') {
        setGoals([...goals, { ...editingGoal, id: Date.now().toString() }]);
      } else {
        setGoals(goals.map(goal => 
          goal.id === editingGoal.id ? editingGoal : goal
        ));
      }
      setIsEditing(false);
      setEditingGoal(null);
    }
  };

  const handleDeleteGoal = (goalId: string) => {
    if (window.confirm('Are you sure you want to delete this goal?')) {
      setGoals(goals.filter(goal => goal.id !== goalId));
      if (selectedGoals.includes(goalId)) {
        onGoalsChange(selectedGoals.filter(id => id !== goalId));
      }
    }
  };

  const handleProgressUpdate = (goalId: string, progress: number) => {
    setGoals(goals.map(goal => 
      goal.id === goalId 
        ? { ...goal, progress, lastUpdated: new Date() } 
        : goal
    ));
    onProgressUpdate?.(goalId, progress);
  };

  const handleAddFeedback = (goalId: string, feedback: string) => {
    setGoals(goals.map(goal => 
      goal.id === goalId 
        ? { 
            ...goal, 
            feedback: [...goal.feedback, feedback],
            lastUpdated: new Date()
          } 
        : goal
    ));
    onFeedbackAdd?.(goalId, feedback);
  };

  const getPriorityColor = (priority: 'low' | 'medium' | 'high') => {
    switch (priority) {
      case 'high': return 'text-red-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  const filteredGoals = goals.filter(goal =>
    goal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    goal.prompt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-white">Call Goals</CardTitle>
        <Button variant="outline" size="sm" onClick={handleAddGoal}>
          <Plus className="w-4 h-4 mr-2" />
          Add Goal
        </Button>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Input
            className="bg-gray-700 text-white"
            placeholder="Search goals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <ScrollArea className="h-[400px]">
          <div className="space-y-4">
            {filteredGoals.map((goal) => (
              <Card 
                key={goal.id} 
                className={`bg-gray-700 hover:bg-gray-600 transition-colors ${
                  selectedGoals.includes(goal.id) ? 'border-teal-500' : ''
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Checkbox
                      checked={selectedGoals.includes(goal.id)}
                      onCheckedChange={() => handleGoalSelect(goal.id)}
                    />
                    <div className="flex-grow">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-white">{goal.title}</h3>
                        <Badge variant="outline" className={getPriorityColor(goal.priority)}>
                          {goal.priority}
                        </Badge>
                      </div>
                      <p className="text-gray-300 mb-2">{goal.prompt}</p>
                      <Badge className="mb-3 bg-gray-600">{goal.category}</Badge>
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-400">Success Criteria:</h4>
                        <ul className="list-disc list-inside text-sm text-gray-300">
                          {goal.successCriteria.map((criterion, index) => (
                            <li key={index}>{criterion}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="mt-4">
                        <Label className="text-sm text-gray-400">Progress</Label>
                        <div className="flex items-center gap-2">
                          <div className="flex-grow bg-gray-600 rounded-full h-2">
                            <div 
                              className="bg-teal-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${goal.progress}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-300">{goal.progress}%</span>
                        </div>
                      </div>
                      {goal.feedback.length > 0 && (
                        <div className="mt-4">
                          <Label className="text-sm text-gray-400">Recent Feedback</Label>
                          <ScrollArea className="h-20 mt-1">
                            {goal.feedback.map((item, index) => (
                              <p key={index} className="text-sm text-gray-300 py-1">{item}</p>
                            ))}
                          </ScrollArea>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col space-y-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => {
                          setEditingGoal(goal);
                          setIsEditing(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDeleteGoal(goal.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleProgressUpdate(goal.id, Math.min(100, goal.progress + 10))}
                      >
                        <Target className="w-4 h-4 text-teal-400" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>

        {isEditing && editingGoal && (
          <Dialog open={isEditing} onOpenChange={() => setIsEditing(false)}>
            <DialogContent className="bg-gray-800 border-gray-700 text-white">
              <DialogHeader>
                <DialogTitle>{editingGoal.id === 'new' ? 'Create New Goal' : 'Edit Goal'}</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Configure your communication goal and success criteria
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Goal Title</Label>
                  <Input
                    value={editingGoal.title}
                    onChange={(e) => setEditingGoal({
                      ...editingGoal,
                      title: e.target.value
                    })}
                    className="bg-gray-700"
                  />
                </div>
                <div>
                  <Label>Category</Label>
                  <Input
                    value={editingGoal.category}
                    onChange={(e) => setEditingGoal({
                      ...editingGoal,
                      category: e.target.value
                    })}
                    className="bg-gray-700"
                    placeholder="e.g., Communication, Leadership, Technical"
                  />
                </div>
                <div>
                  <Label>Priority</Label>
                  <select
                    value={editingGoal.priority}
                    onChange={(e) => setEditingGoal({
                      ...editingGoal,
                      priority: e.target.value as 'low' | 'medium' | 'high'
                    })}
                    className="w-full bg-gray-700 text-white rounded-md border border-gray-600 p-2"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <Label>Instructions for AI (Prompt)</Label>
                  <Textarea
                    value={editingGoal.prompt}
                    onChange={(e) => setEditingGoal({
                      ...editingGoal,
                      prompt: e.target.value
                    })}
                    className="bg-gray-700 h-32"
                    placeholder="Describe how the AI should help you achieve this goal..."
                  />
                </div>
                <div>
                  <Label>Success Criteria (one per line)</Label>
                  <Textarea
                    value={editingGoal.successCriteria.join('\n')}
                    onChange={(e) => setEditingGoal({
                      ...editingGoal,
                      successCriteria: e.target.value.split('\n').filter(Boolean)
                    })}
                    className="bg-gray-700 h-32"
                    placeholder="Enter criteria for measuring success..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveGoal}>
                  Save Goal
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
}