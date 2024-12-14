import React, { useState, useEffect } from 'react';
import { Share2, Settings, Mic, Trash2, Play, Command, MicOff, Send, Volume2, Save, X, Pause } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { toast, useToast } from "@/components/ui/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { TTS_PROVIDERS } from '@/config/providers';
import { dailybotsApi } from '@/lib/api/client';
import type { StartConversationResponse } from '@/lib/api/client';

// Define types for voice settings and call state
type VoiceSettings = {
  speed: number;
  pitch: number;
  stability: number;
  volume: number;
};

type VoiceProvider = keyof typeof TTS_PROVIDERS;

interface AssistantCardProps {
  assistant: Assistant;
  onDelete: () => void;
  onUpdate: (assistant: Partial<Assistant>) => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

const VOICE_PROVIDERS = [
  { id: 'CARTESIA', name: 'Cartesia' },
  { id: 'ELEVEN_LABS', name: 'ElevenLabs' },
  { id: 'CUSTOM', name: 'Custom' }
];

const CUSTOM_VOICES = [
  { id: 'custom-1', name: 'Custom Voice 1' },
  { id: 'custom-2', name: 'Custom Voice 2' }
];

const voiceOptions = {
  cartesia: [
    { id: '3f4ade23-6eb4-4279-ab05-6a144947c4d5', name: 'Emma (Female)' },
    { id: '7c3f994d-db4b-4583-a6f4-82a45a17c629', name: 'James (Male)' }
  ],
  eleven_labs: [
    { id: 'pNInz6obpgDQGcFmaJgB', name: 'Rachel' },
    { id: 'yoZ06aMxZJJ28mfd3POQ', name: 'Domi' },
    { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella' }
  ],
  custom: CUSTOM_VOICES
};

// Voice animation component
const VoiceAnimation = ({ isActive }: { isActive: boolean }) => {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4].map((bar) => (
        <div
          key={bar}
          className={`w-1 bg-primary transition-all duration-200 ease-in-out ${
            isActive ? 'animate-voice-wave' : 'h-1'
          }`}
          style={{
            animationDelay: `${bar * 100}ms`,
            height: isActive ? '16px' : '4px'
          }}
        />
      ))}
    </div>
  );
};

export default function AssistantCard({ 
  assistant, 
  onDelete, 
  onUpdate 
}: AssistantCardProps) {
  // Simple UUID generation function
  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, 
          v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  // Add defensive checks
  if (!assistant) {
    console.error('AssistantCard: No assistant provided');
    return null;
  }

  // Ensure all required properties have default values
  const safeAssistant = {
    id: assistant.id || generateUUID(),
    name: assistant.name || 'Unnamed Assistant',
    firstMessage: assistant.firstMessage || 'Hello!',
    systemPrompt: assistant.systemPrompt || 'You are a helpful AI assistant.',
    provider: assistant.provider || 'DAILY_BOTS',
    model: assistant.model || 'gpt-3.5-turbo',
    tools: assistant.tools || [],
    voiceProvider: (assistant.voiceProvider || 'CARTESIA').toUpperCase() as VoiceProvider,
    voiceId: assistant.voiceId || '3f4ade23-6eb4-4279-ab05-6a144947c4d5',
    voiceSettings: {
      speed: assistant.voiceSettings?.speed ?? 1,
      pitch: assistant.voiceSettings?.pitch ?? 1,
      stability: assistant.voiceSettings?.stability ?? 0.5,
      volume: assistant.voiceSettings?.volume ?? 1
    }
  };

  // Debug logging
  console.log('Assistant data:', {
    originalProvider: assistant.voiceProvider,
    originalVoiceId: assistant.voiceId,
    safeProvider: safeAssistant.voiceProvider,
    safeVoiceId: safeAssistant.voiceId,
    voiceSettings: safeAssistant.voiceSettings
  });

  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('model');
  const [isEditing, setIsEditing] = useState(false);
  const [editedAssistant, setEditedAssistant] = useState(safeAssistant);
  const [testMessage, setTestMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState<Array<{role: string, content: string}>>([]);
  const [testing, setTesting] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [dailyCall, setDailyCall] = useState<DailyCallFrame | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');

  useEffect(() => {
    setEditedAssistant(safeAssistant);
  }, [assistant]);

  useEffect(() => {
    const loadDailyScript = async () => {
      console.log('Checking Daily.co script status...');
      if (window.DailyIframe) {
        console.log('Daily.co script already loaded');
        return;
      }
      
      console.log('Loading Daily.co script...');
      return new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/@daily-co/daily-js';
        script.async = true;
        script.onload = () => {
          console.log('Daily.co script loaded successfully');
          resolve();
        };
        script.onerror = (error) => {
          console.error('Failed to load Daily.co script:', error);
          reject(new Error('Failed to load Daily.co script'));
        };
        document.body.appendChild(script);
      });
    };

    loadDailyScript()
      .then(() => {
        console.log('Daily.co initialization complete');
      })
      .catch(error => {
        console.error('Error loading Daily.co script:', error);
        toast({
          title: "Error",
          description: "Failed to load Daily.co integration",
          variant: "destructive"
        });
      });
  }, []);

  const handleSave = () => {
    // Map back to the API structure
    const updatedAssistant = {
      ...editedAssistant,
      // Ensure provider and model are updated
      provider: editedAssistant.provider,
      model: editedAssistant.model,
      // Ensure voice settings are updated
      voiceProvider: editedAssistant.voiceProvider,
      voiceId: editedAssistant.voiceId,
      voiceSettings: editedAssistant.voiceSettings
    };
    
    onUpdate?.(updatedAssistant);
    setIsEditing(false);
    toast({
      title: "Success",
      description: "Assistant updated successfully"
    });
  };

  const handleTest = async () => {
    if (!testMessage.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message to test",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('Starting test conversation...');
      setTesting(true);
      setTranscript(prev => [...prev, { role: 'user', content: testMessage }]);

      // First, try to get a response from the LLM
      const response = await dailybotsApi.post('/assistants/chat', {
        assistantId: safeAssistant.id,
        message: testMessage,
      });

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Failed to get response from assistant');
      }

      const assistantResponse = response.data.response;
      setTranscript(prev => [...prev, { role: 'assistant', content: assistantResponse }]);

      // Only proceed with voice if voice settings are configured
      if (safeAssistant.voiceProvider && safeAssistant.voiceId) {
        // Ensure Daily.co is loaded
        if (!window.DailyIframe) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/@daily-co/daily-js';
            script.async = true;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load Daily.co script'));
            document.body.appendChild(script);
          });
        }

        // Start voice conversation
        const startData = {
          assistantId: safeAssistant.id,
          maxDuration: 300,
          pauseThreshold: 1000,
          silenceThreshold: 500,
          voiceSettings: {
            provider: safeAssistant.voiceProvider,
            voiceId: safeAssistant.voiceId,
            speed: safeAssistant.voiceSettings.speed,
            pitch: safeAssistant.voiceSettings.pitch,
            stability: safeAssistant.voiceSettings.stability,
            volume: safeAssistant.voiceSettings.volume
          }
        };

        const voiceResponse = await dailybotsApi.post<DailyStartResponse>('/daily/start', startData);
        
        if (!voiceResponse.data?.success) {
          throw new Error('Failed to start voice conversation');
        }

        const { roomUrl, sessionId } = voiceResponse.data;
        setActiveConversationId(sessionId);

        const callFrame = window.DailyIframe.createFrame({
          iframeStyle: {
            display: 'none' // Hide the iframe since we're handling UI ourselves
          },
          microphoneAccess: true,
          audioSource: true
        });

        callFrame
          .on('error', (e: any) => {
            console.error('Daily.co error:', e);
            toast({
              title: "Voice Error",
              description: e?.errorMsg || "Failed to connect voice",
              variant: "destructive"
            });
          })
          .on('joined-meeting', () => {
            console.log('Voice connected');
            setIsSpeaking(true);
          })
          .on('left-meeting', () => {
            setIsSpeaking(false);
            setDailyCall(null);
          });

        await callFrame.join({ url: roomUrl });
        setDailyCall(callFrame);
      }

    } catch (error) {
      console.error('Test error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to test assistant",
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  const handleStopTest = () => {
    if (dailyCall) {
      dailyCall.destroy();
      setDailyCall(null);
    }
    setTesting(false);
    setIsSpeaking(false);
    setActiveConversationId(null);
  };

  const handleVoiceProviderChange = (provider: string) => {
    console.log('Voice provider changed:', {
      provider,
      currentVoiceId: editedAssistant.voiceId,
      availableVoices: voiceOptions[provider],
      willKeepCurrentVoice: voiceOptions[provider]?.some(v => v.id === editedAssistant.voiceId)
    });
    
    setEditedAssistant(prev => ({
      ...prev,
      voiceProvider: provider,
      // Keep the existing voiceId if it exists in the new provider's options, otherwise use the first voice
      voiceId: voiceOptions[provider]?.some(v => v.id === prev.voiceId) 
        ? prev.voiceId 
        : voiceOptions[provider]?.[0]?.id || 'nova',
      voiceSettings: prev.voiceSettings
    }));
  };

  const handleVoiceIdChange = (voiceId: string) => {
    console.log('Voice ID changed:', {
      voiceId,
      provider: editedAssistant.voiceProvider,
      availableVoices: voiceOptions[editedAssistant.voiceProvider?.toLowerCase() || '']
    });
    setEditedAssistant(prev => ({
      ...prev,
      voiceId
    }));
  };

  const handleVolumeChange = (value: number) => {
    setEditedAssistant(prev => ({
      ...prev,
      voiceSettings: {
        ...prev.voiceSettings,
        volume: value,
      }
    }));
  };

  const handleVoiceSettingChange = (setting: string, value: number) => {
    setEditedAssistant(prev => ({
      ...prev,
      voiceSettings: {
        ...prev.voiceSettings,
        [setting]: value,
      }
    }));
  };

  const handleStartConversation = async () => {
    if (!window.DailyIframe) {
      toast({
        title: "Error",
        description: "Daily.co is not loaded yet. Please try again.",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await dailybotsApi.startConversation(assistant.id, {
        maxDuration: 300,
        pauseThreshold: 1000,
        silenceThreshold: 500,
        voiceSettings: {
          speed: assistant.voiceSettings?.speed || 1,
          pitch: assistant.voiceSettings?.pitch || 1,
          stability: assistant.voiceSettings?.stability || 0.5,
          volume: assistant.voiceSettings?.volume || 1
        }
      });

      if (response.success && response.data) {
        setActiveConversationId(response.data.conversationId);
        setDailyCall(response.data.daily);

        // Set up Daily.co event handlers
        response.data.daily.on('participant-started-speaking', () => {
          setIsSpeaking(true);
        });

        response.data.daily.on('participant-stopped-speaking', () => {
          setIsSpeaking(false);
        });

        // Handle first message
        if (assistant.firstMessage) {
          setIsSpeaking(true);
          await new Promise(resolve => setTimeout(resolve, assistant.firstMessage.length * 50));
          setIsSpeaking(false);
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start conversation",
        variant: "destructive"
      });
    }
  };

  const handlePauseConversation = async () => {
    if (!activeConversationId) return;
    try {
      await dailybotsApi.pauseConversation(activeConversationId);
      setIsRecording(false);
      setIsSpeaking(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to pause conversation",
        variant: "destructive"
      });
    }
  };

  const handleResumeConversation = async () => {
    if (!activeConversationId) return;
    try {
      await dailybotsApi.resumeConversation(activeConversationId);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resume conversation",
        variant: "destructive"
      });
    }
  };

  const handleEndConversation = async () => {
    if (!activeConversationId || !dailyCall) return;

    try {
      await dailybotsApi.endConversation(activeConversationId, dailyCall);
      setActiveConversationId(null);
      setDailyCall(null);
      setIsRecording(false);
      setIsSpeaking(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to end conversation",
        variant: "destructive"
      });
    }
  };

  const speakMessage = async (text: string) => {
    if (!assistant.voiceProvider || !assistant.voiceId) return;
    
    setIsSpeaking(true);
    try {
      // Here you would integrate with your voice provider API
      // For now, we'll simulate speaking with a timeout
      await new Promise(resolve => setTimeout(resolve, text.length * 50));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to speak message",
        variant: "destructive"
      });
    } finally {
      setIsSpeaking(false);
    }
  };

  const handleVoiceInput = async () => {
    if (!activeConversationId) return;

    try {
      setIsRecording(true);
      // Here you would integrate with the browser's Web Speech API
      // or another voice recognition service
      
      // For now, we'll simulate voice input
      await new Promise(resolve => setTimeout(resolve, 2000));
      const simulatedVoiceInput = "This is a simulated voice input";
      
      const userMessage: Message = {
        id: uuidv4(),
        role: 'user',
        content: simulatedVoiceInput,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage]);

      // Send message to API with LLM settings
      const response = await dailybotsApi.sendMessage(
        activeConversationId, 
        simulatedVoiceInput,
        {
          temperature: 0.7,
          maxTokens: 150,
          streamResponse: true
        }
      );

      if (response.success && response.data) {
        const assistantMessage: Message = {
          id: uuidv4(),
          role: 'assistant',
          content: response.data.message,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
        await speakMessage(assistantMessage.content);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process voice input",
        variant: "destructive"
      });
    } finally {
      setIsRecording(false);
    }
  };

  useEffect(() => {
    return () => {
      if (dailyCall) {
        dailyCall.destroy();
      }
    };
  }, [dailyCall]);

  // Add state for call management
  const [callStatus, setCallStatus] = useState<'idle' | 'starting' | 'ongoing' | 'ended'>('idle');
  const [isAssistantSpeaking, setIsAssistantSpeaking] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [callTranscript, setCallTranscript] = useState<string>('');

  // Function to start a call
  const startCall = async () => {
    try {
      setCallStatus('starting');
      
      console.log('Starting call with assistant:', {
        id: safeAssistant.id,
        voiceSettings: safeAssistant.voiceSettings,
        systemPrompt: safeAssistant.systemPrompt,
        firstMessage: safeAssistant.firstMessage
      });
      
      const response = await dailybotsApi.startConversation(safeAssistant.id, {
        maxDuration: 300,
        pauseThreshold: 1000,
        silenceThreshold: 500,
        voiceSettings: safeAssistant.voiceSettings,
        systemPrompt: safeAssistant.systemPrompt,
        firstMessage: safeAssistant.firstMessage
      });

      if (!response.success) {
        setCallStatus('ended');
        throw new Error(response.error?.message || 'Failed to start call');
      }

      setCallStatus('ongoing');
      setIsAssistantSpeaking(true);
      setDailyCall(response.daily);

      // Set up Daily.co event handlers
      response.daily
        .on('joining-meeting', () => {
          console.log('Joining meeting...');
        })
        .on('joined-meeting', async () => {
          console.log('Joined meeting');
          setIsAssistantSpeaking(true);
          
          // Wait a brief moment for audio to initialize
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Play first message if available
          if (safeAssistant.firstMessage) {
            console.log('Playing first message:', safeAssistant.firstMessage);
            setCallTranscript(safeAssistant.firstMessage);
          }
        })
        .on('left-meeting', () => {
          console.log('Left meeting');
          setCallStatus('ended');
          setIsAssistantSpeaking(false);
        })
        .on('error', (error: any) => {
          console.error('Daily.co error:', error);
          setCallStatus('ended');
          toast({
            title: "Call Error",
            description: error?.errorMsg || "Failed to connect call",
            variant: "destructive"
          });
        });
    } catch (error) {
      console.error('Start call error:', error);
      setCallStatus('ended');
      toast({
        title: "Error Starting Call",
        description: error instanceof Error ? error.message : "Failed to start call",
        variant: "destructive"
      });
    }
  };

  // Function to end a call
  const endCall = () => {
    if (dailyCall) {
      dailyCall.destroy();
      setDailyCall(null);
    }
    setCallStatus('ended');
    setIsAssistantSpeaking(false);
  };

  useEffect(() => {
    return () => {
      if (dailyCall) {
        dailyCall.destroy();
      }
    };
  }, [dailyCall]);

  return (
    <TooltipProvider>
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader className="border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Input
                      value={editedAssistant.name}
                      onChange={(e) => setEditedAssistant({ ...editedAssistant, name: e.target.value })}
                      className="text-xl font-semibold text-white bg-gray-700 border-gray-600"
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Edit assistant name</p>
                  </TooltipContent>
                </Tooltip>
              ) : (
                <h2 className="text-xl font-semibold text-white truncate">{safeAssistant.name}</h2>
              )}
              <p className="text-sm text-gray-400">ID: {safeAssistant.id}</p>
            </div>
            <div className="flex items-center space-x-2">
              {isEditing ? (
                <>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditedAssistant(safeAssistant);
                          setIsEditing(false);
                        }}
                        className="text-gray-400 hover:text-white"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Cancel editing</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleSave}
                        className="text-teal-400 hover:text-teal-300"
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Save changes</p>
                    </TooltipContent>
                  </Tooltip>
                </>
              ) : (
                <>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Share2 className="h-4 w-4 text-gray-400" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Share assistant</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsEditing(true)}
                      >
                        <Settings className="h-4 w-4 text-gray-400" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Edit assistant settings</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={onDelete}
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Delete assistant</p>
                    </TooltipContent>
                  </Tooltip>
                </>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="bg-gray-700">
              <TabsTrigger value="model">Model</TabsTrigger>
              <TabsTrigger value="voice">Voice</TabsTrigger>
              <TabsTrigger value="tools">Tools</TabsTrigger>
              <TabsTrigger value="test">Test</TabsTrigger>
            </TabsList>

            {activeTab === 'model' && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">First Message</label>
                  <Textarea
                    value={isEditing ? editedAssistant.firstMessage : safeAssistant.firstMessage}
                    onChange={(e) => setEditedAssistant({ ...editedAssistant, firstMessage: e.target.value })}
                    className="bg-gray-700 text-white border-gray-600"
                    placeholder="Enter the first message your assistant will say"
                    disabled={!isEditing}
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-2 block">System Prompt</label>
                  <Textarea
                    value={isEditing ? editedAssistant.systemPrompt : safeAssistant.systemPrompt}
                    onChange={(e) => setEditedAssistant({ ...editedAssistant, systemPrompt: e.target.value })}
                    className="bg-gray-700 text-white border-gray-600"
                    placeholder="Enter the system prompt that defines your assistant's behavior"
                    rows={4}
                    disabled={!isEditing}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Provider</label>
                    {isEditing ? (
                      <Select
                        value={editedAssistant.provider}
                        onValueChange={(value) => setEditedAssistant({ ...editedAssistant, provider: value })}
                      >
                        <SelectTrigger className="bg-gray-700 border-gray-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="openai">OpenAI</SelectItem>
                          <SelectItem value="anthropic">Anthropic</SelectItem>
                          <SelectItem value="google">Google</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="p-2 bg-gray-700 border border-gray-600 rounded-md text-white">
                        {safeAssistant.provider}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Model</label>
                    {isEditing ? (
                      <Select
                        value={editedAssistant.model}
                        onValueChange={(value) => setEditedAssistant({ ...editedAssistant, model: value })}
                      >
                        <SelectTrigger className="bg-gray-700 border-gray-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gpt-4">GPT-4</SelectItem>
                          <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                          <SelectItem value="claude-2">Claude 2</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="p-2 bg-gray-700 border border-gray-600 rounded-md text-white">
                        {safeAssistant.model}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'voice' && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Voice Provider</label>
                  <Select
                    value={isEditing ? editedAssistant.voiceProvider : safeAssistant.voiceProvider}
                    onValueChange={handleVoiceProviderChange}
                    disabled={!isEditing}
                  >
                    <SelectTrigger className="bg-gray-700 border-gray-600">
                      <SelectValue placeholder="Select voice provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {VOICE_PROVIDERS.map(provider => (
                        <SelectItem key={provider.id} value={provider.id}>
                          {provider.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {(isEditing ? editedAssistant.voiceProvider : safeAssistant.voiceProvider) && (
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Voice Selection</label>
                    {isEditing ? (
                      <Select
                        value={editedAssistant.voiceId}
                        onValueChange={handleVoiceIdChange}
                      >
                        <SelectTrigger className="bg-gray-700 border-gray-600">
                          <SelectValue placeholder="Select a voice" />
                        </SelectTrigger>
                        <SelectContent>
                          {(voiceOptions[editedAssistant.voiceProvider?.toLowerCase() || ''] || []).map(voice => (
                            <SelectItem key={voice.id} value={voice.id}>
                              {voice.name}
                            </SelectItem>
                          ))}
                          {!voiceOptions[editedAssistant.voiceProvider?.toLowerCase() || ''] && (
                            <SelectItem value="" disabled>
                              No voices available for this provider
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="p-2 bg-gray-700 border border-gray-600 rounded-md text-white">
                        {safeAssistant.voiceId}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'tools' && (
              <div className="space-y-4">
                {safeAssistant.tools && safeAssistant.tools.length > 0 ? (
                  safeAssistant.tools.map((tool, index) => (
                    <div key={index} className="p-4 bg-gray-700 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="text-white font-medium">{tool.id}</h4>
                          <p className="text-sm text-gray-400">
                            {Object.entries(tool.config).map(([key, value]) => (
                              `${key}: ${value}`
                            )).join(', ')}
                          </p>
                        </div>
                        <Badge variant="secondary">{tool.id}</Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    No tools configured
                  </div>
                )}
              </div>
            )}

            {activeTab === 'test' && (
              <TabsContent value="test" className="space-y-4">
                <div className="flex flex-col space-y-4">
                  {/* Call Controls */}
                  <div className="flex items-center justify-center space-x-4">
                    {callStatus === 'idle' && (
                      <Button
                        onClick={startCall}
                        className="flex items-center space-x-2"
                        disabled={callStatus === 'starting'}
                      >
                        <Mic className="w-4 h-4" />
                        <span>Start Call</span>
                      </Button>
                    )}
                    
                    {(callStatus === 'ongoing' || callStatus === 'starting') && (
                      <Button
                        onClick={endCall}
                        variant="destructive"
                        className="flex items-center space-x-2"
                      >
                        <X className="w-4 h-4" />
                        <span>End Call</span>
                      </Button>
                    )}
                  </div>

                  {/* Assistant Speaking Animation */}
                  {isAssistantSpeaking && (
                    <div className="flex justify-center">
                      <VoiceAnimation isActive={true} />
                    </div>
                  )}

                  {/* Call Status */}
                  <div className="text-center text-sm text-gray-500">
                    {callStatus === 'starting' && 'Connecting call...'}
                    {callStatus === 'ongoing' && 'Call in progress'}
                    {callStatus === 'ended' && 'Call ended'}
                  </div>

                  {/* Transcript Area */}
                  {showTranscript && callTranscript && (
                    <div className="mt-4">
                      <div className="text-sm font-medium mb-2">Transcript</div>
                      <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                        <div className="space-y-2">
                          {callTranscript}
                        </div>
                      </ScrollArea>
                    </div>
                  )}

                  {/* Toggle Transcript Button */}
                  <Button
                    variant="outline"
                    onClick={() => setShowTranscript(!showTranscript)}
                    className="w-full"
                  >
                    {showTranscript ? 'Hide Transcript' : 'Show Transcript'}
                  </Button>
                </div>
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}