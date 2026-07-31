import {initializeApp} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc, updateDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const cfg = window.MITKADMIM_FIREBASE_CONFIG;
const authBox = document.getElementById('cloudAuth');
const status = document.getElementById('cloudAuthStatus');
const emailInput = document.getElementById('cloudEmail');
const passwordInput = document.getElementById('cloudPassword');

let auth;
let db;
let currentUser = null;
let currentProfileId = 'main';
let profiles = {};
let syncTimer = null;
let applyingRemote = false;
let lastSavedJson = '';

const bridge = () => window.MitkadmimCloudBridge;
const clone = value => JSON.parse(JSON.stringify(value));
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

function profileName(state, fallback = 'הפרופיל שלי') {
  return state?.profile?.firstName || state?.profile?.name || fallback;
}

function profileAvatar(state) {
  const avatar = state?.profile?.avatar;
  if (typeof avatar === 'string') return {type:'emoji', value:avatar};
  return avatar || {type:'emoji', value:'🦁'};
}

function profileRecord(state, existing = {}) {
  return {
    ...existing,
    name: profileName(state),
    avatar: profileAvatar(state),
    state: clone(state),
    updatedAtMs: Date.now()
  };
}

function updateSettingsAccount() {
  const email = document.getElementById('settingsAccountEmail');
  const active = document.getElementById('settingsActiveProfile');
  if (email) email.textContent = currentUser?.email || 'חשבון Google מחובר';
  if (active) active.textContent = profiles[currentProfileId]?.name || profileName(bridge()?.getState());
}

function renderProfiles() {
  const list = document.getElementById('profilesList');
  if (!list) return;
  const entries = Object.entries(profiles);
  list.innerHTML = entries.map(([id, item]) => {
    const avatar = item.avatar || profileAvatar(item.state);
    const avatarHtml = avatar?.type === 'image'
      ? `<img src="${avatar.value}" alt="">`
      : (avatar?.value || '🦁');
    const isActive = id === currentProfileId;
    return `<div class="profile-list-item ${isActive ? 'active' : ''}">
      <span class="profile-list-avatar">${avatarHtml}</span>
      <span class="profile-list-copy"><b>${item.name || profileName(item.state)}</b><small>${isActive ? 'הפרופיל הפעיל עכשיו' : 'התקדמות נפרדת'}</small></span>
      <span class="profile-list-actions">
        ${isActive ? '<button type="button" disabled>פעיל ✓</button>' : `<button class="profile-switch-btn" type="button" data-profile-switch="${id}">החלפה</button>`}
        ${entries.length > 1 ? `<button class="profile-delete-btn" type="button" data-profile-delete="${id}">מחיקה</button>` : ''}
      </span>
    </div>`;
  }).join('');
  list.querySelectorAll('[data-profile-switch]').forEach(button => {
    button.addEventListener('click', () => switchProfile(button.dataset.profileSwitch));
  });
  list.querySelectorAll('[data-profile-delete]').forEach(button => {
    button.addEventListener('click', () => deleteProfile(button.dataset.profileDelete));
  });
}

function openProfilesModal() {
  if (!currentUser) {
    setStatus('צריך להתחבר לחשבון כדי לנהל פרופילים');
    return;
  }
  renderProfiles();
  document.getElementById('profilesModal')?.classList.remove('hidden');
}

function closeProfilesModal() {
  document.getElementById('profilesModal')?.classList.add('hidden');
}

async function persistDocument(force = false) {
  if (!currentUser || applyingRemote || !bridge()) return;
  const state = bridge().getState();
  const serialized = JSON.stringify(state);
  if (!force && serialized === lastSavedJson) return;

  profiles[currentProfileId] = profileRecord(state, profiles[currentProfileId]);
  await setDoc(doc(db, 'users', currentUser.uid), {
    uid: currentUser.uid,
    email: currentUser.email || '',
    displayName: currentUser.displayName || '',
    photoURL: currentUser.photoURL || '',
    activeProfileId: currentProfileId,
    profiles,
    // שדות תאימות לחדר הבקרה ולגרסאות הישנות
    state,
    fitness: state.fitness || null,
    fitnessSavedAt: Number(state.fitness?.savedAt) || Date.now(),
    updatedAt: serverTimestamp(),
    lastSeenAt: serverTimestamp(),
    appVersion: '65-multi-profiles'
  }, {merge: true});

  lastSavedJson = serialized;
  updateSettingsAccount();
  renderProfiles();
  setStatus('הנתונים נשמרו בענן ✓', false);
}

function scheduleSync() {
  clearTimeout(syncTimer);
  setStatus('שומר...', false);
  syncTimer = setTimeout(() => {
    persistDocument().catch(error => {
      console.error('Cloud save failed', error);
      setStatus(humanError(error));
    });
  }, 450);
}

async function loadOrCreate(user) {
  const ref = doc(db, 'users', user.uid);
  const snapshot = await getDoc(ref);
  const data = snapshot.exists() ? snapshot.data() : {};

  if (data.profiles && Object.keys(data.profiles).length) {
    profiles = clone(data.profiles);
    currentProfileId = data.activeProfileId && profiles[data.activeProfileId]
      ? data.activeProfileId
      : Object.keys(profiles)[0];
  } else if (data.state) {
    // העברה אוטומטית של כל המשתמשים הקיימים למבנה רב-פרופילים בלי לאבד נתונים.
    currentProfileId = 'main';
    profiles = {main: profileRecord(data.state)};
  } else {
    currentProfileId = 'main';
    const localState = bridge()?.getState();
    const initial = localState?.profile
      ? localState
      : bridge()?.createProfileState({name:user.displayName || 'הפרופיל שלי', age:'child', domains:'both'});
    profiles = {main: profileRecord(initial)};
  }

  const selected = profiles[currentProfileId]?.state;
  bridge()?.activateCloudUser(user, currentProfileId);
  if (selected) {
    applyingRemote = true;
    bridge()?.applyState(clone(selected), {preferNewestFitness: true});
    applyingRemote = false;
  }
  lastSavedJson = JSON.stringify(bridge()?.getState() || {});
  await persistDocument(true);
  updateSettingsAccount();
  setStatus('הנתונים נטענו וסונכרנו ✓', false);
}

async function switchProfile(profileId) {
  if (!currentUser || !profiles[profileId] || profileId === currentProfileId) return;
  try {
    await persistDocument(true);
    currentProfileId = profileId;
    bridge()?.activateCloudUser(currentUser, currentProfileId);
    applyingRemote = true;
    bridge()?.applyState(clone(profiles[currentProfileId].state), {preferNewestFitness: false});
    applyingRemote = false;
    lastSavedJson = JSON.stringify(bridge()?.getState() || {});
    await persistDocument(true);
    closeProfilesModal();
    window.parent?.postMessage({type:'MITKADMIM_PROFILE_CHANGED'}, '*');
    setStatus(`עברנו לפרופיל ${profiles[currentProfileId].name} ✓`, false);
  } catch (error) {
    applyingRemote = false;
    console.error(error);
    setStatus('לא הצלחנו להחליף פרופיל כרגע');
  }
}

async function createProfile() {
  if (!currentUser || !bridge()) return;
  const nameInput = document.getElementById('newProfileName');
  const ageInput = document.getElementById('newProfileAge');
  const domainsInput = document.getElementById('newProfileDomains');
  const name = nameInput?.value.trim();
  if (!name) {
    setStatus('כתבו שם לפרופיל החדש');
    nameInput?.focus();
    return;
  }
  const id = 'profile-' + Date.now().toString(36);
  const fresh = bridge().createProfileState({name, age:ageInput?.value || 'child', domains:domainsInput?.value || 'both'});
  profiles[id] = profileRecord(fresh);
  await persistDocument(true);
  if (nameInput) nameInput.value = '';
  await switchProfile(id);
}

async function deleteProfile(profileId) {
  const ids = Object.keys(profiles);
  if (!currentUser || !profiles[profileId] || ids.length <= 1) return;
  const name = profiles[profileId].name || 'הפרופיל';
  if (!confirm(`למחוק את ${name}? כל ההתקדמות של הפרופיל הזה תימחק.`)) return;
  const wasActive = profileId === currentProfileId;
  delete profiles[profileId];
  if (wasActive) {
    currentProfileId = Object.keys(profiles)[0];
    bridge()?.activateCloudUser(currentUser, currentProfileId);
    applyingRemote = true;
    bridge()?.applyState(clone(profiles[currentProfileId].state), {preferNewestFitness:false});
    applyingRemote = false;
  }
  await persistDocument(true);
  await updateDoc(doc(db, 'users', currentUser.uid), {profiles, activeProfileId: currentProfileId, updatedAt: serverTimestamp()});
  renderProfiles();
  updateSettingsAccount();
  window.parent?.postMessage({type:'MITKADMIM_PROFILE_CHANGED'}, '*');
}

function showSignedIn() {
  authBox?.classList.add('hidden');
  updateSettingsAccount();
}

function showSignedOut() {
  authBox?.classList.remove('hidden');
  profiles = {};
  currentProfileId = 'main';
  updateSettingsAccount();
  setStatus('התחברו כדי שההתקדמות תישמר בכל מכשיר', false);
}

function bindProfileUi() {
  document.getElementById('manageProfilesBtn')?.addEventListener('click', openProfilesModal);
  document.getElementById('closeProfilesModal')?.addEventListener('click', closeProfilesModal);
  document.getElementById('profilesModal')?.addEventListener('click', event => {
    if (event.target?.id === 'profilesModal') closeProfilesModal();
  });
  document.getElementById('createProfileBtn')?.addEventListener('click', () => createProfile().catch(error => {
    console.error(error);
    setStatus('לא הצלחנו ליצור את הפרופיל');
  }));
  document.getElementById('settingsLogoutBtn')?.addEventListener('click', () => signOut(auth));
  document.getElementById('cloudLogout')?.addEventListener('click', () => signOut(auth));
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
  bindProfileUi();

  document.getElementById('cloudGoogle').onclick = async () => {
    try {
      setStatus('פותח התחברות...', false);
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (error) { setStatus(humanError(error)); }
  };
  document.getElementById('cloudLogin').onclick = async () => {
    try {
      setStatus('מתחבר...', false);
      await signInWithEmailAndPassword(auth, emailInput.value.trim(), passwordInput.value);
    } catch (error) { setStatus(humanError(error)); }
  };
  document.getElementById('cloudRegister').onclick = async () => {
    try {
      setStatus('יוצר חשבון...', false);
      await createUserWithEmailAndPassword(auth, emailInput.value.trim(), passwordInput.value);
    } catch (error) { setStatus(humanError(error)); }
  };

  window.addEventListener('mitkadmim:state-saved', scheduleSync);
  window.addEventListener('online', () => currentUser && persistDocument(true).catch(console.error));
  window.addEventListener('pagehide', () => currentUser && persistDocument(true).catch(() => {}));

  onAuthStateChanged(auth, async user => {
    currentUser = user;
    if (!user) {
      lastSavedJson = '';
      showSignedOut();
      return;
    }
    showSignedIn();
    try {
      await loadOrCreate(user);
    } catch (error) {
      console.error('Cloud load failed', error);
      applyingRemote = false;
      setStatus('החשבון מחובר, אבל Firestore לא הצליח לטעון או לשמור נתונים');
    }
  });
}

async function saveFitnessCloud() {
  if (!currentUser || !bridge()) return {ok:false, reason:'not-signed-in'};
  const state = bridge().getState();
  const fitness = clone(state.fitness || {});
  if (!fitness.configured) return {ok:false, reason:'not-configured'};
  fitness.savedAt = Number(fitness.savedAt) || Date.now();
  state.fitness = fitness;
  profiles[currentProfileId] = profileRecord(state, profiles[currentProfileId]);
  await persistDocument(true);
  return {ok:true};
}

window.MitkadmimCloud = {
  isSignedIn: () => !!currentUser,
  saveFitnessNow: saveFitnessCloud,
  saveNow: async () => {
    if (!currentUser) return {ok:false, reason:'not-signed-in'};
    try {
      clearTimeout(syncTimer);
      await persistDocument(true);
      return {ok:true};
    } catch (error) {
      console.error('Immediate cloud save failed', error);
      setStatus(humanError(error));
      return {ok:false, error};
    }
  },
  openProfiles: openProfilesModal,
  getActiveProfileId: () => currentProfileId
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
