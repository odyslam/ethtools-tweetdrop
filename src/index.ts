import { handleRequest } from './handler'

addEventListener('fetch', (event): void => {
  event.respondWith(handleRequest(event.request))
})


