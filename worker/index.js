const worker = {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/') url.pathname = '/index.html';

    const response = await env.ASSETS.fetch(new Request(url, request));
    if (response.status !== 404) return response;

    const acceptsHtml = (request.headers.get('accept') || '').includes('text/html');
    if (acceptsHtml) {
      return env.ASSETS.fetch(new Request(new URL('/index.html', request.url), request));
    }

    return response;
  }
};

export default worker;
