import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export type UserRole = 'ADMIN' | 'AGENT';

export interface UserSession {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  companyId: string;
}

const COOKIE_NAME = 'twiolo_session';
const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-at-least-32-chars-long-security'
);

export async function createSessionToken(sessionData: UserSession): Promise<string> {
  return new SignJWT({ ...sessionData })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(SECRET_KEY);
}

export async function verifySessionToken(token: string): Promise<UserSession | null> {
  try {
    const verified = await jwtVerify(token, SECRET_KEY);
    return verified.payload as unknown as UserSession;
  } catch (error) {
    return null;
  }
}

export async function getSessionFromCookies(): Promise<UserSession | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return await verifySessionToken(token);
}

export async function getSessionFromRequest(req: NextRequest): Promise<UserSession | null> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return await verifySessionToken(token);
}

export function setSessionCookie(res: NextResponse, token: string): void {
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  });
}

export function clearSessionCookie(res: NextResponse): void {
  res.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
}

export function verifyCredentials(email: string, password: string): UserSession | null {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const adminPass = process.env.ADMIN_PASSWORD || 'adminpass';

  const agentEmail = process.env.AGENT_EMAIL || 'agent@example.com';
  const agentPass = process.env.AGENT_PASSWORD || 'agentpass';

  if (email.toLowerCase() === adminEmail.toLowerCase() && password === adminPass) {
    return {
      id: 'admin_1',
      email: adminEmail,
      name: 'System Admin',
      role: 'ADMIN',
      companyId: 'company_default',
    };
  }

  if (email.toLowerCase() === agentEmail.toLowerCase() && password === agentPass) {
    return {
      id: 'agent_1',
      email: agentEmail,
      name: 'Call Agent 01',
      role: 'AGENT',
      companyId: 'company_default',
    };
  }

  return null;
}
