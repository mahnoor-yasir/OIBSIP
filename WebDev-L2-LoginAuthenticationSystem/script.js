/* Secure Login - bundled application script (no modules, works from file://) */
'use strict';

// Utilities: hashing, validation, formatting
async function sha256(text) {
  const buf = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2,'0')).join('');
}

function otp6() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function validEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e); }
function validUser(u) { return /^[a-zA-Z0-9_]{3,20}$/.test(u); }

function pwdScore(p) {
  let s = 0;
  if (p.length >= 8) s++;
  if (/[A-Z]/.test(p)) s++;
  if (/[a-z]/.test(p)) s++;
  if (/[0-9]/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  if (p.length >= 12) s = Math.min(s+1, 5);
  return Math.min(s-1, 4); // 0..4
}
function pwdRules(p) {
  return {
    len: p.length >= 8,
    upper: /[A-Z]/.test(p),
    lower: /[a-z]/.test(p),
    num: /[0-9]/.test(p),
    spec: /[^A-Za-z0-9]/.test(p),
  };
}
function pwdValid(p) {
  const r = pwdRules(p);
  return r.len && r.upper && r.lower && r.num && r.spec;
}

function fmtDate(ts) {
  const d = new Date(ts);
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}
function fmtRel(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return Math.floor(s/60) + 'm ago';
  if (s < 86400) return Math.floor(s/3600) + 'h ago';
  if (s < 604800) return Math.floor(s/86400) + 'd ago';
  return new Date(ts).toLocaleDateString();
}
function initials(name='') {
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] || '') + (parts[1]?.[0] || '');
}
function detectDevice() {
  const ua = navigator.userAgent;
  let os = 'Unknown', browser = 'Unknown';
  if (/Windows/i.test(ua)) os = 'Windows';
  else if (/Mac/i.test(ua)) os = 'macOS';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/iPhone|iPad/i.test(ua)) os = 'iOS';
  else if (/Linux/i.test(ua)) os = 'Linux';
  if (/Edg\//i.test(ua)) browser = 'Edge';
  else if (/Chrome/i.test(ua)) browser = 'Chrome';
  else if (/Safari/i.test(ua)) browser = 'Safari';
  else if (/Firefox/i.test(ua)) browser = 'Firefox';
  return { os, browser, ua };
}
function mockLocation() {
  const locs = ['Karachi, PK','Bengaluru, IN','San Francisco, US','Berlin, DE','Tokyo, JP','London, UK','Dubai, AE','Sydney, AU'];
  return locs[Math.floor(Math.random()*locs.length)];
}
function mockIP() {
  return [10, Math.floor(Math.random()*254), Math.floor(Math.random()*254), Math.floor(Math.random()*254)].join('.');
}

function debounce(fn, ms=200) {
  let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}

function el(sel, root=document) { return root.querySelector(sel); }
function els(sel, root=document) { return [...root.querySelectorAll(sel)]; }

function toast(msg, type='info', duration=3500) {
  const wrap = document.getElementById('toasts');
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  const icons = {
    success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>',
    error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
    warn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  };
  t.innerHTML = `<div class="ic" style="width:32px;height:32px">${icons[type]||icons.info}</div><div>${msg}</div>`;
  wrap.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(120%)'; setTimeout(() => t.remove(), 300); }, duration);
}

// Storage layer - localStorage + sessionStorage
const DB_KEY = 'nexora_db_v1';
const SESSION_KEY = 'nexora_session_v1';

const defaultDB = () => ({ users: [], activity: [], notifications: [], mailbox: [] });

const DB = {
  load() {
    try { return JSON.parse(localStorage.getItem(DB_KEY)) || defaultDB(); }
    catch { return defaultDB(); }
  },
  save(db) { localStorage.setItem(DB_KEY, JSON.stringify(db)); },
  reset() { localStorage.removeItem(DB_KEY); },
};

const Session = {
  get() {
    try {
      return JSON.parse(sessionStorage.getItem(SESSION_KEY)) ||
             JSON.parse(localStorage.getItem(SESSION_KEY));
    } catch { return null; }
  },
  set(session, remember=false) {
    const str = JSON.stringify(session);
    sessionStorage.setItem(SESSION_KEY, str);
    if (remember) localStorage.setItem(SESSION_KEY, str);
    else localStorage.removeItem(SESSION_KEY);
  },
  clear() {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_KEY);
  },
};

function uid(prefix='usr') {
  return prefix + '_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

// Auth flows: register, login, otp, forgot

const OTP_TTL = 5 * 60 * 1000; // 5 min
const LOCK_ATTEMPTS = 5;
const LOCK_TIME = 5 * 60 * 1000;

function findUser({ email, username }) {
  const db = DB.load();
  return db.users.find(u =>
    (email && u.email.toLowerCase() === email.toLowerCase()) ||
    (username && u.username.toLowerCase() === username.toLowerCase())
  );
}

function findByIdentifier(id) {
  const db = DB.load();
  const s = id.toLowerCase();
  return db.users.find(u => u.email.toLowerCase() === s || u.username.toLowerCase() === s);
}

function isUsernameTaken(u) {
  return !!DB.load().users.find(x => x.username.toLowerCase() === u.toLowerCase());
}
function isEmailTaken(e) {
  return !!DB.load().users.find(x => x.email.toLowerCase() === e.toLowerCase());
}

async function registerUser(data) {
  if (!validUser(data.username)) throw new Error('Username must be 3-20 chars, letters/numbers/_');
  if (!validEmail(data.email)) throw new Error('Invalid email');
  if (!pwdValid(data.password)) throw new Error('Password does not meet requirements');
  if (isUsernameTaken(data.username)) throw new Error('Username already taken');
  if (isEmailTaken(data.email)) throw new Error('Email already registered');

  const db = DB.load();
  const hash = await sha256(data.password);
  const user = {
    id: uid('usr'),
    firstName: data.firstName,
    lastName: data.lastName,
    username: data.username,
    email: data.email,
    passwordHash: hash,
    passwordHistory: [hash],
    country: data.country || '',
    phone: data.phone || '',
    bio: '',
    company: '',
    role: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    avatar: null,
    createdAt: Date.now(),
    verified: false,
    lastLogin: null,
    passwordChangedAt: Date.now(),
    failedAttempts: 0,
    lockedUntil: 0,
    logins: [],
    settings: {
      theme: 'dark',
      language: 'en',
      notifications: true,
      emailAlerts: true,
      loginAlerts: true,
      twoFA: false,
      passkeys: false,
      sessionTimeout: 30,
      autoLogout: true,
      accent: 'indigo',
      animations: true,
    },
    accent: '#6366f1',
    otp: null,
  };
  // Generate first OTP
  user.otp = { code: otp6(), purpose: 'verify', expires: Date.now() + OTP_TTL };
  db.users.push(user);
  db.mailbox.unshift({
    id: uid('mail'),
    to: user.email,
    subject: 'Verify your Secure Login account',
    otp: user.otp.code,
    purpose: 'verify',
    userId: user.id,
    ts: Date.now(),
    expires: user.otp.expires,
  });
  db.activity.unshift({ id: uid('act'), userId: user.id, type: 'register', ts: Date.now(), meta: {} });
  DB.save(db);
  return user;
}

async function verifyOTP(userId, code, purpose='verify') {
  const db = DB.load();
  const user = db.users.find(u => u.id === userId);
  if (!user || !user.otp) throw new Error('No OTP found');
  if (user.otp.purpose !== purpose) throw new Error('OTP mismatch');
  if (Date.now() > user.otp.expires) throw new Error('OTP expired');
  if (String(code) !== String(user.otp.code)) throw new Error('Invalid OTP');
  if (purpose === 'verify') user.verified = true;
  user.otp = null;
  db.activity.unshift({ id: uid('act'), userId: user.id, type: purpose === 'verify' ? 'verified' : 'otp_ok', ts: Date.now(), meta: {} });
  DB.save(db);
  return user;
}

function resendOTP(userId, purpose='verify') {
  const db = DB.load();
  const user = db.users.find(u => u.id === userId);
  if (!user) throw new Error('User not found');
  user.otp = { code: otp6(), purpose, expires: Date.now() + OTP_TTL };
  db.mailbox.unshift({
    id: uid('mail'),
    to: user.email,
    subject: purpose === 'verify' ? 'Verify your Secure Login account' : 'Password reset code',
    otp: user.otp.code,
    purpose,
    userId: user.id,
    ts: Date.now(),
    expires: user.otp.expires,
  });
  DB.save(db);
  return user;
}

async function loginUser({ identifier, password, remember }) {
  const db = DB.load();
  const user = db.users.find(u =>
    u.email.toLowerCase() === identifier.toLowerCase() ||
    u.username.toLowerCase() === identifier.toLowerCase()
  );
  if (!user) throw new Error('Invalid credentials');
  if (user.lockedUntil && user.lockedUntil > Date.now()) {
    const mins = Math.ceil((user.lockedUntil - Date.now())/60000);
    throw new Error(`Account locked. Try again in ${mins} min`);
  }
  const hash = await sha256(password);
  if (hash !== user.passwordHash) {
    user.failedAttempts = (user.failedAttempts||0) + 1;
    if (user.failedAttempts >= LOCK_ATTEMPTS) {
      user.lockedUntil = Date.now() + LOCK_TIME;
      user.failedAttempts = 0;
      db.activity.unshift({ id: uid('act'), userId: user.id, type: 'locked', ts: Date.now(), meta: {} });
      DB.save(db);
      throw new Error('Too many failed attempts. Account locked for 5 minutes');
    }
    db.activity.unshift({ id: uid('act'), userId: user.id, type: 'login_fail', ts: Date.now(), meta: {} });
    DB.save(db);
    throw new Error('Invalid credentials');
  }
  if (!user.verified) {
    // Regenerate OTP for verification
    user.otp = { code: otp6(), purpose: 'verify', expires: Date.now() + OTP_TTL };
    db.mailbox.unshift({ id: uid('mail'), to: user.email, subject:'Verify your account', otp:user.otp.code, purpose:'verify', userId:user.id, ts:Date.now(), expires:user.otp.expires });
    DB.save(db);
    const e = new Error('Account not verified'); e.code = 'unverified'; e.userId = user.id; throw e;
  }
  user.failedAttempts = 0;
  user.lockedUntil = 0;
  user.lastLogin = Date.now();
  const dev = detectDevice();
  const loginRec = { ts: Date.now(), ip: mockIP(), location: mockLocation(), device: dev.browser + ' on ' + dev.os, status: 'success' };
  user.logins = [loginRec, ...(user.logins||[])].slice(0, 30);
  db.activity.unshift({ id: uid('act'), userId: user.id, type: 'login', ts: Date.now(), meta: loginRec });
  DB.save(db);
  const session = { userId: user.id, token: uid('tok'), createdAt: Date.now(), expiresAt: Date.now() + 24*60*60*1000 };
  Session.set(session, remember);
  return user;
}

function requestPasswordReset(identifier) {
  const db = DB.load();
  const user = db.users.find(u => u.email.toLowerCase() === identifier.toLowerCase() || u.username.toLowerCase() === identifier.toLowerCase());
  if (!user) throw new Error('No account found with that identifier');
  user.otp = { code: otp6(), purpose: 'reset', expires: Date.now() + OTP_TTL };
  db.mailbox.unshift({ id: uid('mail'), to: user.email, subject:'Reset your password', otp:user.otp.code, purpose:'reset', userId:user.id, ts:Date.now(), expires:user.otp.expires });
  db.activity.unshift({ id: uid('act'), userId: user.id, type: 'password_reset_requested', ts: Date.now(), meta: {} });
  DB.save(db);
  return user;
}

async function completePasswordReset(userId, newPassword) {
  if (!pwdValid(newPassword)) throw new Error('Password does not meet requirements');
  const db = DB.load();
  const user = db.users.find(u => u.id === userId);
  if (!user) throw new Error('User not found');
  const hash = await sha256(newPassword);
  if (user.passwordHistory?.includes(hash)) throw new Error('You cannot reuse a previous password');
  user.passwordHash = hash;
  user.passwordHistory = [hash, ...(user.passwordHistory||[])].slice(0, 5);
  user.passwordChangedAt = Date.now();
  user.otp = null;
  db.activity.unshift({ id: uid('act'), userId: user.id, type: 'password_changed', ts: Date.now(), meta: {} });
  DB.save(db);
  return user;
}

function logout() {
  const s = Session.get();
  if (s) {
    const db = DB.load();
    db.activity.unshift({ id: uid('act'), userId: s.userId, type: 'logout', ts: Date.now(), meta: {} });
    DB.save(db);
  }
  Session.clear();
}

function currentUser() {
  const s = Session.get();
  if (!s) return null;
  if (s.expiresAt && s.expiresAt < Date.now()) { Session.clear(); return null; }
  const db = DB.load();
  return db.users.find(u => u.id === s.userId) || null;
}

function updateUser(userId, patch) {
  const db = DB.load();
  const user = db.users.find(u => u.id === userId);
  if (!user) throw new Error('User not found');
  Object.assign(user, patch);
  DB.save(db);
  return user;
}

function deleteAccount(userId) {
  const db = DB.load();
  db.users = db.users.filter(u => u.id !== userId);
  db.activity = db.activity.filter(a => a.userId !== userId);
  db.mailbox = db.mailbox.filter(m => m.userId !== userId);
  DB.save(db);
  Session.clear();
}

// ---------- Social / OAuth sign-in (client-side provider simulation) ----------
const PROVIDERS = {
  google: { id: 'google', label: 'Google', suffix: 'gmail.com', accent: '#EA4335' },
  github: { id: 'github', label: 'GitHub', suffix: 'users.noreply.github.com', accent: '#f0f6fc' },
};

function socialAccounts(provider) {
  return DB.load().users.filter(u => (u.providers || []).includes(provider));
}

function usernameFromEmail(email) {
  let base = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '').slice(0, 18) || 'user';
  if (base.length < 3) base = base + 'usr';
  let name = base, n = 1;
  while (isUsernameTaken(name)) { name = base.slice(0, 16) + n; n++; }
  return name;
}

async function socialSignIn({ provider, email, name, remember }) {
  const p = PROVIDERS[provider];
  if (!p) throw new Error('Unsupported provider');
  if (!validEmail(email)) throw new Error('The provider did not return a valid email');
  const db = DB.load();
  let user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);

  if (!user) {
    const hash = await sha256(uid('oauth') + Math.random());
    user = {
      id: uid('usr'),
      firstName: parts[0] || p.label,
      lastName: parts.slice(1).join(' ') || 'User',
      username: usernameFromEmail(email),
      email,
      passwordHash: hash,
      passwordHistory: [hash],
      country: '', phone: '', bio: '', company: '', role: '',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      avatar: null,
      createdAt: Date.now(),
      verified: true,
      lastLogin: null,
      passwordChangedAt: Date.now(),
      failedAttempts: 0,
      lockedUntil: 0,
      logins: [],
      providers: [provider],
      passwordless: true,
      settings: {
        theme: 'dark', language: 'en', notifications: true, emailAlerts: true,
        loginAlerts: true, twoFA: false, passkeys: false, sessionTimeout: 30,
        autoLogout: true, accent: 'indigo', animations: true,
      },
      accent: '#6366f1',
      otp: null,
    };
    db.users.push(user);
    db.activity.unshift({ id: uid('act'), userId: user.id, type: 'register', ts: Date.now(), meta: { provider } });
    db.activity.unshift({ id: uid('act'), userId: user.id, type: 'social_linked', ts: Date.now(), meta: { provider } });
  } else {
    user.providers = Array.from(new Set([...(user.providers || []), provider]));
    if (!user.verified) user.verified = true;
    if (parts.length && !user.firstName) { user.firstName = parts[0]; user.lastName = parts.slice(1).join(' '); }
  }

  user.failedAttempts = 0;
  user.lockedUntil = 0;
  user.lastLogin = Date.now();
  const dev = detectDevice();
  const loginRec = {
    ts: Date.now(), ip: mockIP(), location: mockLocation(),
    device: dev.browser + ' on ' + dev.os, status: 'success', provider,
  };
  user.logins = [loginRec, ...(user.logins || [])].slice(0, 30);
  db.activity.unshift({ id: uid('act'), userId: user.id, type: 'social_login', ts: Date.now(), meta: loginRec });
  DB.save(db);

  Session.set({ userId: user.id, token: uid('tok'), provider, createdAt: Date.now(), expiresAt: Date.now() + 24 * 60 * 60 * 1000 }, remember);
  return user;
}

function unlinkProvider(userId, provider) {
  const db = DB.load();
  const user = db.users.find(u => u.id === userId);
  if (!user) throw new Error('User not found');
  user.providers = (user.providers || []).filter(p => p !== provider);
  db.activity.unshift({ id: uid('act'), userId, type: 'social_unlinked', ts: Date.now(), meta: { provider } });
  DB.save(db);
  return user;
}

// Dashboard rendering helpers

function securityScore(user) {
  let s = 40;
  if (user.verified) s += 15;
  if (user.settings?.twoFA) s += 15;
  if (user.settings?.passkeys) s += 10;
  if (user.settings?.loginAlerts) s += 5;
  const pAge = (Date.now() - (user.passwordChangedAt||user.createdAt)) / (1000*60*60*24);
  if (pAge < 90) s += 10; else if (pAge < 180) s += 5;
  if (user.avatar) s += 3;
  if (user.phone) s += 2;
  return Math.min(100, s);
}

function profileCompletion(user) {
  const fields = ['firstName','lastName','username','email','phone','country','bio','company','role','avatar'];
  const filled = fields.filter(f => !!user[f]).length;
  return Math.round((filled / fields.length) * 100);
}

function storagePct(user) {
  // Mock: base + activity count
  const db = DB.load();
  const acts = db.activity.filter(a => a.userId === user.id).length;
  return Math.min(95, 12 + acts * 2);
}

function passwordAgeDays(user) {
  return Math.floor((Date.now() - (user.passwordChangedAt||user.createdAt)) / (1000*60*60*24));
}

function userActivity(userId, limit=20) {
  const db = DB.load();
  return db.activity.filter(a => a.userId === userId).slice(0, limit);
}

function activityIcon(type) {
  const map = {
    login: 'log-in',
    logout: 'log-out',
    login_fail: 'alert',
    register: 'user-plus',
    verified: 'shield-check',
    password_changed: 'key',
    password_reset_requested: 'mail',
    locked: 'lock',
    profile_updated: 'edit',
    settings_updated: 'settings',
    social_login: 'log-in',
    social_linked: 'shield-check',
    social_unlinked: 'alert',
  };
  return map[type] || 'activity';
}

function activityLabel(type) {
  const map = {
    login: 'Signed in',
    logout: 'Signed out',
    login_fail: 'Failed sign-in attempt',
    register: 'Account created',
    verified: 'Email verified',
    password_changed: 'Password changed',
    password_reset_requested: 'Password reset requested',
    locked: 'Account locked (too many attempts)',
    profile_updated: 'Profile updated',
    settings_updated: 'Settings updated',
    social_login: 'Signed in with a connected provider',
    social_linked: 'Provider connected',
    social_unlinked: 'Provider disconnected',
  };
  return map[type] || type;
}



// ---------- module namespace shims (bundled build) ----------
const Auth = { PROVIDERS, findUser, findByIdentifier, isUsernameTaken, isEmailTaken, registerUser,
  verifyOTP, resendOTP, loginUser, requestPasswordReset, completePasswordReset, logout,
  currentUser, updateUser, deleteAccount, socialAccounts, socialSignIn, unlinkProvider };
const Dash = { securityScore, profileCompletion, storagePct, passwordAgeDays, userActivity,
  activityIcon, activityLabel, fmtDate, fmtRel, initials, detectDevice };

// Main app: routing, view rendering, event wiring

// ---------- Icons ----------
const I = {
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12 12 3l9 9"/><path d="M5 10v10h14V10"/></svg>',
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M7 15l4-4 4 4 5-6"/></svg>',
  activity: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>',
  bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>',
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>',
  moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
  sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>',
  key: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
  device: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
  mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 6-10 7L2 6"/></svg>',
  eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>',
  eyeOff: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-10-7-10-7a19 19 0 0 1 4-5.94"/><path d="M9.9 5.09A10.94 10.94 0 0 1 12 4c7 0 10 7 10 7a19 19 0 0 1-2.16 3.19"/><path d="M1 1l22 22"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
  logo: '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 4 6v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V6l-8-4z"/><path d="m9 12 2 2 4-4"/></svg>',
};

// ---------- State ----------
const STATE = {
  view: 'landing',
  pendingUserId: null,   // for OTP flow
  pendingRemember: false,
  pendingIntent: null,   // 'verify' | 'reset'
  activeTab: 'profile',
};

// ---------- Theme ----------
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('nexora_theme', theme);
}
function initTheme() {
  const user = Auth.currentUser();
  const theme = user?.settings?.theme || localStorage.getItem('nexora_theme') || 'dark';
  applyTheme(theme);
}

// ---------- Routing ----------
function go(view) {
  STATE.view = view;
  render();
  window.scrollTo(0,0);
}

// Guarded routes
const PROTECTED = new Set(['dashboard','profile','settings','analytics','activity','security']);

function boot() {
  const user = Auth.currentUser();
  if (user && ['landing','login','register'].includes(STATE.view)) STATE.view = 'dashboard';
  if (!user && PROTECTED.has(STATE.view)) STATE.view = 'login';
  render();
}

// ---------- Render ----------
const app = () => document.getElementById('app');

function render() {
  const user = Auth.currentUser();
  initTheme();
  if (PROTECTED.has(STATE.view) && !user) { STATE.view = 'login'; }
  switch (STATE.view) {
    case 'landing': return renderLanding();
    case 'login': return renderLogin();
    case 'register': return renderRegister();
    case 'otp': return renderOTP();
    case 'forgot': return renderForgot();
    case 'reset': return renderReset();
    case '404': return renderNotFound();
    case 'dashboard':
    case 'profile':
    case 'settings':
    case 'analytics':
    case 'activity':
    case 'security':
      return renderApp(user);
  }
}

// ---------- Landing ----------
function renderLanding() {
  app().innerHTML = `
    <div class="auth-shell">
      ${heroSide()}
      <div class="auth-panel">
        <div class="auth-card">
          <h1>Welcome to Secure Login</h1>
          <p class="sub">The enterprise identity platform trusted by teams that ship.</p>
          <div style="display:grid;gap:10px;margin-top:24px">
            <button class="btn btn-primary btn-block" data-nav="register">Create your account</button>
            <button class="btn btn-secondary btn-block" data-nav="login">Sign in</button>
          </div>
          <div class="divider">or</div>
          <div class="social-row">
            <button class="social-btn" data-social="google">
              <svg width="16" viewBox="0 0 24 24"><path fill="#EA4335" d="M12 10v4h5.7c-.3 1.5-1.7 4.3-5.7 4.3-3.4 0-6.2-2.8-6.2-6.3s2.8-6.3 6.2-6.3c2 0 3.3.9 4 1.6l2.7-2.6C16.9 3.1 14.7 2 12 2 6.9 2 2.7 6.2 2.7 11.3S6.9 20.6 12 20.6c6.9 0 9.5-4.9 9.5-9 0-.6-.1-1.1-.2-1.6H12z"/></svg>
              Google
            </button>
            <button class="social-btn" data-social="github">
              <svg width="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-2c-3.2.7-3.87-1.37-3.87-1.37-.52-1.32-1.28-1.67-1.28-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.72-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.18-3.08-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.62 1.59.23 2.76.11 3.05.74.8 1.18 1.82 1.18 3.08 0 4.41-2.69 5.39-5.25 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.68.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z"/></svg>
              GitHub
            </button>
          </div>
          <p class="auth-alt" style="margin-top:24px">Frontend-only demo. No data leaves your device.</p>
        </div>
      </div>
    </div>`;
  wireNav();
  wireSocial();
}

function heroSide(sub) {
  return `
    <div class="auth-hero">
      <div class="brand"><div class="brand-mark">${I.logo}</div>Secure Login</div>
      <div class="hero-content">
        <span class="hero-eyebrow"><span class="dot"></span> Trusted by 4,200+ teams</span>
        <h1 class="hero-title">Identity built for <span class="grad">modern enterprises</span></h1>
        <p class="hero-sub">${sub || 'Beautiful auth, powerful sessions, deep analytics, and passwordless-ready — all in one polished platform.'}</p>
        <div class="hero-feats">
          <div class="hero-feat"><div class="ic">${I.shield}</div><div><h4>SOC 2 grade security</h4><p>SHA-256 password hashing, session hardening, and rate limiting out of the box.</p></div></div>
          <div class="hero-feat"><div class="ic">${I.key}</div><div><h4>OTP & MFA ready</h4><p>Email verification, TOTP, and passkeys with drop-in configuration.</p></div></div>
          <div class="hero-feat"><div class="ic">${I.chart}</div><div><h4>Deep analytics</h4><p>Login patterns, device intelligence, and account health on every dashboard.</p></div></div>
        </div>
      </div>
      <div class="hero-foot">
        <span>© ${new Date().getFullYear()} Secure Login</span>
        <span>·</span>
        <span>SOC 2</span><span>·</span><span>GDPR</span><span>·</span><span>ISO 27001</span>
      </div>
    </div>`;
}

// ---------- Register ----------
function renderRegister() {
  app().innerHTML = `
    <div class="auth-shell">
      ${heroSide('Create your workspace in seconds. No credit card, no setup fees.')}
      <div class="auth-panel">
        <div class="auth-card">
          <h1>Create your account</h1>
          <p class="sub">Start your Secure Login workspace — free forever for solo builders.</p>
          <form id="reg-form" novalidate>
            <div class="form-row">
              <div class="form-group"><label class="label">First name</label><input class="input" name="firstName" required /></div>
              <div class="form-group"><label class="label">Last name</label><input class="input" name="lastName" required /></div>
            </div>
            <div class="form-group">
              <label class="label">Username</label>
              <div class="input-wrap"><input class="input" name="username" autocomplete="off" required /></div>
              <div class="hint" data-hint="username"></div>
            </div>
            <div class="form-group">
              <label class="label">Email</label>
              <input class="input" name="email" type="email" required />
              <div class="hint" data-hint="email"></div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="label">Country</label>
                <select class="select" name="country">
                  <option value="">Select…</option>
                  ${['Pakistan','India','United States','United Kingdom','Germany','Canada','Australia','UAE','Singapore','Japan','France','Spain','Brazil','Nigeria','South Africa'].map(c => `<option>${c}</option>`).join('')}
                </select>
              </div>
              <div class="form-group"><label class="label">Phone</label><input class="input" name="phone" placeholder="+1 555 123 4567" /></div>
            </div>
            <div class="form-group">
              <label class="label">Password</label>
              <div class="input-wrap">
                <input class="input" name="password" type="password" required />
                <button type="button" class="input-icon" data-toggle-pwd aria-label="Show password">${I.eye}</button>
              </div>
              <div class="pwd-meter"><div class="bar"></div><div class="bar"></div><div class="bar"></div><div class="bar"></div></div>
              <div class="pwd-rules">
                <span class="pwd-rule" data-rule="len">8+ chars</span>
                <span class="pwd-rule" data-rule="upper">Uppercase</span>
                <span class="pwd-rule" data-rule="lower">Lowercase</span>
                <span class="pwd-rule" data-rule="num">Number</span>
                <span class="pwd-rule" data-rule="spec">Special</span>
              </div>
            </div>
            <div class="form-group">
              <label class="label">Confirm password</label>
              <input class="input" name="confirm" type="password" required />
              <div class="hint" data-hint="confirm"></div>
            </div>
            <label class="checkbox"><input type="checkbox" name="terms" required /> I agree to the Terms and Privacy Policy</label>
            <button type="submit" class="btn btn-primary btn-block" style="margin-top:18px">Create account</button>
          </form>
          <p class="auth-alt">Already have an account? <a data-nav="login">Sign in</a></p>
        </div>
      </div>
    </div>`;
  wireNav();
  wireRegister();
}

function wireRegister() {
  const form = el('#reg-form');
  const u = form.username, e = form.email, p = form.password, c = form.confirm;
  u.addEventListener('input', debounce(() => {
    const v = u.value.trim();
    const h = form.querySelector('[data-hint="username"]');
    if (!v) { h.textContent=''; u.classList.remove('error','success'); return; }
    if (!validUser(v)) { h.textContent = '3-20 chars, letters/numbers/_'; h.className='hint error'; u.classList.add('error'); u.classList.remove('success'); return; }
    if (Auth.isUsernameTaken(v)) { h.textContent = 'Username already taken'; h.className='hint error'; u.classList.add('error'); u.classList.remove('success'); return; }
    h.textContent = 'Username available'; h.className='hint success'; u.classList.add('success'); u.classList.remove('error');
  }, 250));
  e.addEventListener('input', debounce(() => {
    const v = e.value.trim();
    const h = form.querySelector('[data-hint="email"]');
    if (!v) { h.textContent=''; e.classList.remove('error','success'); return; }
    if (!validEmail(v)) { h.textContent='Invalid email format'; h.className='hint error'; e.classList.add('error'); e.classList.remove('success'); return; }
    if (Auth.isEmailTaken(v)) { h.textContent='Email already registered'; h.className='hint error'; e.classList.add('error'); e.classList.remove('success'); return; }
    h.textContent='Looks good'; h.className='hint success'; e.classList.add('success'); e.classList.remove('error');
  }, 250));
  p.addEventListener('input', () => {
    const v = p.value;
    const s = pwdScore(v);
    const meter = form.querySelector('.pwd-meter');
    meter.className = 'pwd-meter s' + Math.max(1, s+1);
    const rules = pwdRules(v);
    Object.entries(rules).forEach(([k,ok]) => {
      const el = form.querySelector(`[data-rule="${k}"]`);
      el.classList.toggle('ok', ok);
    });
  });
  c.addEventListener('input', () => {
    const h = form.querySelector('[data-hint="confirm"]');
    if (!c.value) { h.textContent=''; c.classList.remove('error','success'); return; }
    if (c.value !== p.value) { h.textContent='Passwords do not match'; h.className='hint error'; c.classList.add('error'); c.classList.remove('success'); }
    else { h.textContent='Passwords match'; h.className='hint success'; c.classList.add('success'); c.classList.remove('error'); }
  });
  form.querySelectorAll('[data-toggle-pwd]').forEach(b => {
    b.addEventListener('click', () => {
      const input = b.previousElementSibling;
      input.type = input.type === 'password' ? 'text' : 'password';
      b.innerHTML = input.type === 'password' ? I.eye : I.eyeOff;
    });
  });
  form.addEventListener('submit', async ev => {
    ev.preventDefault();
    const btn = form.querySelector('button[type=submit]');
    const fd = new FormData(form);
    const data = Object.fromEntries(fd);
    if (data.password !== data.confirm) return toast('Passwords do not match','error');
    if (!data.terms) return toast('Please accept the terms', 'error');
    btn.classList.add('loading');
    try {
      const user = await Auth.registerUser(data);
      STATE.pendingUserId = user.id;
      STATE.pendingIntent = 'verify';
      toast('Account created. Check the Developer Mailbox for your OTP.', 'success');
      go('otp');
    } catch (e) { toast(e.message, 'error'); }
    finally { btn.classList.remove('loading'); }
  });
}

// ---------- Login ----------
function renderLogin() {
  app().innerHTML = `
    <div class="auth-shell">
      ${heroSide('Sign in to your workspace to access dashboards, team management, and settings.')}
      <div class="auth-panel">
        <div class="auth-card">
          <h1>Sign in</h1>
          <p class="sub">Welcome back. Use your email or username.</p>
          <form id="login-form" novalidate>
            <div class="form-group"><label class="label">Email or username</label><input class="input" name="identifier" required autocomplete="username" /></div>
            <div class="form-group">
              <label class="label">Password</label>
              <div class="input-wrap">
                <input class="input" name="password" type="password" required autocomplete="current-password" />
                <button type="button" class="input-icon" data-toggle-pwd aria-label="Show password">${I.eye}</button>
              </div>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
              <label class="checkbox"><input type="checkbox" name="remember" /> Remember me</label>
              <a class="btn-ghost" data-nav="forgot" style="font-size:13px;cursor:pointer">Forgot password?</a>
            </div>
            <button type="submit" class="btn btn-primary btn-block">Sign in</button>
          </form>
          <div class="divider">or continue with</div>
          <div class="social-row">
            <button class="social-btn" data-social="google">Google</button>
            <button class="social-btn" data-social="github">GitHub</button>
          </div>
          <p class="auth-alt">New to Secure Login? <a data-nav="register">Create an account</a></p>
        </div>
      </div>
    </div>`;
  wireNav();
  const form = el('#login-form');
  form.querySelectorAll('[data-toggle-pwd]').forEach(b => {
    b.addEventListener('click', () => {
      const input = b.previousElementSibling;
      input.type = input.type === 'password' ? 'text' : 'password';
      b.innerHTML = input.type === 'password' ? I.eye : I.eyeOff;
    });
  });
  wireSocial();
  form.addEventListener('submit', async ev => {
    ev.preventDefault();
    const btn = form.querySelector('button[type=submit]');
    const fd = Object.fromEntries(new FormData(form));
    btn.classList.add('loading');
    try {
      await Auth.loginUser({ identifier: fd.identifier, password: fd.password, remember: !!fd.remember });
      toast('Welcome back!', 'success');
      go('dashboard');
    } catch (e) {
      if (e.code === 'unverified') {
        STATE.pendingUserId = e.userId;
        STATE.pendingIntent = 'verify';
        STATE.pendingRemember = !!fd.remember;
        toast('Please verify your email first', 'warn');
        go('otp');
      } else {
        toast(e.message, 'error');
      }
    } finally { btn.classList.remove('loading'); }
  });
}

// ---------- OTP ----------
let otpTimerId = null;
function renderOTP() {
  const db = DB.load();
  const user = db.users.find(u => u.id === STATE.pendingUserId);
  if (!user) { go('login'); return; }
  const intent = STATE.pendingIntent || 'verify';
  const title = intent === 'verify' ? 'Verify your email' : 'Verify reset code';
  const sub = intent === 'verify' ? `We sent a 6-digit code to <strong>${user.email}</strong>. Open the Developer Mailbox below to view it.` : `A password reset code was sent to <strong>${user.email}</strong>.`;
  app().innerHTML = `
    <div class="auth-shell">
      ${heroSide('One-time codes keep accounts secure. Codes expire in 5 minutes.')}
      <div class="auth-panel">
        <div class="auth-card">
          <h1>${title}</h1>
          <p class="sub">${sub}</p>
          <div class="otp-timer">Code expires in <strong id="otp-count">5:00</strong></div>
          <div class="otp-inputs" id="otp-inputs">
            ${Array.from({length:6}).map((_,i) => `<input inputmode="numeric" maxlength="1" data-idx="${i}" aria-label="digit ${i+1}" />`).join('')}
          </div>
          <button id="otp-verify" class="btn btn-primary btn-block">Verify</button>
          <div style="display:flex;justify-content:space-between;margin-top:12px;font-size:13px">
            <button class="btn-ghost" id="otp-resend" style="cursor:pointer">Resend code</button>
            <button class="btn-ghost" data-nav="login" style="cursor:pointer">Back to sign in</button>
          </div>
          ${devMailbox(user)}
        </div>
      </div>
    </div>`;
  wireNav();
  wireOTP(user);
  startOtpTimer(user);
}

function devMailbox(user) {
  const db = DB.load();
  const inbox = db.mailbox.filter(m => m.userId === user.id).slice(0, 3);
  if (!inbox.length) return '';
  return `
    <div class="dev-mailbox">
      <div class="dev-mailbox-head">${I.mail}<span>Developer Mailbox</span><span class="badge">SIMULATED EMAIL</span></div>
      <div class="dev-mailbox-body">
        <div><strong>To:</strong> ${user.email}</div>
        <div><strong>Subject:</strong> ${inbox[0].subject}</div>
        <div style="margin-top:6px">Your one-time code:</div>
        <div class="otp-code">${inbox[0].otp}</div>
        <div style="font-size:11px;color:var(--text-dim)">Expires ${fmtRel(inbox[0].expires)}</div>
        <div class="dev-mailbox-actions">
          <button class="btn btn-secondary btn-sm" id="otp-copy">Copy</button>
          <button class="btn btn-secondary btn-sm" id="otp-paste">Paste into inputs</button>
        </div>
      </div>
    </div>`;
}

function startOtpTimer(user) {
  if (otpTimerId) clearInterval(otpTimerId);
  const countEl = el('#otp-count');
  const update = () => {
    if (!user.otp) return;
    const ms = user.otp.expires - Date.now();
    if (ms <= 0) { countEl.textContent = 'expired'; clearInterval(otpTimerId); return; }
    const m = Math.floor(ms/60000); const s = Math.floor((ms%60000)/1000);
    countEl.textContent = `${m}:${String(s).padStart(2,'0')}`;
  };
  update();
  otpTimerId = setInterval(update, 500);
}

function wireOTP(user) {
  const inputs = els('#otp-inputs input');
  inputs.forEach((inp, i) => {
    inp.addEventListener('input', () => {
      inp.value = inp.value.replace(/\D/g,'').slice(0,1);
      if (inp.value && i < 5) inputs[i+1].focus();
    });
    inp.addEventListener('keydown', e => {
      if (e.key === 'Backspace' && !inp.value && i > 0) inputs[i-1].focus();
      if (e.key === 'ArrowLeft' && i>0) inputs[i-1].focus();
      if (e.key === 'ArrowRight' && i<5) inputs[i+1].focus();
    });
    inp.addEventListener('paste', e => {
      const data = (e.clipboardData?.getData('text')||'').replace(/\D/g,'').slice(0,6);
      if (!data) return;
      e.preventDefault();
      data.split('').forEach((d,idx) => { if (inputs[idx]) inputs[idx].value = d; });
      inputs[Math.min(data.length,5)].focus();
    });
  });
  el('#otp-verify').addEventListener('click', async () => {
    const code = inputs.map(i => i.value).join('');
    if (code.length !== 6) return toast('Enter all 6 digits', 'error');
    const btn = el('#otp-verify');
    btn.classList.add('loading');
    try {
      const intent = STATE.pendingIntent || 'verify';
      const u = await Auth.verifyOTP(user.id, code, intent);
      if (intent === 'verify') {
        toast('Email verified! You can now sign in.', 'success');
        go('login');
      } else {
        toast('Code verified. Create a new password.', 'success');
        go('reset');
      }
    } catch (e) { toast(e.message, 'error'); }
    finally { btn.classList.remove('loading'); }
  });
  el('#otp-resend').addEventListener('click', () => {
    Auth.resendOTP(user.id, STATE.pendingIntent || 'verify');
    toast('A new code was sent to your Developer Mailbox', 'info');
    renderOTP();
  });
  const copy = el('#otp-copy'), paste = el('#otp-paste');
  if (copy) copy.addEventListener('click', () => {
    const db = DB.load();
    const u = db.users.find(x => x.id === user.id);
    navigator.clipboard.writeText(u.otp?.code || '').then(() => toast('Code copied', 'success'));
  });
  if (paste) paste.addEventListener('click', () => {
    const db = DB.load();
    const u = db.users.find(x => x.id === user.id);
    const code = u.otp?.code || '';
    code.split('').forEach((d,i) => inputs[i] && (inputs[i].value = d));
    inputs[5].focus();
  });
}

// ---------- Forgot / Reset ----------
function renderForgot() {
  app().innerHTML = `
    <div class="auth-shell">
      ${heroSide('Forgot your password? No problem — we\'ll send a secure reset code.')}
      <div class="auth-panel">
        <div class="auth-card">
          <h1>Forgot password</h1>
          <p class="sub">Enter your email or username and we'll send a reset code.</p>
          <form id="forgot-form">
            <div class="form-group"><label class="label">Email or username</label><input class="input" name="identifier" required /></div>
            <button class="btn btn-primary btn-block" type="submit">Send reset code</button>
          </form>
          <p class="auth-alt"><a data-nav="login">Back to sign in</a></p>
        </div>
      </div>
    </div>`;
  wireNav();
  el('#forgot-form').addEventListener('submit', ev => {
    ev.preventDefault();
    const id = new FormData(ev.target).get('identifier').trim();
    try {
      const user = Auth.requestPasswordReset(id);
      STATE.pendingUserId = user.id;
      STATE.pendingIntent = 'reset';
      toast('Reset code sent to Developer Mailbox', 'success');
      go('otp');
    } catch (e) { toast(e.message, 'error'); }
  });
}

function renderReset() {
  const user = DB.load().users.find(u => u.id === STATE.pendingUserId);
  if (!user) { go('forgot'); return; }
  app().innerHTML = `
    <div class="auth-shell">
      ${heroSide('Set a strong new password. It must meet the same rules as registration.')}
      <div class="auth-panel">
        <div class="auth-card">
          <h1>New password</h1>
          <p class="sub">Choose a strong new password for <strong>${user.email}</strong>.</p>
          <form id="reset-form">
            <div class="form-group">
              <label class="label">New password</label>
              <input class="input" name="password" type="password" required />
              <div class="pwd-meter"><div class="bar"></div><div class="bar"></div><div class="bar"></div><div class="bar"></div></div>
              <div class="pwd-rules">
                <span class="pwd-rule" data-rule="len">8+ chars</span>
                <span class="pwd-rule" data-rule="upper">Uppercase</span>
                <span class="pwd-rule" data-rule="lower">Lowercase</span>
                <span class="pwd-rule" data-rule="num">Number</span>
                <span class="pwd-rule" data-rule="spec">Special</span>
              </div>
            </div>
            <div class="form-group">
              <label class="label">Confirm password</label>
              <input class="input" name="confirm" type="password" required />
            </div>
            <button class="btn btn-primary btn-block" type="submit">Update password</button>
          </form>
        </div>
      </div>
    </div>`;
  wireNav();
  const form = el('#reset-form');
  form.password.addEventListener('input', () => {
    const s = pwdScore(form.password.value);
    form.querySelector('.pwd-meter').className = 'pwd-meter s' + Math.max(1, s+1);
    const rules = pwdRules(form.password.value);
    Object.entries(rules).forEach(([k,ok]) => form.querySelector(`[data-rule="${k}"]`).classList.toggle('ok', ok));
  });
  form.addEventListener('submit', async ev => {
    ev.preventDefault();
    const fd = Object.fromEntries(new FormData(form));
    if (fd.password !== fd.confirm) return toast('Passwords do not match', 'error');
    try {
      await Auth.completePasswordReset(user.id, fd.password);
      toast('Password updated. Please sign in.', 'success');
      go('login');
    } catch (e) { toast(e.message, 'error'); }
  });
}

// ---------- App shell ----------
function renderApp(user) {
  const initialsStr = initials(`${user.firstName} ${user.lastName}`) || user.username.slice(0,2);
  app().innerHTML = `
    <div class="app-shell">
      <aside class="sidebar" id="sidebar">
        <div class="brand"><div class="brand-mark">${I.logo}</div>Secure Login</div>
        <nav class="nav">
          <div class="nav-group">Workspace</div>
          <a class="nav-item ${STATE.view==='dashboard'?'active':''}" data-nav="dashboard"><span class="nav-icon">${I.home}</span>Dashboard</a>
          <a class="nav-item ${STATE.view==='analytics'?'active':''}" data-nav="analytics"><span class="nav-icon">${I.chart}</span>Analytics</a>
          <a class="nav-item ${STATE.view==='activity'?'active':''}" data-nav="activity"><span class="nav-icon">${I.activity}</span>Activity</a>
          <div class="nav-group">Account</div>
          <a class="nav-item ${STATE.view==='profile'?'active':''}" data-nav="profile"><span class="nav-icon">${I.user}</span>Profile</a>
          <a class="nav-item ${STATE.view==='security'?'active':''}" data-nav="security"><span class="nav-icon">${I.shield}</span>Security</a>
          <a class="nav-item ${STATE.view==='settings'?'active':''}" data-nav="settings"><span class="nav-icon">${I.settings}</span>Settings</a>
        </nav>
        <div class="sidebar-foot">
          <div class="user-mini" id="user-mini">
            <div class="avatar">${user.avatar ? `<img src="${user.avatar}"/>` : initialsStr.toUpperCase()}</div>
            <div class="user-mini-info"><div class="n">${user.firstName||user.username} ${user.lastName||''}</div><div class="e">${user.email}</div></div>
          </div>
        </div>
      </aside>
      <main class="main">
        <header class="topbar">
          <button class="icon-btn menu-btn" id="menu-btn" aria-label="Menu">${I.menu}</button>
          <div class="topbar-title">${topbarTitle(STATE.view)}</div>
          <div class="topbar-search">
            ${I.search}
            <input placeholder="Search or run a command…" id="topbar-search-input" />
            <span class="kbd">⌘K</span>
          </div>
          <div class="topbar-actions">
            <button class="icon-btn" id="theme-btn" aria-label="Toggle theme">${user.settings.theme==='dark'?I.sun:I.moon}</button>
            <button class="icon-btn" id="notif-btn" aria-label="Notifications">${I.bell}<span class="dot-notif"></span></button>
            <button class="icon-btn" id="logout-btn" aria-label="Sign out">${I.logout}</button>
          </div>
          <div class="notif-panel" id="notif-panel">
            <div class="notif-head"><h4>Notifications</h4><button class="btn-ghost btn-sm" id="mark-read">Mark all read</button></div>
            <div class="notif-list" id="notif-list"></div>
          </div>
        </header>
        <div class="content" id="content"></div>
      </main>
      <button class="fab" id="fab" aria-label="Command palette">${I.plus}</button>
    </div>`;
  wireShell(user);
  renderContent(user);
}

function topbarTitle(view) {
  return { dashboard:'Dashboard', analytics:'Analytics', activity:'Activity Log', profile:'Profile', security:'Security Center', settings:'Settings' }[view] || '';
}

function renderContent(user) {
  const c = el('#content');
  if (STATE.view === 'dashboard') c.innerHTML = renderDashboard(user);
  else if (STATE.view === 'analytics') c.innerHTML = renderAnalytics(user);
  else if (STATE.view === 'activity') c.innerHTML = renderActivity(user);
  else if (STATE.view === 'profile') { c.innerHTML = renderProfile(user); wireProfile(user); }
  else if (STATE.view === 'security') { c.innerHTML = renderSecurity(user); wireSecurity(user); }
  else if (STATE.view === 'settings') { c.innerHTML = renderSettings(user); wireSettings(user); }
}

function wireShell(user) {
  els('[data-nav]').forEach(a => a.addEventListener('click', () => go(a.dataset.nav)));
  el('#logout-btn').addEventListener('click', () => {
    Auth.logout(); toast('Signed out', 'info'); go('landing');
  });
  el('#menu-btn').addEventListener('click', () => el('#sidebar').classList.toggle('open'));
  el('#theme-btn').addEventListener('click', () => {
    const cur = document.documentElement.getAttribute('data-theme');
    const next = cur === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    Auth.updateUser(user.id, { settings: { ...user.settings, theme: next } });
    render();
  });
  const notifBtn = el('#notif-btn'), notifPanel = el('#notif-panel');
  notifBtn.addEventListener('click', e => { e.stopPropagation(); notifPanel.classList.toggle('active'); renderNotifs(user); });
  document.addEventListener('click', e => { if (!notifPanel.contains(e.target) && e.target !== notifBtn) notifPanel.classList.remove('active'); });
  el('#fab').addEventListener('click', () => openCmdk());
  el('#topbar-search-input').addEventListener('focus', () => openCmdk());
}

function renderNotifs(user) {
  const list = el('#notif-list');
  const acts = Dash.userActivity(user.id, 8);
  if (!acts.length) { list.innerHTML = '<div class="empty">No notifications yet</div>'; return; }
  list.innerHTML = acts.map(a => `
    <div class="notif-item"><div class="t">${Dash.activityLabel(a.type)}</div><div class="m">${fmtRel(a.ts)}</div></div>
  `).join('');
}

// ---------- Dashboard ----------
function renderDashboard(user) {
  const score = Dash.securityScore(user);
  const completion = Dash.profileCompletion(user);
  const storage = Dash.storagePct(user);
  const pAge = Dash.passwordAgeDays(user);
  const acts = Dash.userActivity(user.id, 6);
  const totalUsers = DB.load().users.length;
  const loginsWeek = user.logins?.filter(l => Date.now()-l.ts < 7*86400000).length || 0;
  return `
    <div class="page-head">
      <div>
        <h1>Welcome back, ${user.firstName || user.username} 👋</h1>
        <div class="greeting-sub">Here's what's happening in your workspace today.</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary" data-nav="settings">Settings</button>
        <button class="btn btn-primary" data-nav="profile">Edit profile</button>
      </div>
    </div>
    <div class="grid grid-4" style="margin-bottom:18px">
      ${statCard('Security score', score + '%', 'shield', score>=80?'success':(score>=60?'warn':'err'), score>=80?'Excellent':(score>=60?'Good':'Improve'))}
      ${statCard('Logins (7d)', loginsWeek, 'log', 'success', 'Active')}
      ${statCard('Devices', new Set((user.logins||[]).map(l=>l.device)).size || 1, 'device', 'info', 'Trusted')}
      ${statCard('Password age', pAge + 'd', 'key', pAge<90?'success':'warn', pAge<90?'Fresh':'Rotate soon')}
    </div>
    <div class="grid grid-3">
      <div class="card" style="grid-column:span 2">
        <div class="card-head"><h3>Security overview</h3><span class="muted">Live</span></div>
        <div class="gauge-wrap">
          <div class="gauge" style="--p:${score}"><div class="gauge-val">${score}<small>/100</small></div></div>
          <div style="flex:1">
            <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px"><span>Profile completion</span><span>${completion}%</span></div>
            <div class="progress"><span style="width:${completion}%"></span></div>
            <div style="display:flex;justify-content:space-between;font-size:13px;margin:14px 0 6px"><span>Storage used</span><span>${storage}%</span></div>
            <div class="progress"><span style="width:${storage}%"></span></div>
            <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap">
              <span class="badge badge-${user.verified?'success':'warn'}">${user.verified?'Verified':'Unverified'}</span>
              <span class="badge badge-${user.settings.twoFA?'success':'err'}">${user.settings.twoFA?'2FA On':'2FA Off'}</span>
              <span class="badge badge-info">${totalUsers} member${totalUsers>1?'s':''}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-head"><h3>Last login</h3></div>
        ${user.logins?.[0] ? `
          <div style="font-size:14px;font-weight:600">${fmtDate(user.logins[0].ts)}</div>
          <div style="color:var(--text-muted);font-size:13px;margin-top:4px">${user.logins[0].device}</div>
          <div style="color:var(--text-dim);font-size:12px;margin-top:2px">${user.logins[0].location} · ${user.logins[0].ip}</div>
          <div style="display:flex;gap:8px;margin-top:12px"><span class="badge badge-success">Success</span></div>
        ` : '<div class="empty">No login history</div>'}
      </div>
    </div>
    <div class="grid grid-2" style="margin-top:18px">
      <div class="card">
        <div class="card-head"><h3>Recent activity</h3><a class="muted" data-nav="activity" style="cursor:pointer">View all</a></div>
        <div class="activity-list">
          ${acts.length ? acts.map(actItem).join('') : '<div class="empty">No activity yet</div>'}
        </div>
      </div>
      <div class="card">
        <div class="card-head"><h3>Account checklist</h3></div>
        <div class="activity-list">
          ${checklistItem('Verify email', user.verified)}
          ${checklistItem('Complete profile', completion >= 80)}
          ${checklistItem('Enable two-factor auth', user.settings.twoFA)}
          ${checklistItem('Add a phone number', !!user.phone)}
          ${checklistItem('Upload avatar', !!user.avatar)}
          ${checklistItem('Enable login alerts', user.settings.loginAlerts)}
        </div>
      </div>
    </div>`;
}

function statCard(label, val, ic, badge, badgeTxt) {
  const icons = { shield: I.shield, log: I.activity, device: I.device, key: I.key };
  return `<div class="card stat-card">
    <div class="stat-top">
      <div class="stat-ic">${icons[ic]||I.shield}</div>
      <span class="stat-badge ${badge==='warn'?'warn':(badge==='err'?'err':'')}">${badgeTxt}</span>
    </div>
    <div class="stat-val">${val}</div>
    <div class="stat-label">${label}</div>
  </div>`;
}

function actItem(a) {
  return `<div class="activity-item">
    <div class="ic">${I.activity}</div>
    <div class="body">
      <div class="t">${Dash.activityLabel(a.type)}</div>
      <div class="s">${a.meta?.device || a.meta?.location || ''}</div>
    </div>
    <div class="time">${fmtRel(a.ts)}</div>
  </div>`;
}

function checklistItem(label, done) {
  return `<div class="activity-item">
    <div class="ic" style="color:${done?'var(--success)':'var(--text-dim)'}">${done?I.check:I.plus}</div>
    <div class="body"><div class="t">${label}</div></div>
    <span class="badge badge-${done?'success':'warn'}">${done?'Done':'Todo'}</span>
  </div>`;
}

// ---------- Analytics ----------
function renderAnalytics(user) {
  // Login frequency last 7 days
  const days = Array.from({length:7}).map((_,i) => {
    const d = new Date(); d.setDate(d.getDate() - (6-i)); d.setHours(0,0,0,0);
    return { ts: d.getTime(), label: d.toLocaleDateString(undefined,{weekday:'short'}) };
  });
  const counts = days.map(d => (user.logins||[]).filter(l => l.ts >= d.ts && l.ts < d.ts+86400000).length);
  const max = Math.max(1, ...counts);
  const devMap = {};
  (user.logins||[]).forEach(l => { devMap[l.device] = (devMap[l.device]||0)+1; });
  const devEntries = Object.entries(devMap);
  const totalD = devEntries.reduce((s,[,v])=>s+v,0) || 1;
  const heatCells = Array.from({length:168}).map(() => {
    const r = Math.random(); return `<div class="c ${r>0.85?'l4':r>0.7?'l3':r>0.5?'l2':r>0.35?'l1':''}"></div>`;
  }).join('');
  return `
    <div class="page-head"><div><h1>Analytics</h1><div class="greeting-sub">Login patterns, devices, and account health.</div></div></div>
    <div class="grid grid-3" style="margin-bottom:18px">
      ${statCard('Total sign-ins', user.logins?.length||0, 'log', 'success', 'All time')}
      ${statCard('Unique devices', Object.keys(devMap).length||1, 'device', 'info', 'Trusted')}
      ${statCard('Verification', user.verified?'Yes':'No', 'shield', user.verified?'success':'err', user.verified?'Verified':'Pending')}
    </div>
    <div class="grid grid-2">
      <div class="card">
        <div class="card-head"><h3>Sign-ins (last 7 days)</h3></div>
        <div class="chart">
          ${counts.map((c,i)=>`<div class="bar" style="height:${(c/max)*100}%" data-label="${days[i].label}" title="${c} logins"></div>`).join('')}
        </div>
      </div>
      <div class="card">
        <div class="card-head"><h3>Devices</h3></div>
        <div style="display:flex;align-items:center;gap:20px">
          <div class="donut" style="--p:${devEntries.length? Math.round((devEntries[0][1]/totalD)*100):0}"><div class="donut-val">${Object.keys(devMap).length||1}</div></div>
          <div style="flex:1">
            ${devEntries.length ? devEntries.map(([d,c])=>`
              <div style="display:flex;justify-content:space-between;font-size:13px;padding:6px 0"><span>${d}</span><span class="badge badge-info">${c}</span></div>
            `).join('') : '<div class="empty">No devices tracked</div>'}
          </div>
        </div>
      </div>
    </div>
    <div class="card" style="margin-top:18px">
      <div class="card-head"><h3>Activity heatmap</h3><span class="muted">Last 7 days × 24 hours</span></div>
      <div class="heat">${heatCells}</div>
    </div>`;
}

// ---------- Activity ----------
function renderActivity(user) {
  const acts = Dash.userActivity(user.id, 100);
  return `
    <div class="page-head"><div><h1>Activity log</h1><div class="greeting-sub">Every event tied to your account.</div></div>
      <div class="page-actions"><button class="btn btn-secondary" id="export-csv">Export CSV</button></div>
    </div>
    <div class="card">
      ${acts.length ? `
      <table class="tbl">
        <thead><tr><th>Event</th><th>Device</th><th>Location</th><th>IP</th><th>Time</th></tr></thead>
        <tbody>
          ${acts.map(a => `<tr>
            <td>${Dash.activityLabel(a.type)}</td>
            <td>${a.meta?.device||'—'}</td>
            <td>${a.meta?.location||'—'}</td>
            <td>${a.meta?.ip||'—'}</td>
            <td>${fmtDate(a.ts)}</td>
          </tr>`).join('')}
        </tbody>
      </table>` : '<div class="empty">No activity yet</div>'}
    </div>`;
}

// ---------- Profile ----------
function renderProfile(user) {
  const init = initials(`${user.firstName} ${user.lastName}`) || user.username.slice(0,2);
  return `
    <div class="page-head"><div><h1>Profile</h1><div class="greeting-sub">Manage your personal information.</div></div></div>
    <div class="card">
      <div class="avatar-upload">
        <div class="avatar avatar-lg" id="profile-avatar">${user.avatar?`<img src="${user.avatar}"/>`:init.toUpperCase()}</div>
        <div>
          <div style="font-size:16px;font-weight:600">${user.firstName||''} ${user.lastName||''}</div>
          <div style="color:var(--text-muted);font-size:13px;margin-bottom:10px">@${user.username}</div>
          <div class="actions">
            <label class="btn btn-secondary btn-sm"><input type="file" id="avatar-file" accept="image/*" style="display:none"/>Upload</label>
            <button class="btn btn-danger btn-sm" id="avatar-remove">Remove</button>
          </div>
        </div>
      </div>
      <form id="profile-form">
        <div class="form-row">
          <div class="form-group"><label class="label">First name</label><input class="input" name="firstName" value="${user.firstName||''}"/></div>
          <div class="form-group"><label class="label">Last name</label><input class="input" name="lastName" value="${user.lastName||''}"/></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label class="label">Username</label><input class="input" name="username" value="${user.username}"/></div>
          <div class="form-group"><label class="label">Phone</label><input class="input" name="phone" value="${user.phone||''}"/></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label class="label">Country</label><input class="input" name="country" value="${user.country||''}"/></div>
          <div class="form-group"><label class="label">Timezone</label><input class="input" name="timezone" value="${user.timezone||''}"/></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label class="label">Company</label><input class="input" name="company" value="${user.company||''}"/></div>
          <div class="form-group"><label class="label">Role</label><input class="input" name="role" value="${user.role||''}"/></div>
        </div>
        <div class="form-group"><label class="label">Bio</label><textarea class="input textarea" name="bio" rows="3">${user.bio||''}</textarea></div>
        <button class="btn btn-primary" type="submit">Save changes</button>
      </form>
    </div>`;
}
function wireProfile(user) {
  el('#avatar-file').addEventListener('change', ev => {
    const file = ev.target.files[0]; if (!file) return;
    if (file.size > 1500000) return toast('Image too large (max 1.5MB)', 'error');
    const reader = new FileReader();
    reader.onload = () => {
      Auth.updateUser(user.id, { avatar: reader.result });
      toast('Avatar updated', 'success'); render();
    };
    reader.readAsDataURL(file);
  });
  el('#avatar-remove').addEventListener('click', () => {
    Auth.updateUser(user.id, { avatar: null }); toast('Avatar removed', 'info'); render();
  });
  el('#profile-form').addEventListener('submit', ev => {
    ev.preventDefault();
    const fd = Object.fromEntries(new FormData(ev.target));
    if (fd.username !== user.username && Auth.isUsernameTaken(fd.username)) return toast('Username taken', 'error');
    Auth.updateUser(user.id, fd);
    const db = DB.load();
    db.activity.unshift({ id: 'act_'+Date.now(), userId: user.id, type: 'profile_updated', ts: Date.now(), meta:{} });
    DB.save(db);
    toast('Profile saved', 'success'); render();
  });
}

// ---------- Security ----------
function renderSecurity(user) {
  const score = Dash.securityScore(user);
  return `
    <div class="page-head"><div><h1>Security center</h1><div class="greeting-sub">Protect your account with modern controls.</div></div></div>
    <div class="grid grid-3" style="margin-bottom:18px">
      ${statCard('Security score', score+'%', 'shield', score>=80?'success':'warn', score>=80?'Excellent':'Improve')}
      ${statCard('Password age', Dash.passwordAgeDays(user)+'d', 'key', 'info', 'Rotate 90d')}
      ${statCard('2FA', user.settings.twoFA?'On':'Off', 'shield', user.settings.twoFA?'success':'err', user.settings.twoFA?'Active':'Inactive')}
    </div>
    <div class="card" style="margin-bottom:18px">
      <div class="card-head"><h3>Change password</h3></div>
      <form id="pwd-form">
        <div class="form-row">
          <div class="form-group"><label class="label">Current password</label><input class="input" type="password" name="current" required/></div>
          <div class="form-group"><label class="label">New password</label><input class="input" type="password" name="next" required/></div>
        </div>
        <div class="form-group"><label class="label">Confirm new password</label><input class="input" type="password" name="confirm" required/></div>
        <button class="btn btn-primary" type="submit">Update password</button>
      </form>
    </div>
    <div class="card">
      <div class="card-head"><h3>Recent sign-ins</h3></div>
      ${(user.logins||[]).length ? `
      <table class="tbl">
        <thead><tr><th>Device</th><th>Location</th><th>IP</th><th>Status</th><th>When</th></tr></thead>
        <tbody>
          ${(user.logins||[]).slice(0,10).map(l => `<tr>
            <td>${l.device}</td><td>${l.location}</td><td>${l.ip}</td>
            <td><span class="badge badge-${l.status==='success'?'success':'err'}">${l.status}</span></td>
            <td>${fmtRel(l.ts)}</td>
          </tr>`).join('')}
        </tbody>
      </table>` : '<div class="empty">No sign-ins yet</div>'}
    </div>`;
}
function wireSecurity(user) {
  el('#pwd-form').addEventListener('submit', async ev => {
    ev.preventDefault();
    const fd = Object.fromEntries(new FormData(ev.target));
    const { sha256 } = await import('./utils.js');
    const cur = await sha256(fd.current);
    if (cur !== user.passwordHash) return toast('Current password is incorrect', 'error');
    if (fd.next !== fd.confirm) return toast('Passwords do not match', 'error');
    if (!pwdValid(fd.next)) return toast('Password does not meet requirements', 'error');
    await Auth.completePasswordReset(user.id, fd.next);
    toast('Password updated', 'success'); render();
  });
}

// ---------- Settings ----------
function renderSettings(user) {
  const s = user.settings;
  return `
    <div class="page-head"><div><h1>Settings</h1><div class="greeting-sub">Personalize your workspace and preferences.</div></div></div>
    <div class="card">
      <div class="settings-row">
        <div class="info"><h4>Dark mode</h4><p>Use a darker color palette across the app.</p></div>
        <label class="switch"><input type="checkbox" data-set="theme" ${s.theme==='dark'?'checked':''}/><span class="slider"></span></label>
      </div>
      <div class="settings-row">
        <div class="info"><h4>Language</h4><p>Choose your preferred display language.</p></div>
        <select class="select" data-set="language" style="width:auto">
          ${['English','Spanish','French','German','Japanese','Urdu','Hindi','Arabic'].map((l,i)=>{
            const v=['en','es','fr','de','ja','ur','hi','ar'][i];
            return `<option value="${v}" ${s.language===v?'selected':''}>${l}</option>`;
          }).join('')}
        </select>
      </div>
      <div class="settings-row"><div class="info"><h4>In-app notifications</h4><p>Show toast and bell notifications.</p></div>
        <label class="switch"><input type="checkbox" data-set="notifications" ${s.notifications?'checked':''}/><span class="slider"></span></label></div>
      <div class="settings-row"><div class="info"><h4>Two-factor authentication</h4><p>Require an extra code when signing in.</p></div>
        <label class="switch"><input type="checkbox" data-set="twoFA" ${s.twoFA?'checked':''}/><span class="slider"></span></label></div>
      <div class="settings-row"><div class="info"><h4>Passkeys</h4><p>Enable passwordless sign-in with biometrics.</p></div>
        <label class="switch"><input type="checkbox" data-set="passkeys" ${s.passkeys?'checked':''}/><span class="slider"></span></label></div>
      <div class="settings-row"><div class="info"><h4>Email alerts</h4><p>Receive account-related email notifications.</p></div>
        <label class="switch"><input type="checkbox" data-set="emailAlerts" ${s.emailAlerts?'checked':''}/><span class="slider"></span></label></div>
      <div class="settings-row"><div class="info"><h4>Login alerts</h4><p>Get notified about new sign-ins on your account.</p></div>
        <label class="switch"><input type="checkbox" data-set="loginAlerts" ${s.loginAlerts?'checked':''}/><span class="slider"></span></label></div>
      <div class="settings-row"><div class="info"><h4>Auto logout</h4><p>Sign out automatically after a period of inactivity.</p></div>
        <label class="switch"><input type="checkbox" data-set="autoLogout" ${s.autoLogout?'checked':''}/><span class="slider"></span></label></div>
      <div class="settings-row">
        <div class="info"><h4>Session timeout</h4><p>Minutes of inactivity before signing you out.</p></div>
        <select class="select" data-set="sessionTimeout" style="width:auto">
          ${[15,30,60,120,240].map(v=>`<option value="${v}" ${s.sessionTimeout==v?'selected':''}>${v} min</option>`).join('')}
        </select>
      </div>
      <div class="settings-row"><div class="info"><h4>Accent color</h4><p>Pick your favorite accent for buttons and highlights.</p></div>
        <div style="display:flex;gap:8px">
          ${[['#6366f1','indigo'],['#a855f7','violet'],['#ec4899','pink'],['#10b981','emerald'],['#f59e0b','amber']].map(([c,n])=>`<button data-accent="${c}" title="${n}" style="width:24px;height:24px;border-radius:50%;background:${c};border:${user.accent===c?'2px solid var(--text)':'1px solid var(--border-strong)'}"></button>`).join('')}
        </div>
      </div>
    </div>
    <div class="card" style="margin-top:18px;border-color:rgba(239,68,68,0.3)">
      <div class="card-head"><h3 style="color:var(--error)">Danger zone</h3></div>
      <div class="settings-row">
        <div class="info"><h4>Delete account</h4><p>Permanently delete your account and all associated data. This cannot be undone.</p></div>
        <button class="btn btn-danger" id="del-acc">Delete account</button>
      </div>
    </div>`;
}
function wireSettings(user) {
  els('[data-set]').forEach(inp => {
    inp.addEventListener('change', () => {
      const key = inp.dataset.set;
      let val;
      if (inp.type === 'checkbox') val = inp.checked;
      else if (inp.tagName === 'SELECT') val = key === 'sessionTimeout' ? Number(inp.value) : inp.value;
      else val = inp.value;
      const settings = { ...user.settings, [key]: val };
      Auth.updateUser(user.id, { settings });
      if (key === 'theme') applyTheme(val ? 'dark' : 'light');
      const db = DB.load();
      db.activity.unshift({ id:'act_'+Date.now(), userId:user.id, type:'settings_updated', ts:Date.now(), meta:{key} });
      DB.save(db);
      toast('Settings saved', 'success');
      render();
    });
  });
  els('[data-accent]').forEach(b => b.addEventListener('click', () => {
    const c = b.dataset.accent;
    Auth.updateUser(user.id, { accent: c });
    document.documentElement.style.setProperty('--primary', c);
    toast('Accent updated', 'success'); render();
  }));
  el('#del-acc').addEventListener('click', () => {
    openModal({
      title: 'Delete account?',
      body: 'This will permanently delete your account and all data. This cannot be undone.',
      confirm: 'Delete forever',
      danger: true,
      onConfirm: () => {
        Auth.deleteAccount(user.id);
        toast('Account deleted', 'info');
        go('landing');
      },
    });
  });
}

// ---------- Modal / Cmdk ----------
function openModal({ title, body, confirm='Confirm', danger=false, onConfirm }) {
  const back = document.createElement('div');
  back.className = 'modal-back active';
  back.innerHTML = `<div class="modal">
    <h2>${title}</h2><p>${body}</p>
    <div class="modal-actions">
      <button class="btn btn-secondary" data-cancel>Cancel</button>
      <button class="btn ${danger?'btn-danger':'btn-primary'}" data-ok>${confirm}</button>
    </div>
  </div>`;
  document.body.appendChild(back);
  back.querySelector('[data-cancel]').onclick = () => back.remove();
  back.querySelector('[data-ok]').onclick = () => { back.remove(); onConfirm && onConfirm(); };
  back.addEventListener('click', e => { if (e.target === back) back.remove(); });
}

function openCmdk() {
  const commands = [
    { label: 'Go to Dashboard', k: 'G D', act: () => go('dashboard') },
    { label: 'Go to Analytics', k: 'G A', act: () => go('analytics') },
    { label: 'Go to Activity', k: 'G L', act: () => go('activity') },
    { label: 'Go to Profile', k: 'G P', act: () => go('profile') },
    { label: 'Go to Security', k: 'G S', act: () => go('security') },
    { label: 'Go to Settings', k: 'G ,', act: () => go('settings') },
    { label: 'Toggle theme', k: 'T', act: () => { const c=document.documentElement.getAttribute('data-theme'); applyTheme(c==='dark'?'light':'dark'); render(); } },
    { label: 'Sign out', k: '⌘ Q', act: () => { Auth.logout(); toast('Signed out','info'); go('landing'); } },
  ];
  const back = document.createElement('div');
  back.className = 'cmdk-back active';
  back.innerHTML = `<div class="cmdk">
    <input placeholder="Type a command…" autofocus/>
    <div class="cmdk-list"></div>
  </div>`;
  document.body.appendChild(back);
  const input = back.querySelector('input');
  const list = back.querySelector('.cmdk-list');
  const render = (q='') => {
    const items = commands.filter(c => c.label.toLowerCase().includes(q.toLowerCase()));
    list.innerHTML = items.length ? items.map((c,i)=>`<div class="cmdk-item ${i===0?'active':''}" data-i="${i}"><div class="ic">›</div><div>${c.label}</div><div class="k">${c.k}</div></div>`).join('') : '<div class="empty">No matches</div>';
    list.querySelectorAll('.cmdk-item').forEach(itm => itm.onclick = () => { back.remove(); items[Number(itm.dataset.i)].act(); });
    return items;
  };
  let items = render();
  input.addEventListener('input', () => { items = render(input.value); });
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && items[0]) { back.remove(); items[0].act(); }
    if (e.key === 'Escape') back.remove();
  });
  back.addEventListener('click', e => { if (e.target === back) back.remove(); });
}


// ---------- Social sign-in (Google / GitHub) ----------
function providerMark(id) {
  if (id === 'google') return '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="#EA4335" d="M12 10v4h5.7c-.3 1.5-1.7 4.3-5.7 4.3-3.4 0-6.2-2.8-6.2-6.3s2.8-6.3 6.2-6.3c2 0 3.3.9 4 1.6l2.7-2.6C16.9 3.1 14.7 2 12 2 6.9 2 2.7 6.2 2.7 11.3S6.9 20.6 12 20.6c6.9 0 9.5-4.9 9.5-9 0-.6-.1-1.1-.2-1.6H12z"/></svg>';
  return '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-2c-3.2.7-3.87-1.37-3.87-1.37-.52-1.32-1.28-1.67-1.28-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.72-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.18-3.08-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.62 1.59.23 2.76.11 3.05.74.8 1.18 1.82 1.18 3.08 0 4.41-2.69 5.39-5.25 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.68.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z"/></svg>';
}

function wireSocial() {
  els('[data-social]').forEach(b => b.addEventListener('click', ev => {
    ev.preventDefault();
    openOAuth(b.dataset.social);
  }));
}

function openOAuth(providerId) {
  const p = Auth.PROVIDERS[providerId];
  if (!p) return;
  const accounts = Auth.socialAccounts(providerId);
  const back = document.createElement('div');
  back.className = 'modal-back active';
  back.innerHTML = `
    <div class="modal oauth-modal" role="dialog" aria-modal="true" aria-label="Sign in with ${p.label}">
      <div class="oauth-head">
        <div class="oauth-mark">${providerMark(providerId)}</div>
        <div>
          <h2 style="margin:0">Sign in with ${p.label}</h2>
          <p style="margin:2px 0 0">to continue to <strong>Secure Login</strong></p>
        </div>
      </div>
      <div class="oauth-body">
        ${accounts.length ? `<div class="oauth-accounts">
          ${accounts.map(u => `<button class="oauth-account" data-acct="${u.email}" data-name="${u.firstName} ${u.lastName}">
            <span class="oauth-av">${initials(u.firstName + ' ' + u.lastName).toUpperCase()}</span>
            <span class="oauth-meta"><strong>${u.firstName} ${u.lastName}</strong><small>${u.email}</small></span>
          </button>`).join('')}
        </div>
        <div class="divider">or use another account</div>` : ''}
        <form id="oauth-form" novalidate>
          <div class="form-group">
            <label class="label">${p.label} email</label>
            <input class="input" name="email" type="email" placeholder="you@${p.suffix}" autocomplete="email" required />
          </div>
          <div class="form-group">
            <label class="label">Full name <span style="opacity:.6">(optional)</span></label>
            <input class="input" name="name" type="text" placeholder="Ada Lovelace" autocomplete="name" />
          </div>
          <label class="checkbox" style="margin-bottom:14px"><input type="checkbox" name="remember" checked /> Keep me signed in</label>
          <div class="oauth-scopes">
            <p>Secure Login will receive:</p>
            <ul><li>Your name and profile basics</li><li>Your ${p.label} email address</li></ul>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" data-cancel>Cancel</button>
            <button type="submit" class="btn btn-primary">Continue with ${p.label}</button>
          </div>
        </form>
      </div>
    </div>`;
  document.body.appendChild(back);

  const close = () => back.remove();
  back.addEventListener('click', e => { if (e.target === back) close(); });
  back.querySelector('[data-cancel]').addEventListener('click', close);
  const form = back.querySelector('#oauth-form');

  const finish = async (email, name, remember, btn) => {
    const label = btn ? btn.innerHTML : '';
    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Connecting…'; }
    try {
      await new Promise(r => setTimeout(r, 650));
      const user = await Auth.socialSignIn({ provider: providerId, email, name, remember });
      close();
      toast(`Signed in as ${user.email} via ${p.label}`, 'success');
      go('dashboard');
    } catch (err) {
      if (btn) { btn.disabled = false; btn.innerHTML = label; }
      toast(err.message || 'Sign-in failed', 'error');
    }
  };

  back.querySelectorAll('.oauth-account').forEach(b => b.addEventListener('click', () => {
    finish(b.dataset.acct, b.dataset.name, true, b);
  }));

  form.addEventListener('submit', ev => {
    ev.preventDefault();
    const fd = new FormData(form);
    const email = String(fd.get('email') || '').trim();
    if (!validEmail(email)) return toast('Enter the email address of your ' + p.label + ' account', 'error');
    finish(email, String(fd.get('name') || '').trim(), fd.get('remember') === 'on', form.querySelector('button[type=submit]'));
  });

  setTimeout(() => form.querySelector('input[name=email]')?.focus(), 60);
}

// ---------- Nav ----------
function wireNav() {
  els('[data-nav]').forEach(a => a.addEventListener('click', ev => {
    ev.preventDefault();
    go(a.dataset.nav);
  }));
}

// ---------- 404 ----------
function renderNotFound() {
  app().innerHTML = `<div class="notfound"><div><h1>404</h1><p>The page you're looking for doesn't exist.</p><button class="btn btn-primary" data-nav="landing">Back home</button></div></div>`;
  wireNav();
}

// ---------- Global keyboard ----------
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); if (Auth.currentUser()) openCmdk(); }
});

// ---------- Init ----------
window.addEventListener('DOMContentLoaded', boot);
window.__nexora = { DB, Auth, go };
