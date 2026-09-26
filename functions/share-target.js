// The installed app's service worker normally catches shares from WhatsApp etc.
// before they reach the network. If it isn't running yet, the share lands here:
// drop the content (we don't want message text in server logs) and send the
// person to the home page with a note.
export function onRequest({ request }) {
  return Response.redirect(new URL('/?shared=failed', request.url).href, 303);
}
