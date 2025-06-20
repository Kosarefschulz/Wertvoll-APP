import { type NextAuthOptions } from 'next-auth';
import EmailProvider from 'next-auth/providers/email';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@wertvoll/db';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM || 'noreply@wertvoll.de',
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],
  pages: {
    signIn: '/auth/login',
    signOut: '/auth/logout',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        
        // Get employee data
        const employee = await prisma.employee.findUnique({
          where: { userId: user.id },
          include: { company: true },
        });

        if (employee) {
          session.user.role = employee.role;
          session.user.companyId = employee.companyId;
          session.user.employeeId = employee.id;
        }
      }
      return session;
    },
  },
  session: {
    strategy: 'database',
  },
};