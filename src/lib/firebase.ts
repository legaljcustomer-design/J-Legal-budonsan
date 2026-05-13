// Firebase is removed from the runtime to shift to a static architecture.
// This file is kept as a shell to prevent import errors during transition if needed.

export const db = null as any;
export const auth = {
  currentUser: null,
  onAuthStateChanged: (cb: any) => {
    cb(null);
    return () => {};
  },
  signOut: async () => {},
} as any;

export const signInWithGoogle = async () => {
    console.warn("Authentication is disabled in static mode.");
};

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  console.error(`Status: ${operationType} at ${path}`, error);
}
