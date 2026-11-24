const GSC_VERIFICATION_PATH = '/googlee9c930fab0503349.html';
const GSC_VERIFICATION_BODY = 'google-site-verification: googlee9c930fab0503349.html';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === GSC_VERIFICATION_PATH) {
      return new Response(GSC_VERIFICATION_BODY, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-cache',
          'X-Content-Type-Options': 'nosniff',
        },
      });
    }
    return env.ASSETS.fetch(request);
  },
};
