import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  providers: [
    // we cast the provider to any below to avoid strict typing issues with generics
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials): Promise<any> {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials')
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user || !user.passwordHash) {
          throw new Error('Invalid credentials')
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        )

        if (!isPasswordValid) {
          throw new Error('Invalid credentials')
        }

        // NextAuth expects a `User` type with non-nullable `role`.
        // Prisma's User.role is nullable during setup, so cast to any to avoid
        // a mismatch in the promise generics and satisfy the compiler.
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        } as any
      },
    }) as any,
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const t = token as any
        t.role = user.role
        t.id = user.id
        // pass profileCompleted if available
        t.profileCompleted = (user as any).profileCompleted
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        const u = session.user as any
        u.role = token.role as string
        u.id = token.id as string
        u.profileCompleted = (token as any).profileCompleted as boolean
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
}
