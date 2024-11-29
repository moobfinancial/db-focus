import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Edit, Trash2, Plus, Copy, Tags } from 'lucide-react';
import { useWhisperGoals } from '../hooks/useWhisperGoals';

export function WhisperGoals() {
  const {
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
  } = useWhisperGoals();

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
              <div className="relative">
                <Input
                  placeholder="Search goals..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-gray-700 text-white border-gray-600 pl-10"
                />
                <Tags className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
              
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

              <ScrollArea className="h-[500px] pr-4">
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
                    onChange={(e) => handleUpdateGoal('title', e.target.value)}
                    disabled={!isEditing}
                    className="bg-gray-700 text-white border-gray-600"
                  />
                </div>

                <div>
                  <Label>Type</Label>
                  <Select
                    value={selectedGoal.type}
                    onValueChange={(value: 'BUSINESS' | 'PERSONAL' | 'BOTH') => 
                      handleUpdateGoal('type', value)
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
                    onChange={(e) => handleUpdateGoal('systemPrompt', e.target.value)}
                    disabled={!isEditing}
                    className="bg-gray-700 text-white border-gray-600"
                    rows={4}
                  />
                </div>

                <div>
                  <Label>Editable Prompt</Label>
                  <Textarea
                    value={selectedGoal.editablePrompt}
                    onChange={(e) => handleUpdateGoal('editablePrompt', e.target.value)}
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