import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play } from "lucide-react";
import type { Voice, Provider } from './types';

interface VoiceDetailsModalProps {
  voice: Voice | null;
  isOpen: boolean;
  onClose: () => void;
  providers: Provider[];
}

export function VoiceDetailsModal({ voice, isOpen, onClose, providers }: VoiceDetailsModalProps) {
  if (!voice) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 text-white border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-white">
            Voice Details: {voice.name}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            View detailed information about this voice and listen to a sample.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <div>
            <h4 className="font-semibold text-white mb-2">Characteristics</h4>
            <div className="space-y-2 text-gray-300">
              <div>Gender: {voice.gender}</div>
              <div>Nationality: {voice.nationality}</div>
              <div>Language: {voice.language}</div>
              <div className="flex items-center">
                <span>Provider: {voice.provider}</span>
                <Badge 
                  variant={providers.find(p => p.name === voice.provider)?.status === "Included" ? "secondary" : "destructive"}
                  className="ml-2"
                >
                  {providers.find(p => p.name === voice.provider)?.status || "Custom"}
                </Badge>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {voice.traits.map((trait) => (
                <span key={trait} className="px-2 py-0.5 bg-gray-700 text-gray-200 rounded-full text-xs">
                  {trait}
                </span>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-2">Actions</h4>
            <div className="space-y-2">
              <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white">
                <Play className="w-4 h-4 mr-2" /> Play Sample
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}