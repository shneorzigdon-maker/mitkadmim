import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  runTransaction,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "../firebase/firebase.js";

export const ADMIN_EMAIL = "shneorzigdon@gmail.com";

const DEFAULT_PROFILE = {
  xp: 0,
  coins: 0,
  streak: 0,
  level: 1,
  completedLessons: 0,
  completedWorkouts: 0,
  completedGames: 0,
  englishProgress: 0,
  mathProgress: 0,
  languageProgress: 0,
  fitnessProgress: 0,
  ownedRewards: [],
  selectedLearningTracks: [],
  fitnessProfile: null,
  startDomain: null,
};

export async function syncUserProfile(user, extra = {}) {
  if (!user?.uid) return;

  const ref = doc(db, "users", user.uid);
  const snapshot = await getDoc(ref);

  const shared = {
    uid: user.uid,
    email: user.email ?? "",
    displayName: user.displayName ?? extra.displayName ?? "",
    photoURL: user.photoURL ?? "",
    providerIds: user.providerData.map((provider) => provider.providerId),
    lastLoginAt: serverTimestamp(),
  };

  if (!snapshot.exists()) {
    await setDoc(ref, {
      ...DEFAULT_PROFILE,
      ...shared,
      createdAt: serverTimestamp(),
      role: user.email === ADMIN_EMAIL ? "admin" : "user",
      ...extra,
    }, { merge: true });
  } else {
    await setDoc(ref, {
      ...shared,
      ...(user.email === ADMIN_EMAIL ? { role: "admin" } : {}),
      ...extra,
    }, { merge: true });
  }
}

export async function loadUserProfile(uid) {
  const ref = doc(db, "users", uid);
  const snapshot = await getDoc(ref);

  if (!snapshot.exists()) {
    await setDoc(ref, DEFAULT_PROFILE, { merge: true });
    return { ...DEFAULT_PROFILE };
  }

  return { ...DEFAULT_PROFILE, ...snapshot.data() };
}

export async function saveUserProfile(uid, values) {
  await setDoc(doc(db, "users", uid), {
    ...values,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}


export async function saveStartDomain(uid, startDomain) {
  await saveUserProfile(uid, { startDomain });
}

export async function saveFitnessProfile(uid, fitnessProfile) {
  await saveUserProfile(uid, { fitnessProfile });
}

export async function saveLearningTracks(uid, selectedLearningTracks) {
  await saveUserProfile(uid, { selectedLearningTracks });
}

export async function addProgress(uid, {
  xp = 0,
  coins = 0,
  completedLessons = 0,
  completedWorkouts = 0,
  completedGames = 0,
  englishProgress = 0,
  mathProgress = 0,
  languageProgress = 0,
  fitnessProgress = 0,
}) {
  await setDoc(doc(db, "users", uid), {
    xp: increment(xp),
    coins: increment(coins),
    completedLessons: increment(completedLessons),
    completedWorkouts: increment(completedWorkouts),
    completedGames: increment(completedGames),
    englishProgress: increment(englishProgress),
    mathProgress: increment(mathProgress),
    languageProgress: increment(languageProgress),
    fitnessProgress: increment(fitnessProgress),
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function buyReward(uid, reward) {
  const ref = doc(db, "users", uid);

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(ref);
    const data = snapshot.exists() ? snapshot.data() : {};
    const coins = Number(data.coins || 0);
    const owned = Array.isArray(data.ownedRewards) ? data.ownedRewards : [];

    if (owned.includes(reward.id)) throw new Error("already-owned");
    if (coins < reward.price) throw new Error("not-enough-coins");

    transaction.set(ref, {
      coins: coins - reward.price,
      ownedRewards: arrayUnion(reward.id),
      updatedAt: serverTimestamp(),
    }, { merge: true });
  });
}

export async function listUsersForAdmin(currentEmail) {
  if (currentEmail !== ADMIN_EMAIL) throw new Error("not-admin");

  const snapshot = await getDocs(collection(db, "users"));
  return snapshot.docs
    .map((item) => ({ id: item.id, ...DEFAULT_PROFILE, ...item.data() }))
    .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
}
