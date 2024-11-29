import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Edit, Trash2, Plus, Copy } from 'lucide-react';

interface WhisperGoal {
  id: string;
  title: string;
  type: 'BUSINESS' | 'PERSONAL' | 'BOTH';
  systemPrompt: string;
  editablePrompt: string;
  isSystem: boolean;
  tags: string[];
}

export function WhisperGoals() {
  const [goals, setGoals] = useState<WhisperGoal[]>([
    {
      id: '1',
      title: 'Professional Tone',
      type: 'BUSINESS',
      systemPrompt: 'Maintain a professional and courteous tone throughout the conversation.',
      editablePrompt: 'Remind me to keep the conversation professional and focused on business objectives.',
      isSystem: true,
      tags: ['professional', 'business', 'communication']
    },
    {
      id: '2',
      title: 'Active Listening',
      type: 'BOTH',
      systemPrompt: 'Focus on understanding and acknowledging the speaker\'s points.',
      editablePrompt: 'Prompt me to acknowledge what was said before responding.',
      isSystem: false,
      tags: ['listening', 'empathy']
    }
  ]);

  const [selectedGoal, setSelectedGoal] = useState<WhisperGoal | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'BUSINESS' | 'PERSONAL' | 'BOTH'>('ALL');

  const filteredGoals = goals.filter(goal => {
    const matchesSearch = goal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         goal.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === 'ALL' || goal.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleCreateGoal = () => {
    const newGoal: WhisperGoal = {
      id: Date.now().toString(),
      title: '',
      type: 'BOTH',
      systemPrompt: '',
      editablePrompt: '',
      isSystem: false,
      tags: []
    };
    setSelectedGoal(newGoal);
    setIsEditing(true);
  };

  const handleSaveGoal = (goal: WhisperGoal) => {
    if (goal.id) {
      setGoals(goals.map(g => g.id === goal.id ? goal : g));
    } else {
      setGoals([...goals, { ...goal, id: Date.now().toString() }]);
    }
    setSelectedGoal(null);
    setIsEditing(false);
  };

  const handleDeleteGoal = (id: string) => {
    setGoals(goals.filter(goal => goal.id !== id));
    if (selectedGoal?.id === id) {
      setSelectedGoal(null);
      setIsEditing(false);
    }
  };

  const handleDuplicateGoal = (goal: WhisperGoal) => {
    const newGoal = {
      ...goal,
      id: Date.now().toString(),
      title: `${goal.title} (Copy)`,
      isSystem: false
    };
    setGoals([...goals, newGoal]);
  };

  return (
    <div className="grid grid-cols-3 gap-6">
      <div className="col-span-1">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white">Whisper Goals</CardTitle>
            <Button 
              onClick={handleCreateGoal}
              className="bg-teal-600 hover:bg-teal-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Goal
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input
                placeholder="Search goals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-gray-700 text-white border-gray-600"
              />
              
              <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                <SelectTrigger className="bg-gray-700 text-white border-gray-600">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Types</SelectItem>
                  <SelectItem value="BUSINESS">Business</SelectItem>
                  <SelectItem value="PERSONAL">Personal</SelectItem>
                  <SelectItem value="BOTH">Both</SelectItem>
                </SelectContent>
              </Select>

              <ScrollArea className="h-[500px]">
                <div className="space-y-2">
                  {filteredGoals.map((goal) => (
                    <div
                      key={goal.id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedGoal?.id === goal.id
                          ? 'bg-teal-600'
                          : 'bg-gray-700 hover:bg-gray-600'
                      }`}
                      onClick={() => setSelectedGoal(goal)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-white">{goal.title}</h3>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {goal.tags.map((tag, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <Badge variant={goal.isSystem ? "secondary" : "default"}>
                          {goal.type}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="col-span-2">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">
              {isEditing ? 'Edit Whisper Goal' : 'Goal Details'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedGoal ? (
              <div className="space-y-4">
                <div>
                  <Label>Title</Label>
                  <Input
                    value={selectedGoal.title}
                    onChange={(e) => setSelectedGoal({ ...selectedGoal, title: e.target.value })}
                    disabled={!isEditing}
                    className="bg-gray-700 text-white border-gray-600"
                  />
                </div>

                <div>
                  <Label>Type</Label>
                  <Select
                    value={selectedGoal.type}
                    onValueChange={(value: 'BUSINESS' | 'PERSONAL' | 'BOTH') => 
                      setSelectedGoal({ ...selectedGoal, type: value })
                    }
                    disabled={!isEditing}
                  >
                    <SelectTrigger className="bg-gray-700 text-white border-gray-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BUSINESS">Business</SelectItem>
                      <SelectItem value="PERSONAL">Personal</SelectItem>
                      <SelectItem value="BOTH">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>System Prompt</Label>
                  <Textarea
                    value={selectedGoal.systemPrompt}
                    onChange={(e) => setSelectedGoal({ ...selectedGoal, systemPrompt: e.target.value })}
                    disabled={!isEditing}
                    className="bg-gray-700 text-white border-gray-600"
                    rows={4}
                  />
                </div>

                <div>
                  <Label>Editable Prompt</Label>
                  <Textarea
                    value={selectedGoal.editablePrompt}
                    onChange={(e) => setSelectedGoal({ ...selectedGoal, editablePrompt: e.target.value })}
                    disabled={!isEditing}
                    className="bg-gray-700 text-white border-gray-600"
                    rows={4}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  {isEditing ? (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedGoal(null);
                          setIsEditing(false);
                        }}
                        className="bg-gray-700 hover:bg-gray-600"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => handleSaveGoal(selectedGoal)}
                        className="bg-teal-600 hover:bg-teal-700"
                      >
                        Save Changes
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => handleDuplicateGoal(selectedGoal)}
                        className="bg-gray-700 hover:bg-gray-600"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicate
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setIsEditing(true)}
                        className="bg-gray-700 hover:bg-gray-600"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleDeleteGoal(selectedGoal.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                Select a goal to view details or create a new one
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}