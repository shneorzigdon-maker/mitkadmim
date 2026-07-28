# מתקדמים v63 – בסיס מודרני

זו גרסת היסוד של המעבר ל־React + Vite + TypeScript.

## מה נשמר
- אותו פרויקט Firebase: `mitkadmim-12c54`.
- אותם משתמשים, UID ונתוני Firestore.
- אותה התחברות Google/אימייל.
- האפליקציה הקיימת ממשיכה לפעול דרך `public/legacy.html` בזמן שהמסכים מועברים בהדרגה לרכיבי React.
- חדר הבקרה נשמר ב־`public/control-room/` ובכתובת `/mitkadmim/control-room/`.
- כל התמונות והתרגילים נשמרו.

## למה האפליקציה הישנה נמצאת בתוך מעטפת React
זהו מעבר הדרגתי ובטוח: קודם משנים את התשתית בלי לסכן משתמשים ונתונים. בהמשך כל מסך יועבר מרכיב־מרכיב מ־`legacy.html` ל־`src/`.

## העלאה ל־GitHub
1. העלו את כל תוכן התיקייה לשורש המאגר `mitkadmim`.
2. ב־GitHub: Settings → Pages → Source ובחרו **GitHub Actions**.
3. כל Push לענף `main` יבנה ויפרסם אוטומטית את האתר.
4. אין צורך לשנות Firebase או Firestore Rules בשלב זה.

## פיתוח מקומי
```bash
npm install
npm run dev
```

## בנייה
```bash
npm run build
```
