import { AsyncLocalStorage } from 'async_hooks';

export interface TeammateContext {
  id: string;
  name: string;
  teamName: string;
  backend: 'in-process' | 'tmux' | 'iterm2';
  color: string;
  cwd: string;
}

const teammateContextStorage = new AsyncLocalStorage<TeammateContext>();

export function runWithTeammateContext<T>(context: TeammateContext, fn: () => T): T {
  return teammateContextStorage.run(context, fn);
}

export function getTeammateContext(): TeammateContext | undefined {
  return teammateContextStorage.getStore();
}

export function isInProcessTeammate(): boolean {
  return teammateContextStorage.getStore() !== undefined;
}
