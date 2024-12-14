import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Loader2 } from 'lucide-react';
import { toast } from "@/components/ui/use-toast";
import type { Voice } from './types';

interface VoiceCardProps {
  voice: Voice;
  onSelect: (voice: Voice) => void;
}

export function VoiceCard({ voice, onSelect }: VoiceCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  const getProviderBadgeVariant = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'dailybots':
        return 'success';
      case 'rtvi':
        return 'warning';
      case '11labs':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getProviderDisplayName = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'dailybots':
        return 'Daily Bots';
      case 'rtvi':
        return 'RTVI';
      case '11labs':
        return '11Labs';
      default:
        return provider;
    }
  };

  const handlePlayPreview = async () => {
    try {
      if (isPlaying) {
        audio?.pause();
        setIsPlaying(false);
        return;
      }

      setIsPlaying(true);

      if (!voice.previewUrl) {
        throw new Error('No preview URL available for this voice');
      }

      const newAudio = new Audio(voice.previewUrl);
      setAudio(newAudio);

      newAudio.addEventListener('ended', () => {
        setIsPlaying(false);
        setAudio(null);
      });

      newAudio.addEventListener('error', () => {
        setIsPlaying(false);
        setAudio(null);
        toast({
          title: "Error",
          description: "Failed to play voice preview",
          variant: "destructive"
        });
      });

      await newAudio.play();
    } catch (error) {
      console.error('Error playing preview:', error);
      setIsPlaying(false);
      setAudio(null);
      toast({
        title: "Error",
        description: "Failed to play voice preview",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-lg font-semibold text-white">{voice.name}</h3>
            <p className="text-sm text-gray-400">{voice.nationality}</p>
          </div>
          <Badge variant={getProviderBadgeVariant(voice.provider)}>
            {getProviderDisplayName(voice.provider)}
          </Badge>
        </div>
        
        <div className="space-y-2 mb-4">
          <p className="text-sm text-gray-400">{voice.gender} • {voice.language}</p>
          <div className="flex flex-wrap gap-1">
            {voice.traits.map((trait, index) => (
              <Badge key={index} variant="outline" className="bg-gray-700">
                {trait}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex justify-between">
          <Button 
            size="sm" 
            variant="secondary" 
            className="w-24"
            disabled={!voice.previewUrl}
            onClick={handlePlayPreview}
          >
            {isPlaying ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Stop
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Play
              </>
            )}
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onSelect(voice)}
          >
            Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}