export class AppStateStore {
  private static instance: AppStateStore;
  public currentMode: 'idle' | 'generating' | 'error' = 'idle';

  private constructor() {}

  public static getInstance(): AppStateStore {
    if (!AppStateStore.instance) {
      AppStateStore.instance = new AppStateStore();
    }
    return AppStateStore.instance;
  }

  public setMode(mode: 'idle' | 'generating' | 'error') {
    this.currentMode = mode;
  }
}

export const appState = AppStateStore.getInstance();
