const messages = {
  "auth/invalid-credential": "האימייל או הסיסמה אינם נכונים.",
  "auth/user-not-found": "לא נמצא משתמש עם כתובת האימייל הזו.",
  "auth/wrong-password": "הסיסמה אינה נכונה.",
  "auth/email-already-in-use": "כבר קיים חשבון עם כתובת האימייל הזו.",
  "auth/weak-password": "הסיסמה צריכה להכיל לפחות 6 תווים.",
  "auth/invalid-email": "כתובת האימייל אינה תקינה.",
  "auth/popup-closed-by-user": "חלון ההתחברות נסגר לפני סיום הפעולה.",
  "auth/popup-blocked": "הדפדפן חסם את חלון ההתחברות.",
  "auth/too-many-requests": "בוצעו יותר מדי ניסיונות. נסה שוב מאוחר יותר.",
  "auth/network-request-failed": "בדוק את החיבור לאינטרנט ונסה שוב.",
};

export function getFriendlyAuthError(error) {
  console.error(error);
  return messages[error?.code] || "לא הצלחנו להשלים את הפעולה. נסה שוב.";
}
