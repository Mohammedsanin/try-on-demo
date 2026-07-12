export {};

declare global {
  interface Window {
    tryOn?: {
      listGarments(): Promise<string[]>;
      readGarment(name: string): Promise<Uint8Array>;
    };
  }
}
