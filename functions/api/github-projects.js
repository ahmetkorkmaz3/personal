export async function onRequest(context) {
  // CORS headers'ı dinamik olarak ayarla
  const allowedOrigins = {
    'production': 'https://ahmetkorkmaz.co',
    'preview': 'https://*.pages.dev'
  };

  const headers = {
    'Access-Control-Allow-Origin': context.env.CF_PAGES_BRANCH === 'main' 
      ? allowedOrigins.production 
      : allowedOrigins.preview,
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Access-Control-Max-Age': '86400',
  };

  // Handle OPTIONS request for CORS
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  // Only allow GET requests
  if (context.request.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  const query = `
  {
    user(login: "ahmetkorkmaz3") {
      pinnedItems(first: 6, types: REPOSITORY) {
        nodes {
          ... on Repository {
            name
            description
            url
            primaryLanguage {
              name
            }
          }
        }
      }
    }
  }`;

  try {
    const response = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${context.env.GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Cloudflare Worker',
      },
      body: JSON.stringify({ query }),
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch GitHub data' }), {
      status: 500,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
    });
  }
} 