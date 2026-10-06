import { CookieOptions, Request } from 'express';

export const AUTH_COOKIE = 'access_token';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export const authCookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: SEVEN_DAYS_MS,
});

export const extractTokenFromCookie = (request: Request): string | null => {
  const cookies = request.cookies as Record<string, string> | undefined;
  return cookies?.[AUTH_COOKIE] ?? null;
};
