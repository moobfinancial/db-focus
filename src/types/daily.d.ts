interface DailyIframeOptions {
  url?: string;
  token?: string;
  dailyConfig?: any;
  showLeaveButton?: boolean;
  showFullscreenButton?: boolean;
  iframeStyle?: {
    position?: string;
    top?: string;
    left?: string;
    width?: string;
    height?: string;
    border?: string;
    backgroundColor?: string;
  };
}

interface DailyCall {
  join(): Promise<void>;
  leave(): Promise<void>;
  destroy(): void;
  on(event: string, callback: (...args: any[]) => void): void;
  off(event: string, callback: (...args: any[]) => void): void;
}

interface DailyIframe {
  createFrame(options?: DailyIframeOptions): Promise<DailyCall>;
}

declare global {
  interface Window {
    DailyIframe: {
      createFrame: (options?: {
        iframeStyle?: {
          position?: string;
          width?: string;
          height?: string;
          border?: string;
          backgroundColor?: string;
        };
        showLeaveButton?: boolean;
        showFullscreenButton?: boolean;
      }) => {
        on: (event: string, callback: (event?: any) => void) => any;
        join: (options: { url: string }) => Promise<void>;
        destroy: () => void;
      };
    };
  }
}

export interface DailyCallFrame {
  on: (event: string, callback: (event?: any) => void) => DailyCallFrame;
  join: (options: { url: string }) => Promise<void>;
  destroy: () => void;
}

export interface DailyStartResponse {
  success: boolean;
  roomUrl: string;
  sessionId: string;
  error?: {
    code: string;
    message: string;
  };
}
