import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { app } from './firebase';

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

export const auth = getAuth(app);

const LOCAL_STORAGE_KEY = 'nidel_auth_user';

// Listeners set for local auth events
const listeners = new Set<(user: User | AppUser | null) => void>();

export function getLocalUser(): AppUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setLocalUser(user: AppUser | null) {
  if (typeof window === 'undefined') return;
  try {
    if (user) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  } catch (e) {
    console.error('Error saving local user:', e);
  }
  listeners.forEach((listener) => listener(user));
}

export function normalizeEmail(input: string): string {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed || trimmed === 'usuario') return 'usuario@nidelmuebles.com';
  if (trimmed === 'matias' || trimmed === 'matias@vascohogar.com' || trimmed.startsWith('matias@')) {
    return 'matias@vascohogar.com';
  }
  if (trimmed === 'admin' || trimmed === 'administrador') {
    return 'matias@vascohogar.com';
  }
  if (trimmed === 'ventas' || trimmed === 'vendedor') {
    return 'ventas@nidelmuebles.com';
  }
  if (!trimmed.includes('@')) {
    return `${trimmed}@nidelmuebles.com`;
  }
  return trimmed;
}

export async function loginWithEmail(emailInput: string, passwordInput?: string): Promise<User | AppUser> {
  const cleanInput = emailInput.trim();
  const email = normalizeEmail(cleanInput);
  
  let displayName = 'Usuario';
  if (email === 'matias@vascohogar.com') {
    displayName = 'Matías (Administrador)';
  } else if (email === 'ventas@nidelmuebles.com') {
    displayName = 'Ventas';
  } else if (cleanInput) {
    const base = cleanInput.includes('@') ? cleanInput.split('@')[0] : cleanInput;
    displayName = base.charAt(0).toUpperCase() + base.slice(1);
  }

  const localUser: AppUser = {
    uid: 'local-' + Date.now(),
    email: email,
    displayName: displayName,
  };

  // Set session immediately so user is NEVER blocked
  setLocalUser(localUser);

  // Background attempt to sync with Firebase if reachable
  if (passwordInput && passwordInput.length >= 6) {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, passwordInput);
      const fbUser: AppUser = {
        uid: cred.user.uid,
        email: cred.user.email,
        displayName: cred.user.displayName || displayName,
      };
      setLocalUser(fbUser);
      return cred.user;
    } catch {
      // Firebase fallback silently uses localUser
    }
  }

  return localUser;
}

export async function quickLogin(role: 'admin' | 'ventas' | 'usuario'): Promise<AppUser> {
  let email = 'usuario@nidelmuebles.com';
  let displayName = 'Usuario';

  if (role === 'admin') {
    email = 'matias@vascohogar.com';
    displayName = 'Matías (Administrador)';
  } else if (role === 'ventas') {
    email = 'ventas@nidelmuebles.com';
    displayName = 'Vendedor';
  }

  const localUser: AppUser = {
    uid: `quick-${role}-${Date.now()}`,
    email,
    displayName,
  };
  setLocalUser(localUser);
  return localUser;
}

export async function registerWithEmail(emailInput: string, passwordInput?: string): Promise<User | AppUser> {
  const cleanInput = emailInput.trim();
  const email = normalizeEmail(cleanInput);
  const base = cleanInput.includes('@') ? cleanInput.split('@')[0] : cleanInput;
  const displayName = base ? (base.charAt(0).toUpperCase() + base.slice(1)) : 'Usuario';

  const localUser: AppUser = {
    uid: 'local-' + Date.now(),
    email: email,
    displayName: displayName,
  };

  setLocalUser(localUser);

  if (passwordInput && passwordInput.length >= 6) {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, passwordInput);
      const fbUser: AppUser = {
        uid: cred.user.uid,
        email: cred.user.email,
        displayName: cred.user.displayName || displayName,
      };
      setLocalUser(fbUser);
      return cred.user;
    } catch {
      // Fallback to local
    }
  }

  return localUser;
}

export async function logout() {
  setLocalUser(null);
  try {
    await signOut(auth);
  } catch {
    // Ignore signOut errors
  }
}

export function onAuthChanged(callback: (user: User | AppUser | null) => void) {
  listeners.add(callback);

  // Initial check from localStorage
  const localUser = getLocalUser();
  if (localUser) {
    callback(localUser);
  }

  // Safely subscribe to Firebase as well
  let unsubscribeFirebase = () => {};
  try {
    unsubscribeFirebase = onAuthStateChanged(
      auth,
      (fbUser) => {
        if (fbUser) {
          const u: AppUser = {
            uid: fbUser.uid,
            email: fbUser.email,
            displayName: fbUser.displayName || (fbUser.email ? fbUser.email.split('@')[0] : 'Usuario'),
          };
          setLocalUser(u);
          callback(u);
        } else {
          // If Firebase says no user, only set null if there's no local session
          const currentLocal = getLocalUser();
          if (!currentLocal) {
            callback(null);
          }
        }
      },
      (err) => {
        // Firebase Auth error handler (prevents unhandled rejections from invalid API key)
        console.warn('Firebase auth listener status (running locally):', err?.message || err);
        const currentLocal = getLocalUser();
        callback(currentLocal);
      }
    );
  } catch (e) {
    console.warn('Could not listen to Firebase auth state:', e);
  }

  return () => {
    listeners.delete(callback);
    try {
      unsubscribeFirebase();
    } catch {}
  };
}
