import {initializeApp} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const cfg = window.MITKADMIM_FIREBASE_CONFIG;
const authBox = document.getElementById('cloudAuth');
const status = document.getElementById('cloudAuthStatus');
const chip = document.getElementById('cloudUserChip');
const chipText = document.getElementById('cloudUserText');
const emailInput = document.getElementById('cloudEmail');
const passwordInput = document.getElementById('cloudPassword');

let auth;
let db;
let currentUser = null;
let syncTimer = null;
let applyingRemote = false;
let lastSavedJson = '';

const bridge = () => window.MitkadmimCloudBridge;
const setStatus = (text, bad = true) => {
  if (!status) return;
  status.textContent = text || '';
  status.style.color = bad ? '#b23b3b' : '#16805f';
};

function humanError(error) {
  const code = error?.code || '';
  if (code.includes('invalid-credential')) return 'האימייל או הסיסמה אינם נכונים';
  if (code.includes('email-already-in-use')) return 'האימייל כבר רשום. אפשר להיכנס במקום להירשם';
  if (code.includes('weak-password')) return 'הסיסמה צריכה לכלול לפחות 6 תווים';
  if (code.includes('popup-closed')) return 'חלון ההתחברות נסגר לפני השלמת הכניסה';
  if (code.includes('unauthorized-domain')) return 'כתובת האתר עדיין אינה מורשית ב-Firebase';
  if (code.includes('permission-denied')) return 'כללי Firestore חוסמים את השמירה';
  return 'לא הצלחנו להתחבר כרגע. בדקו את החיבור ונסו שוב';
}

async function saveCloud(force = false) {
  if (!currentUser || applyingRemote || !bridge()) return;
  const state = bridge().getState();
  const serialized = JSON.stringify(state);
  if (!force && serialized === lastSavedJson) return;

  await setDoc(doc(db, 'users', currentUser.uid), {
    uid: currentUser.uid,
    email: currentUser.email || '',
    displayName: currentUser.displayName || state.profile?.name || '',
    photoURL: currentUser.photoURL || '',
    state,
    updatedAt: serverTimestamp(),
    lastSeenAt: serverTimestamp(),
    appVersion: '60.2-fitness-stable'
  }, {merge: true});

  lastSavedJson = serialized;
  setStatus('הנתונים נשמרו בענן ✓', false);
}

function scheduleSync() {
  clearTimeout(syncTimer);
  setStatus('שומר...', false);
  syncTimer = setTimeout(() => {
    saveCloud().catch(error => {
      console.error('Cloud save failed', error);
      setStatus(humanError(error));
    });
  }, 450);
}

async function loadOrCreate(user) {
  bridge()?.activateCloudUser(user);
  const ref = doc(db, 'users', user.uid);
  const snapshot = await getDoc(ref);

  if (snapshot.exists() && snapshot.data().state) {
    // ממזגים בזהירות כדי שטעינה איטית מהענן לא תדרוס מסלול כושר שנשמר זה עתה.
    applyingRemote = true;
    bridge()?.applyState(snapshot.data().state, {preferNewestFitness: true});
    applyingRemote = false;
    lastSavedJson = JSON.stringify(bridge()?.getState() || {});
    await saveCloud(true); // שומר חזרה את התוצאה הממוזגת ואת זמן הכניסה.
    setStatus('הנתונים נטענו וסונכרנו ✓', false);
  } else {
    await saveCloud(true);
  }
}

function showSignedIn(user) {
  authBox?.classList.add('hidden');
  chip?.classList.add('show');
  if (chipText) chipText.textContent = user.displayName || user.email || 'מחובר לענן';
}

function showSignedOut() {
  chip?.classList.remove('show');
  authBox?.classList.remove('hidden');
  setStatus('התחברו כדי שההתקדמות תישמר בכל מכשיר', false);
}

async function boot() {
  if (!cfg?.projectId) {
    authBox?.classList.remove('hidden');
    setStatus('חסרים פרטי Firebase');
    return;
  }

  const app = initializeApp(cfg);
  auth = getAuth(app);
  db = getFirestore(app);

  document.getElementById('cloudGoogle').onclick = async () => {
    try {
      setStatus('פותח התחברות...', false);
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (error) {
      setStatus(humanError(error));
    }
  };

  document.getElementById('cloudLogin').onclick = async () => {
    try {
      setStatus('מתחבר...', false);
      await signInWithEmailAndPassword(auth, emailInput.value.trim(), passwordInput.value);
    } catch (error) {
      setStatus(humanError(error));
    }
  };

  document.getElementById('cloudRegister').onclick = async () => {
    try {
      setStatus('יוצר חשבון...', false);
      await createUserWithEmailAndPassword(auth, emailInput.value.trim(), passwordInput.value);
    } catch (error) {
      setStatus(humanError(error));
    }
  };

  document.getElementById('cloudLogout').onclick = () => signOut(auth);
  window.addEventListener('mitkadmim:state-saved', scheduleSync);
  window.addEventListener('online', () => currentUser && saveCloud(true).catch(console.error));
  window.addEventListener('pagehide', () => currentUser && saveCloud(true).catch(() => {}));

  onAuthStateChanged(auth, async user => {
    currentUser = user;
    if (!user) {
      lastSavedJson = '';
      showSignedOut();
      return;
    }
    showSignedIn(user);
    try {
      await loadOrCreate(user);
    } catch (error) {
      console.error('Cloud load failed', error);
      applyingRemote = false;
      setStatus('החשבון מחובר, אבל Firestore לא הצליח לטעון או לשמור נתונים');
    }
  });
}


// ממשק מפורש למסכים שצריכים להמתין עד שהשמירה בענן הסתיימה.
window.MitkadmimCloud = {
  isSignedIn: () => !!currentUser,
  saveNow: async () => {
    if (!currentUser) return {ok:false, reason:'not-signed-in'};
    try {
      clearTimeout(syncTimer);
      await saveCloud(true);
      return {ok:true};
    } catch (error) {
      console.error('Immediate cloud save failed', error);
      setStatus(humanError(error));
      return {ok:false, error};
    }
  }
};

if (location.protocol === 'file:') {
  authBox?.classList.remove('hidden');
  setStatus('כדי להתחבר ולשמור בענן, פתחו את האפליקציה דרך GitHub Pages ולא דרך file:///');
  ['cloudGoogle', 'cloudLogin', 'cloudRegister'].forEach(id => {
    const button = document.getElementById(id);
    if (button) button.disabled = true;
  });
} else {
  boot();
}
