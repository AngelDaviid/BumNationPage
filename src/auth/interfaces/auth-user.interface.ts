import { User } from '@prisma/client';
import { Request } from 'express';

export type AuthUser = Pick<User, 'id' | 'identification' | 'role'>;

export interface AuthenticatedRequest extends Request {
  user: AuthUser;
}
