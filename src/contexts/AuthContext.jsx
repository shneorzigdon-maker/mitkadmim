import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";
import { auth, googleProvider } from "../firebase/firebase.js";
import { syncUserProfile } from "../services/userService.js";

const AuthContext = createContext(null);

async function safeSync(user, extra = {}) {
  try {
    await syncUserProfile(user, extra);
  } catch (error) {
    console.error("Profile sync failed:", error);
  }
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) await safeSync(user);
      setAuthLoading(false);
    });
  }, []);

  async function loginWithEmail(email, password) {
    const result = await signInWithEmailAndPassword(auth, email.trim(), password);
    await safeSync(result.user);
    return result.user;
  }

  async function registerWithEmail({ name, email, password }) {
    const result = await createUserWithEmailAndPassword(auth, email.trim(), password);

    if (name.trim()) {
      await updateProfile(result.user, { displayName: name.trim() });
      await result.user.reload();
    }

    await safeSync(auth.currentUser, { displayName: name.trim() });
    setCurrentUser(auth.currentUser);
    return auth.currentUser;
  }

  async function loginWithGoogle() {
    const result = await signInWithPopup(auth, googleProvider);
    await safeSync(result.user);
    return result.user;
  }

  const value = useMemo(() => ({
    currentUser,
    authLoading,
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    resetPassword: (email) => sendPasswordResetEmail(auth, email.trim()),
    logout: () => signOut(auth),
  }), [currentUser, authLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
