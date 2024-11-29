import { useState } from 'react';

interface WhisperGoal {
  id: string;
  title: string;
  type: 'BUSINESS' | 'PERSONAL' | 'BOTH';
  systemPrompt: string;
  editablePrompt: string;
  isSystem: boolean;
  tags: string[];
}

export function useWhisperGoals() {
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

  const handleUpdateGoal = (field: keyof WhisperGoal, value: any) => {
    if (selectedGoal) {
      setSelectedGoal({ ...selectedGoal, [field]: value });
    }
  };

  return {
    goals,
    selectedGoal,
    isEditing,
    searchTerm,
    filterType,
    filteredGoals,
    handleCreateGoal,
    handleSaveGoal,
    handleDeleteGoal,
    handleDuplicateGoal,
    setSelectedGoal,
    setIsEditing,
    setSearchTerm,
    setFilterType,
    handleUpdateGoal,
  };
}