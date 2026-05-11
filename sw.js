// גרסה — בכל push תעלה אוטומטית כי השרת מחזיר sw.js חדש
const VERSION='2026-05-11-06';
const CACHE=`beach-${VERSION}`;
const ASSETS=['./','./index.html','./manifest.json','./icon.svg','./icon.png'];

self.addEventListener('install',e=>{
  e.waitUntil(
    caches.open(CACHE)
      .then(c=>c.addAll(ASSETS))
      .then(()=>self.skipWaiting())
  );
});

self.addEventListener('activate',e=>{
  e.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',e=>{
  const url=new URL(e.request.url);

  // API: network only (אין שום סיבה לקאש)
  if(url.hostname.includes('open-meteo.com')){
    e.respondWith(fetch(e.request).catch(()=>new Response(JSON.stringify({error:'offline'}),{headers:{'Content-Type':'application/json'}})));
    return;
  }

  // App shell: network-first עם fallback ל-cache
  // ככה כל push חדש מגיע מיד לטלפון
  e.respondWith(
    fetch(e.request)
      .then(resp=>{
        if(resp.ok&&e.request.method==='GET'){
          const clone=resp.clone();
          caches.open(CACHE).then(c=>c.put(e.request,clone));
        }
        return resp;
      })
      .catch(()=>caches.match(e.request).then(r=>r||caches.match('./index.html')))
  );
});

// הודעה מהדף → בדוק עדכון מיידי
self.addEventListener('message',e=>{
  if(e.data==='skipWaiting')self.skipWaiting();
});
