declare global {
  interface Window {
    play?: (sequence: string) => void;
  }
}

export {};
