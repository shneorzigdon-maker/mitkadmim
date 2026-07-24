מתקדמים v61 – אפליקציה + חדר בקרה

העלאה ל-GitHub:
1. העלו את כל הקבצים והתיקיות מתוך ZIP זה ישירות לשורש המאגר.
2. אין להעלות את קובץ ה-ZIP עצמו.
3. חדר הבקרה יהיה בכתובת:
   https://shneorzigdon-maker.github.io/mitkadmim/control-room/

הפעלת הרשאת מנהל חד-פעמית:
1. היכנסו לחדר הבקרה עם חשבון Google שלכם. תופיע הודעה ובה UID.
2. ב-Firebase Console פתחו Firestore Database.
3. צרו Collection בשם admins.
4. צרו Document שה-ID שלו הוא ה-UID שהופיע בהודעה.
5. הוסיפו שדה enabled מסוג Boolean והגדירו true.
6. החליפו את Firestore Rules בתוכן הקובץ firestore.rules ולחצו Publish.
7. היכנסו שוב לחדר הבקרה.

הגרסה מכילה רק:
- קבצי האפליקציה הפעילים
- assets שנדרשים למסכים
- תיקיית control-room
- כללי Firestore
- קובץ הנחיות זה

הערה: מחיקה ואיפוס משתמשים לא הופעלו בגרסה זו כדי למנוע מחיקה בטעות. חדר הבקרה כולל נתונים, חיפוש, סינון, פרטי משתמש וייצוא CSV.
