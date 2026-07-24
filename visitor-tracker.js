(async function(){
  const cfg=window.MITKADMIM_FIREBASE_CONFIG;
  if(location.protocol==='file:'){
    console.info('Visitor tracking disabled: file:// is a local file and cannot report real visitors.');
    return;
  }
  if(!cfg||!cfg.projectId)return;
  try{
    const {initializeApp}=await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js');
    const {getFirestore,collection,addDoc,serverTimestamp}=await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js');
    const app=initializeApp(cfg),db=getFirestore(app);
    let visitorId=localStorage.getItem('mitkadmimVisitorId');
    if(!visitorId){visitorId=crypto.randomUUID();localStorage.setItem('mitkadmimVisitorId',visitorId)}
    await addDoc(collection(db,'visits'),{
      visitorId,
      visitedAt:serverTimestamp(),
      path:location.pathname,
      referrer:document.referrer||'',
      language:navigator.language||'',
      device:/Mobi|Android/i.test(navigator.userAgent)?'mobile':'desktop'
    });
  }catch(e){console.warn('Visitor tracking failed',e)}
})();
