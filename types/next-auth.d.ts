import { type DefaultSession } from 'next-auth';
import { type UserRole } from '@wertvoll/db';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role?: UserRole;
      companyId?: string;
      employeeId?: string;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
  }
}