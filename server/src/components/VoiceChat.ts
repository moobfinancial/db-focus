import { DailyInitializer } from '../utils/dailyInit';

export class VoiceChat {
  private dailyInit: DailyInitializer;

  constructor(containerId: string) {
    this.dailyInit = new DailyInitializer({
      containerId,
      onJoinedMeeting: () => {
        console.log('Successfully joined the meeting');
      },
      onError: (error) => {
        console.error('Error in voice chat:', error);
      }
    });
  }

  async startVoiceChat(assistantId: string): Promise<void> {
    try {
      // Step 1: Initialize Daily.co frame and get microphone permissions
      const initialized = await this.dailyInit.initialize();
      if (!initialized) {
        throw new Error('Failed to initialize Daily.co frame');
      }

      // Step 2: Get initialization status
      const status = this.dailyInit.getStatus();

      // Step 3: Make API call to start bot session
      const response = await fetch('/api/start-bot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          assistantId,
          rtvi: {
            services: {
              tts: 'cartesia',
              llm: 'openai',
              stt: 'deepgram'
            },
            config: [
              // Your RTVI config here
            ],
            ...status // Include initialization status
          }
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to start bot session');
      }

      const { room_url, token } = await response.json();

      // Step 4: Join the room with the provided URL and token
      await this.dailyInit.joinRoom(room_url, token);
    } catch (error) {
      console.error('Failed to start voice chat:', error);
      throw error;
    }
  }

  destroy() {
    this.dailyInit.destroy();
  }
}
