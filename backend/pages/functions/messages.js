export function onRequest({ request, env }) {
  return env.GUESTBOOK.fetch(request);
}
