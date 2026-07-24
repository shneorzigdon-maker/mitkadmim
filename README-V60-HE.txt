מתקדמים v60 – הוראות קצרות
==============================

1. העלאה ל-GitHub Pages:
   העלו את התוכן שבתיקייה mitkadmim-v50-final-entry-design/c1 לשורש המאגר.
   העלו את התיקייה mitkadmim-control-room בשם admin.

2. Firebase Authentication:
   Email/Password ו-Google צריכים להיות מופעלים.
   Authentication > Settings > Authorized domains: ודאו שהדומיין shneorzigdon-maker.github.io קיים.

3. Firestore:
   צרו Firestore Database במצב Production.
   העתיקו את תוכן firestore.rules ללשונית Rules ולחצו Publish.

4. הגדרת מנהל:
   היכנסו פעם אחת לאפליקציה עם חשבון המנהל.
   ב-Authentication > Users העתיקו את UID של החשבון.
   ב-Firestore צרו collection בשם admins, מסמך ששמו ה-UID, ושדה Boolean בשם enabled בערך true.

5. כתובות:
   אפליקציה: https://shneorzigdon-maker.github.io/mitkadmim/
   חדר בקרה: https://shneorzigdon-maker.github.io/mitkadmim/admin/

הערה: אין הודעת עדכון על 8,000 מילים. המערכת כוללת יעד מאגר של 8,000 מילים, אך המאגר הקיים נשמר כפי שהוא כדי לא להכניס תרגומים לא מדויקים.
