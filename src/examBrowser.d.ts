export {};

declare global {
  interface Window {
    learnWithUncleTee?: {
      isDesktop: boolean;
      clientInfo?: {
        appVersion?: string;
        installId?: string;
        platform?: string;
      };
      enterExamMode: (payload: { token: string }) => Promise<{ ok: boolean }>;
      exitExamMode: (payload?: { token?: string }) => Promise<{ ok: boolean }>;
      onExamModeChanged?: (listener: (active: boolean) => void) => () => void;
    };
  }
}
