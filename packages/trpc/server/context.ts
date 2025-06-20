import { type inferAsyncReturnType } from '@trpc/server';
import { type CreateNextContextOptions } from '@trpc/server/adapters/next';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { prisma } from '@wertvoll/db';

export async function createContext({ req, res }: CreateNextContextOptions) {
  const session = await getServerSession(req, res, authOptions);

  return {
    prisma,
    session,
    req,
    res,
  };
}

export type Context = inferAsyncReturnType<typeof createContext>;