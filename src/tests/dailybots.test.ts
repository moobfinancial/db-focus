import { dailybotsApi } from '@/lib/api/client';
import axios from 'axios';

jest.mock('axios');

describe('DailyBots API', () => {
  it('should start a conversation successfully', async () => {
    const mockResponse = {
      data: {
        success: true,
        sessionId: 'test-session-id',
        roomUrl: 'https://example.com/room',
        token: 'test-token'
      }
    };

    (axios.post as jest.Mock).mockResolvedValue(mockResponse);

    const response = await dailybotsApi.startConversation('test-assistant-id', {
      maxDuration: 300,
      pauseThreshold: 1000,
      silenceThreshold: 500,
      voiceSettings: {
        speed: 1,
        pitch: 1,
        stability: 1,
        volume: 1
      }
    });

    expect(response.success).toBe(true);
    expect(response.sessionId).toBe('test-session-id');
    expect(response.roomUrl).toBe('https://example.com/room');
  });

  it('should handle errors when starting a conversation', async () => {
    const mockErrorResponse = {
      response: {
        data: {
          success: false,
          error: 'Failed to start conversation'
        }
      }
    };

    (axios.post as jest.Mock).mockRejectedValue(mockErrorResponse);

    const response = await dailybotsApi.startConversation('test-assistant-id', {});

    expect(response.success).toBe(false);
    expect(response.error).toBe('Failed to start conversation');
  });
});
