/**
 * 离线缓存：仅缓存同源 GET 静态资源，不触碰 IndexedDB / Dexie。
 * 更新：发布新版本时请递增 CACHE_NAME，旧缓存会在 activate 中删除。
 */
const CACHE_NAME = 'bioform-shell-v1'

self.addEventListener('install', event => {
  self.skipWaiting()
  event.waitUntil(Promise.resolve())
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))),
    ).then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', event => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  // 不缓存外部 LLM API
  if (request.url.includes('api.deepseek.com')) return

  event.respondWith(
    caches.open(CACHE_NAME).then(cache =>
      fetch(request)
        .then(response => {
          if (response.ok && response.type === 'basic') {
            cache.put(request, response.clone())
          }
          return response
        })
        .catch(() => cache.match(request).then(cached => cached || fetch(request))),
    ),
  )
})
