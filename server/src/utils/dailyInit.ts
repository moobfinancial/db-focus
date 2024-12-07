import DailyIframe from '@daily-co/daily-js';

export interface DailyInitOptions {
  containerId: string;
  onJoinedMeeting?: () => void;
  onError?: (error: Error) => void;
}

export class DailyInitializer {
  private frame: any;
  private initialized: boolean = false;
  private micPermissionGranted: boolean = false;

  constructor(private options: DailyInitOptions) {}

  /**
   * Request microphone permissions and initialize Daily.co frame
   */
  async initialize(): Promise<boolean> {
    try {
      // Step 1: Request microphone permissions
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.micPermissionGranted = true;
      stream.getTracks().forEach(track => track.stop()); // Clean up

      // Step 2: Create Daily.co frame
      this.frame = DailyIframe.createFrame({
        showLeaveButton: true,
        iframeStyle: {
          position: 'fixed',
          width: '100%',
          height: '100%',
          border: 'none',
        },
        showFullscreenButton: true,
      });

      // Step 3: Initialize frame
      await this.frame.join();
      this.initialized = true;

      // Call success callback if provided
      if (this.options.onJoinedMeeting) {
        this.options.onJoinedMeeting();
      }

      return true;
    } catch (error) {
      console.error('Failed to initialize Daily.co:', error);
      if (this.options.onError) {
        this.options.onError(error as Error);
      }
      return false;
    }
  }

  /**
   * Get initialization status for API requests
   */
  getStatus() {
    return {
      clientInitialized: this.initialized,
      micPermissionGranted: this.micPermissionGranted
    };
  }

  /**
   * Join a specific room with the provided URL and token
   */
  async joinRoom(roomUrl: string, token: string): Promise<void> {
    if (!this.initialized) {
      throw new Error('Daily.co frame not initialized. Call initialize() first.');
    }

    try {
      await this.frame.join({
        url: roomUrl,
        token
      });
    } catch (error) {
      console.error('Failed to join room:', error);
      throw error;
    }
  }

  /**
   * Clean up resources
   */
  destroy() {
    if (this.frame) {
      this.frame.destroy();
    }
    this.initialized = false;
    this.micPermissionGranted = false;
  }
}
