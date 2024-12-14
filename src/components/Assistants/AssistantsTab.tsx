import { useCallback, useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import AssistantCard from './AssistantCard';
import AssistantWizard from '../AssistantWizard';
import DeleteDialog from '../DeleteDialog';
import { dailyBotsApi } from '@/lib/api/dailybots';
import { useToast } from "@/components/ui/use-toast";
import { PlusCircle } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { Assistant, LLMProvider, VoiceProvider } from '@/types/assistant';

export default function AssistantsTab() {
  const { toast } = useToast();
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedAssistant, setSelectedAssistant] = useState<Assistant | null>(null);
  const [isCreatingAssistant, setIsCreatingAssistant] = useState(false);
  const [showWizard, setShowWizard] = useState(false);

  // Fetch assistants on component mount
  useEffect(() => {
    fetchAssistants();
  }, []);

  // Fetch assistants from DailyBots
  const fetchAssistants = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Get fresh token to ensure we're authenticated
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('No authentication token found');
        toast({
          title: "Authentication Error",
          description: "Please log in again",
          variant: "destructive"
        });
        setAssistants([]);
        return;
      }

      const dailyBotsAssistants = await dailyBotsApi.listAssistants();
      console.log('Fetched assistants:', dailyBotsAssistants);
      
      if (!dailyBotsAssistants || !Array.isArray(dailyBotsAssistants)) {
        console.error('Invalid assistants response:', dailyBotsAssistants);
        throw new Error('Invalid response format from server');
      }

      // Convert DailyBots assistants to our format
      const convertedAssistants = dailyBotsAssistants.map(assistant => ({
        id: assistant.id,
        userId: assistant.userId || '',
        name: assistant.name,
        systemPrompt: assistant.systemPrompt || '',
        firstMessage: assistant.firstMessage || null,
        provider: (assistant.provider || 'DAILY_BOTS') as LLMProvider,
        model: assistant.model || '',
        tools: assistant.tools || [],
        voiceProvider: (assistant.voiceProvider || 'CARTESIA') as VoiceProvider,
        voiceId: assistant.voiceId || '',
        voiceSettings: assistant.voiceSettings || {
          speed: 1,
          pitch: 1,
          stability: 0.5,
          volume: 1
        },
        language: assistant.language || 'en',
        createdAt: assistant.createdAt ? new Date(assistant.createdAt) : new Date(),
        updatedAt: assistant.updatedAt ? new Date(assistant.updatedAt) : new Date(),
        isActive: assistant.isActive ?? true
      }));
      console.log('Converted assistants:', convertedAssistants);

      setAssistants(convertedAssistants);
    } catch (error) {
      console.error('Error fetching assistants:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch assistants",
        variant: "destructive"
      });
      setAssistants([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Create assistant using DailyBots API
  const handleCreateAssistant = useCallback(async (newAssistantData: Partial<Assistant>) => {
    console.group('Assistant Creation Process');
    console.log('Raw Assistant Input:', JSON.stringify(newAssistantData, null, 2));

    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        setIsCreatingAssistant(true);

        // Validate required fields
        if (!newAssistantData.name) {
          throw new Error('Assistant name is required');
        }

        // Ensure voice settings are properly structured
        const voiceSettings = {
          speed: newAssistantData.voiceSettings?.speed ?? 1,
          pitch: newAssistantData.voiceSettings?.pitch ?? 1,
          stability: newAssistantData.voiceSettings?.stability ?? 0.75,
          volume: newAssistantData.voiceSettings?.volume ?? 0.75,
          sampleRate: 24000
        };

        // Prepare the assistant data for the server
        const assistantPayload = {
          name: newAssistantData.name,
          systemPrompt: newAssistantData.systemPrompt,
          firstMessage: newAssistantData.firstMessage,
          provider: 'OPEN_AI',
          model: 'gpt-3.5-turbo',
          tools: [],
          voiceProvider: 'CARTESIA',
          voiceId: '3f4ade23-6eb4-4279-ab05-6a144947c4d5',
          voiceSettings
        };

        console.log('Sending payload to server:', JSON.stringify(assistantPayload, null, 2));

        // Verify authentication token
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication token not found');
        }

        // Send the request to create the assistant
        const response = await apiClient.post('/assistants', assistantPayload);

        if (!response.data.success) {
          console.error('Server returned error:', response.data.error);
          throw new Error(response.data.error?.message || 'Failed to create assistant');
        }

        // Convert server response to our Assistant type
        const createdAssistant: Assistant = {
          id: response.data.data.id,
          userId: response.data.data.userId,
          name: response.data.data.name,
          systemPrompt: response.data.data.systemPrompt,
          firstMessage: response.data.data.firstMessage,
          provider: response.data.data.provider as LLMProvider,
          model: response.data.data.model,
          tools: response.data.data.tools,
          voiceProvider: response.data.data.voiceProvider as VoiceProvider,
          voiceId: response.data.data.voiceId,
          voiceSettings: response.data.data.voiceSettings,
          createdAt: new Date(response.data.data.createdAt),
          updatedAt: new Date(response.data.data.updatedAt),
          isActive: response.data.data.isActive
        };

        // Add to assistants list
        setAssistants(prevAssistants => {
          const updatedAssistants = [...prevAssistants, createdAssistant];
          console.log('Updated Assistants List:', updatedAssistants);
          return updatedAssistants;
        });

        // Reset form or close modal
        setShowWizard(false);

        toast({
          title: "Success",
          description: `Assistant "${createdAssistant.name}" created successfully`
        });

        console.groupEnd();
        return createdAssistant;

      } catch (error) {
        console.error(`Error creating assistant (attempt ${retryCount + 1}/${maxRetries}):`, error);
        
        // Check for specific error types that shouldn't be retried
        if (error instanceof Error) {
          const errorMessage = error.message.toLowerCase();
          if (
            errorMessage.includes('validation') ||
            errorMessage.includes('duplicate') ||
            errorMessage.includes('already exists') ||
            errorMessage.includes('authentication')
          ) {
            toast({
              title: "Error",
              description: error.message,
              variant: "destructive"
            });
            return null;
          }
        }

        // Retry on network errors or unknown errors
        if (retryCount < maxRetries - 1) {
          retryCount++;
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)); // Exponential backoff
          continue;
        }

        toast({
          title: "Error",
          description: error instanceof Error ? error.message : 'Failed to create assistant',
          variant: "destructive"
        });
        return null;

      } finally {
        if (retryCount === maxRetries - 1) {
          setIsCreatingAssistant(false);
          console.groupEnd();
        }
      }
    }
  }, [toast]);

  const handleUpdateAssistant = useCallback(async (updatedAssistant: Partial<Assistant>) => {
    console.group('Assistant Update Process');
    console.log('Updating assistant:', updatedAssistant);
    
    try {
      // Validate required fields
      if (!updatedAssistant.name) {
        throw new Error('Assistant name is required');
      }

      // Prepare the assistant data
      const assistantPayload = {
        name: updatedAssistant.name,
        systemPrompt: updatedAssistant.systemPrompt || null,
        firstMessage: updatedAssistant.firstMessage || null,
        provider: (updatedAssistant.provider || 'OPEN_AI').toUpperCase() as LLMProvider,
        model: updatedAssistant.model || 'gpt-4',
        tools: updatedAssistant.tools || [],
        voiceProvider: (updatedAssistant.voiceProvider || 'CARTESIA').toUpperCase() as VoiceProvider,
        voiceId: updatedAssistant.voiceId || null,
        voiceSettings: updatedAssistant.voiceSettings || {
          speed: 1,
          pitch: 1,
          stability: 0.75,
          volume: 0.75
        }
      };

      console.log('Sending update payload:', assistantPayload);

      // Send update request
      const response = await apiClient.put(`/assistants/${updatedAssistant.id}`, assistantPayload);

      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Failed to update assistant');
      }

      // Update local state
      setAssistants(prevAssistants => 
        prevAssistants.map(assistant => 
          assistant.id === updatedAssistant.id
            ? { ...assistant, ...updatedAssistant }
            : assistant
        )
      );

      toast({
        title: "Success",
        description: `Assistant "${updatedAssistant.name}" updated successfully`
      });
    } catch (error) {
      console.error('Error updating assistant:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to update assistant',
        variant: "destructive"
      });
    }
  }, [toast]);

  const handleDeleteAssistant = (assistant: Assistant) => {
    setSelectedAssistant(assistant);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!selectedAssistant) return;

    try {
      await apiClient.delete(`/assistants/${selectedAssistant.id}`);
      setAssistants(prevAssistants => 
        prevAssistants.filter(a => a.id !== selectedAssistant.id)
      );
      toast({
        title: "Success",
        description: `Assistant "${selectedAssistant.name}" deleted successfully`
      });
    } catch (error) {
      console.error('Error deleting assistant:', error);
      toast({
        title: "Error",
        description: 'Failed to delete assistant',
        variant: "destructive"
      });
    } finally {
      setShowDeleteDialog(false);
      setSelectedAssistant(null);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">My Assistants</h2>
        <Button onClick={() => setShowWizard(true)} disabled={isCreatingAssistant}>
          <PlusCircle className="w-4 h-4 mr-2" />
          Create Assistant
        </Button>
      </div>

      {isLoading ? (
        <div>Loading assistants...</div>
      ) : assistants.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No assistants found. Create one to get started!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assistants.map(assistant => (
            <AssistantCard
              key={assistant.id}
              assistant={assistant}
              onUpdate={handleUpdateAssistant}
              onDelete={() => handleDeleteAssistant(assistant)}
            />
          ))}
        </div>
      )}

      {showWizard && (
        <AssistantWizard
          onClose={() => setShowWizard(false)}
          onCreate={handleCreateAssistant}
          isCreating={isCreatingAssistant}
        />
      )}

      {showDeleteDialog && selectedAssistant && (
        <DeleteDialog
          title={`Delete ${selectedAssistant.name}`}
          description="Are you sure you want to delete this assistant? This action cannot be undone."
          onConfirm={confirmDelete}
          onCancel={() => {
            setShowDeleteDialog(false);
            setSelectedAssistant(null);
          }}
        />
      )}
    </div>
  );
}