import { Card } from "@/components/ui/card";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CallInterface } from './components/CallInterface';
import { WhisperGoals } from './components/WhisperGoals';
import { ContactSelector } from './ContactSelector';
import { useWhisperState } from './hooks/useWhisperState';

export default function WhisperComponent() {
  const {
    state,
    set,
    handleStartCall,
    handleEndCall,
    handleSelectContact,
    handleSendMessage,
    handleVoiceInput,
    handleGoalUpdate,
    handleGoalAdd,
  } = useWhisperState();

  return (
    <TooltipProvider>
      <div className="container mx-auto p-6 bg-gray-900 text-gray-100">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-teal-400">Whisper Management</h1>
          <p className="text-gray-400">Manage AI whisper suggestions and goals during calls</p>
        </div>

        <Tabs defaultValue="call" className="space-y-6">
          <TabsList className="bg-gray-800">
            <TabsTrigger value="call">Active Call</TabsTrigger>
            <TabsTrigger value="goals">Whisper Goals</TabsTrigger>
          </TabsList>

          <TabsContent value="call" className="space-y-6">
            <div className={`grid ${state.activeCall ? 'grid-cols-1' : 'grid-cols-3'} gap-6`}>
              {!state.activeCall && (
                <div className="col-span-1">
                  <ContactSelector
                    contacts={state.contacts}
                    selectedContact={state.selectedContact}
                    onSelectContact={handleSelectContact}
                    showAddContactModal={state.showContactDialog}
                    setShowAddContactModal={(show) => set('showContactDialog', show)}
                  />
                </div>
              )}

              <div className={state.activeCall ? 'col-span-full' : 'col-span-2'}>
                <Card className="bg-gray-800 border-gray-700">
                  <CallInterface
                    state={state}
                    onStartCall={handleStartCall}
                    onEndCall={handleEndCall}
                    onSendMessage={handleSendMessage}
                    onVoiceInput={handleVoiceInput}
                    onMicMute={(muted) => set('micMuted', muted)}
                    onVolumeChange={(volume) => set('volume', volume)}
                  />
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="goals">
            {state.selectedContact ? (
              <WhisperGoals
                contact={state.selectedContact}
                onGoalUpdate={handleGoalUpdate}
                onGoalAdd={handleGoalAdd}
              />
            ) : (
              <Card className="p-6 bg-gray-800 border-gray-700">
                <p className="text-center text-gray-400">
                  Please select a contact to manage their goals
                </p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}