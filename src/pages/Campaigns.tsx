import React, { useState, useEffect } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, Calendar, Clock, Phone, User, BarChart2, Download, Upload } from 'lucide-react';

// Utility function for merging class names
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Get variant styling based on campaign status
const getStatusVariant = (status: Campaign['status']): { variant: "default" | "secondary" | "success" | "destructive"; label: string } => {
  switch (status) {
    case 'ACTIVE':
      return { variant: "success", label: "Active" };
    case 'PAUSED':
      return { variant: "secondary", label: "Paused" };
    case 'DRAFT':
      return { variant: "default", label: "Draft" };
    default:
      return { variant: "default", label: status };
  }
};

// Format date for display in the UI
const formatDateForDisplay = (date: string | Date | undefined): string => {
  if (!date) return 'Not set';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Format date for input fields
const formatDateForInput = (date: string | Date | undefined): string => {
  if (!date) return '';
  const d = new Date(date);
  return d.toISOString().split('T')[0];
};

interface Contact {
  id: string;
  name: string;
  phone: string;
}

interface Assistant {
  id: string;
  name: string;
  model: string;
  provider: string;
  capabilities: ('SALES' | 'FEEDBACK' | 'SUPPORT' | 'SURVEY' | 'CUSTOM')[];
  knowledgeBases?: {
    id: string;
    name: string;
    description: string;
    type: 'PDF' | 'TEXT' | 'WEBPAGE' | 'API';
  }[];
}

interface CampaignGoal {
  id: string;
  name: string;
  description: string;
  type: 'SALES' | 'FEEDBACK' | 'SUPPORT' | 'SURVEY' | 'CUSTOM';
  targetMetric?: number;
  currentMetric?: number;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  customInstructions?: string; // Additional instructions for the assistant
  createdAt: string;
  updatedAt: string;
}

interface Campaign {
  id: string;
  name: string;
  description?: string;
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
  startDate: string;
  endDate?: string;
  metrics?: {
    totalCalls: number;
    successfulCalls: number;
    failedCalls: number;
    averageDuration: number;
  };
  assistantId: string;
  knowledgeBaseIds?: string[]; // References to uploaded knowledge bases
  campaign_goals: CampaignGoal[];
  contacts?: Contact[];
  createdAt?: string;
  updatedAt?: string;
}

interface ContactSelectorProps {
  selectedContacts: string[];
  onContactsChange: (contacts: string[]) => void;
}

interface GoalSelectorProps {
  selectedGoals: CampaignGoal[];
  onGoalsChange: (goals: CampaignGoal[]) => void;
  assistantId?: string; // To show relevant goals based on assistant capabilities
}

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/api$/, '');

const ContactSelector: React.FC<ContactSelectorProps> = ({
  selectedContacts,
  onContactsChange
}) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = React.createRef<HTMLInputElement>();
  const { toast } = useToast();
  const token = localStorage.getItem('token');

  const handleDownloadTemplate = async () => {
    try {
      setIsLoading(true);
      
      console.log('Making request to:', `${API_BASE_URL}/api/contacts/template`);
      console.log('Token present:', !!token);

      const response = await fetch(`${API_BASE_URL}/api/contacts/template`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response:', errorText);
        throw new Error('Failed to download template');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'contacts_template.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (error: any) {
      console.error('Download error:', error);
      toast({
        title: 'Download failed',
        description: error.message || 'Failed to download template',
        variant: 'destructive',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a CSV file',
        variant: 'destructive',
        duration: 5000,
      });
      event.target.value = '';
      return;
    }

    try {
      setIsLoading(true);
      const formData = new FormData();
      formData.append('file', file);

      console.log('Making request to:', `${API_BASE_URL}/api/contacts/upload`);
      console.log('Token present:', !!token);
      console.log('File details:', {
        name: file.name,
        type: file.type,
        size: file.size
      });

      // Read file content for validation
      const reader = new FileReader();
      reader.onload = async (e) => {
        const content = e.target?.result as string;
        
        // Basic validation of file content
        if (content.trim().startsWith('{') || content.trim().startsWith('[')) {
          toast({
            title: 'Invalid file format',
            description: 'The file appears to be JSON. Please upload a valid CSV file.',
            variant: 'destructive',
            duration: 5000,
          });
          event.target.value = '';
          setIsLoading(false);
          return;
        }

        const lines = content.split('\n').filter(line => line.trim());
        if (lines.length < 2) {
          toast({
            title: 'Invalid CSV format',
            description: 'File must contain at least a header row and one data row',
            variant: 'destructive',
            duration: 5000,
          });
          event.target.value = '';
          setIsLoading(false);
          return;
        }

        const headerRow = lines[0].toLowerCase();
        if (!headerRow.includes('name') || !headerRow.includes('phone')) {
          toast({
            title: 'Invalid CSV format',
            description: 'CSV must contain "name" and "phone" columns',
            variant: 'destructive',
            duration: 5000,
          });
          event.target.value = '';
          setIsLoading(false);
          return;
        }

        // If validation passes, proceed with upload
        const response = await fetch(`${API_BASE_URL}/api/contacts/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
          credentials: 'include',
        });

        // Log response details
        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Server response:', errorText);
          try {
            const errorJson = JSON.parse(errorText);
            throw new Error(errorJson.error?.message || 'Failed to upload contacts');
          } catch (e) {
            throw new Error(`Failed to upload contacts: ${response.status} ${response.statusText}`);
          }
        }

        const result = await response.json();

        if (result.data.errors?.length > 0) {
          toast({
            title: 'Upload completed with warnings',
            description: `Imported ${result.data.imported} contacts. ${result.data.errors.length} rows had errors.`,
            variant: 'warning',
            duration: 5000,
          });
        } else {
          toast({
            title: 'Upload successful',
            description: `Successfully imported ${result.data.imported} contacts`,
            variant: 'success',
            duration: 3000,
          });
        }

        // Refresh contacts list
        await fetchContacts();
      };

      reader.onerror = () => {
        toast({
          title: 'File read error',
          description: 'Failed to read the file content',
          variant: 'destructive',
          duration: 5000,
        });
        setIsLoading(false);
      };

      reader.readAsText(file);

    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload contacts',
        variant: 'destructive',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
      // Reset the file input
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={handleDownloadTemplate}
            disabled={isLoading}
          >
            <Download className="w-4 h-4 mr-2" />
            Download Template
          </Button>
          
          <div className="relative">
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv"
              className="hidden"
              onChange={handleUploadCSV}
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload CSV
            </Button>
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center space-x-2">
            <Spinner size="sm" />
            <span className="text-sm text-muted-foreground">
              Uploading contacts...
            </span>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <div className="border rounded-lg">
        {/* Existing contact list UI */}
      </div>
    </div>
  );
};

const CampaignGoalSelector: React.FC<GoalSelectorProps> = ({
  selectedGoals = [], // Provide default empty array
  onGoalsChange,
  assistantId
}) => {
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [availableGoals, setAvailableGoals] = useState<CampaignGoal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch available goals when assistantId changes
  useEffect(() => {
    const fetchGoals = async () => {
      if (!assistantId) {
        setAvailableGoals([]);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        // Mock data for now - replace with actual API call
        const mockGoals: CampaignGoal[] = [
          {
            id: '1',
            name: 'Increase Sales',
            description: 'Increase sales by 20% through outbound calls',
            type: 'SALES',
            targetMetric: 20,
            currentMetric: 0,
            status: 'NOT_STARTED',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: '2',
            name: 'Customer Feedback',
            description: 'Collect customer feedback on new product features',
            type: 'FEEDBACK',
            status: 'NOT_STARTED',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ];
        setAvailableGoals(mockGoals);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch goals');
      } finally {
        setLoading(false);
      }
    };

    fetchGoals();
  }, [assistantId]);

  const handleAddGoal = (goal: CampaignGoal) => {
    const updatedGoals = [...selectedGoals, goal];
    onGoalsChange(updatedGoals);
    setIsAddingGoal(false);
  };

  const handleRemoveGoal = (goalId: string) => {
    const updatedGoals = selectedGoals.filter(g => g.id !== goalId);
    onGoalsChange(updatedGoals);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Campaign Goals</Label>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsAddingGoal(true)}
          className="h-8"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Goal
        </Button>
      </div>

      <ScrollArea className="h-[200px] pr-4">
        {selectedGoals?.map((goal) => (
          <div
            key={goal.id}
            className="flex items-start justify-between p-3 bg-card rounded-lg mb-2 group"
          >
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-medium">{goal.name}</span>
                <Badge variant="outline">{goal.type}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{goal.description}</p>
              {goal.targetMetric !== undefined && (
                <div className="text-sm text-muted-foreground mt-1">
                  Target: {goal.targetMetric}%
                  {goal.currentMetric !== undefined && ` | Current: ${goal.currentMetric}%`}
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100"
              onClick={() => handleRemoveGoal(goal.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
        {selectedGoals?.length === 0 && (
          <div className="text-center text-muted-foreground py-4">
            No goals selected. Click "Add Goal" to get started.
          </div>
        )}
      </ScrollArea>

      <Dialog open={isAddingGoal} onOpenChange={setIsAddingGoal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Campaign Goal</DialogTitle>
            <DialogDescription>
              Select a goal to add to your campaign
            </DialogDescription>
          </DialogHeader>
          
          {loading && <div className="text-center py-4">Loading goals...</div>}
          {error && <div className="text-red-500 text-center py-4">{error}</div>}
          
          {!loading && !error && (
            <div className="space-y-4">
              {availableGoals.map((goal) => (
                <div
                  key={goal.id}
                  className="flex items-start justify-between p-3 bg-card rounded-lg cursor-pointer hover:bg-accent"
                  onClick={() => handleAddGoal(goal)}
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{goal.name}</span>
                      <Badge variant="outline">{goal.type}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{goal.description}</p>
                  </div>
                </div>
              ))}
              {availableGoals.length === 0 && (
                <div className="text-center text-muted-foreground py-4">
                  No goals available for this assistant.
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const Campaigns = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newCampaign, setNewCampaign] = useState<Partial<Campaign>>({
    status: 'DRAFT',
    campaign_goals: []
  });
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [assistants, setAssistants] = useState<Assistant[]>([]);

  useEffect(() => {
    // Mock data - replace with actual API calls
    const mockAssistants: Assistant[] = [
      {
        id: '1',
        name: 'Sales Assistant',
        model: 'gpt-4',
        provider: 'openai',
        capabilities: ['SALES'],
      },
      {
        id: '2',
        name: 'Support Assistant',
        model: 'gpt-4',
        provider: 'openai',
        capabilities: ['SUPPORT'],
      }
    ];
    setAssistants(mockAssistants);
  }, []);

  const handleCampaignChange = (field: keyof Campaign, value: any) => {
    setNewCampaign(prev => ({ ...prev, [field]: value }));
  };

  const handleStatusChange = (status: Campaign['status']) => {
    handleCampaignChange('status', status);
  };

  const handleSave = () => {
    const campaign: Campaign = {
      id: crypto.randomUUID(),
      ...newCampaign,
      contacts: selectedContacts.map(id => ({ id, name: '', phone: '' })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as Campaign;

    setCampaigns(prev => [...prev, campaign]);
    setIsCreating(false);
    setNewCampaign({
      status: 'DRAFT',
      campaign_goals: []
    });
    setSelectedContacts([]);
  };

  return (
    <div className="flex h-full">
      {/* Left Column - Campaign List */}
      <div className="w-1/3 p-6 border-r border-border">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Outbound Campaigns</h2>
          
          <Button
            className="w-full bg-primary hover:bg-primary/90"
            onClick={() => setIsCreating(true)}
          >
            <Plus className="w-4 h-4 mr-2" /> New Campaign
          </Button>

          <div className="space-y-2">
            {campaigns.map((campaign) => (
              <div
                key={campaign.id}
                className={cn(
                  "p-4 rounded-lg cursor-pointer transition-colors",
                  "hover:bg-accent",
                  selectedCampaign?.id === campaign.id ? "bg-accent" : "bg-card"
                )}
                onClick={() => setSelectedCampaign(campaign)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{campaign.name}</h3>
                  <Badge variant={getStatusVariant(campaign.status).variant}>
                    {getStatusVariant(campaign.status).label}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {campaign.description || "No description"}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column - Campaign Details */}
      <div className="flex-1 p-6">
        {selectedCampaign ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Edit Campaign</h2>
              <Button variant="outline" onClick={() => setSelectedCampaign(null)}>
                Close
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Outbound Phone</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select outbound phone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">+1 (555) 123-4567</SelectItem>
                    <SelectItem value="2">+1 (555) 987-6543</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Assistant</Label>
                <Select
                  value={selectedCampaign.assistantId}
                  onValueChange={(value) => handleCampaignChange('assistantId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select assistant" />
                  </SelectTrigger>
                  <SelectContent>
                    {assistants.map((assistant) => (
                      <SelectItem key={assistant.id} value={assistant.id}>
                        {assistant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={selectedCampaign.name}
                onChange={(e) => handleCampaignChange('name', e.target.value)}
                placeholder="Enter campaign name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Set Date</Label>
                <Input
                  type="date"
                  value={formatDateForInput(selectedCampaign.startDate)}
                  onChange={(e) => handleCampaignChange('startDate', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Set Time</Label>
                <Input
                  type="time"
                  value={selectedCampaign.startTime || ''}
                  onChange={(e) => handleCampaignChange('startTime', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={selectedCampaign.description || ''}
                onChange={(e) => handleCampaignChange('description', e.target.value)}
                placeholder="Enter description here"
                rows={4}
              />
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Contact List</Label>
                <Card className="p-4">
                  <ContactSelector
                    selectedContacts={selectedCampaign.contacts?.map(c => c.id) || []}
                    onContactsChange={(contacts) => {
                      handleCampaignChange('contacts', 
                        contacts.map(id => ({ id, name: '', phone: '' }))
                      );
                    }}
                  />
                </Card>
              </div>
            </div>

            <Button 
              className="w-full bg-primary hover:bg-primary/90"
              onClick={() => {
                // Handle update
                setCampaigns(prev => 
                  prev.map(c => 
                    c.id === selectedCampaign.id ? selectedCampaign : c
                  )
                );
              }}
            >
              Update Campaign
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Select a campaign or create a new one
          </div>
        )}
      </div>

      {/* Create Campaign Dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Create New Campaign</DialogTitle>
            <DialogDescription>
              Create a new campaign by filling out the details below
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Outbound Phone</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select outbound phone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">+1 (555) 123-4567</SelectItem>
                    <SelectItem value="2">+1 (555) 987-6543</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Assistant</Label>
                <Select
                  value={newCampaign.assistantId}
                  onValueChange={(value) => handleCampaignChange('assistantId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select assistant" />
                  </SelectTrigger>
                  <SelectContent>
                    {assistants.map((assistant) => (
                      <SelectItem key={assistant.id} value={assistant.id}>
                        {assistant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={newCampaign.name || ''}
                onChange={(e) => handleCampaignChange('name', e.target.value)}
                placeholder="Enter campaign name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Set Date</Label>
                <Input
                  type="date"
                  value={formatDateForInput(newCampaign.startDate)}
                  onChange={(e) => handleCampaignChange('startDate', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Set Time</Label>
                <Input
                  type="time"
                  value={newCampaign.startTime || ''}
                  onChange={(e) => handleCampaignChange('startTime', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={newCampaign.description || ''}
                onChange={(e) => handleCampaignChange('description', e.target.value)}
                placeholder="Enter description here"
                rows={4}
              />
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Contact List</Label>
                <Card className="p-4">
                  <ContactSelector
                    selectedContacts={selectedContacts}
                    onContactsChange={setSelectedContacts}
                  />
                </Card>
              </div>
            </div>

            <Button 
              className="w-full bg-primary hover:bg-primary/90"
              onClick={handleSave}
            >
              Create Campaign
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Campaigns;