type Env = {
  DB: D1Database;
};

type WaitlistPayload = {
  name?: string;
  email?: string;
  accountType?: 'personal' | 'business' | string;
  message?: string;
};

const ALLOWED_ORIGINS = [
  'https://mevrelbank.com',
  'https://www.mevrelbank.com',
  'http://localhost:5173',
];

function getCorsHeaders(origin: string | null): Record<string, string> {
  if (!origin) {
    return {
      'Vary': 'Origin',
    };
  }

  const isPagesPreview = /^https:\/\/[a-z0-9-]+\.pages\.dev$/i.test(origin);
  const isAllowed = ALLOWED_ORIGINS.includes(origin) || isPagesPreview;

  if (!isAllowed) {
    return {
      'Vary': 'Origin',
    };
  }

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
}

function badRequest(message: string, origin: string | null): Response {
  return new Response(JSON.stringify({ error: message }), {
    status: 400,
    headers: {
      'Content-Type': 'application/json',
      ...getCorsHeaders(origin),
    },
  });
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export const onRequestOptions: PagesFunction<Env> = async (context) => {
  const origin = context.request.headers.get('Origin');
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(origin),
  });
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const origin = context.request.headers.get('Origin');

  try {
    const body = (await context.request.json()) as WaitlistPayload;

    const name = body.name?.trim() ?? '';
    const email = body.email?.trim().toLowerCase() ?? '';
    const accountType = body.accountType === 'personal' || body.accountType === 'business' ? body.accountType : '';
    const message = body.message?.trim() ?? '';

    if (!name) return badRequest('Name is required.', origin);
    if (!email || !isValidEmail(email)) return badRequest('A valid email is required.', origin);
    if (!accountType) return badRequest('Account type is required.', origin);
    if (name.length > 120) return badRequest('Name is too long.', origin);
    if (email.length > 254) return badRequest('Email is too long.', origin);
    if (message.length > 2000) return badRequest('Message is too long.', origin);

    const insert = context.env.DB.prepare(
      `INSERT INTO waitlist_submissions (name, email, account_type, message) VALUES (?, ?, ?, ?)`
    );

    await insert.bind(name, email, accountType, message || null).run();

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...getCorsHeaders(origin),
      },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Unable to submit waitlist request right now. Please try again.' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...getCorsHeaders(origin),
      },
    });
  }
};
