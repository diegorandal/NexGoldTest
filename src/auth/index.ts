import {
  MiniAppWalletAuthSuccessPayload,
  MiniKit,
  verifySiweMessage,
} from '@worldcoin/minikit-js';
import NextAuth, { type DefaultSession } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { createHmac } from 'crypto';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      walletAddress?: string;
      username?: string;
      profilePictureUrl?: string;
    } & DefaultSession['user'];
  }
   interface User {
    id: string;
    walletAddress?: string;
    username?: string;
    profilePictureUrl?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId?: string;
    walletAddress?: string;
    username?: string;
    profilePictureUrl?: string;
  }
}

const verifySignedNonce = (nonce: string, signedNonce: string, secret: string): boolean => {
  const hmac = createHmac('sha256', secret).update(nonce).digest('hex');
  return hmac === signedNonce;
};

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  session: { 
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60,
  }, 
  providers: [
    Credentials({
      name: 'World App Wallet',
      credentials: {
        nonce: { label: 'Nonce', type: 'text' },
        signedNonce: { label: 'Signed Nonce', type: 'text' },
        finalPayloadJson: { label: 'Final Payload', type: 'text' },
      },
      authorize: async (credentials) => {
        try {
          const { finalPayloadJson, nonce, signedNonce } = credentials as Record<string, string>;

          if (!finalPayloadJson || !nonce || !signedNonce) {
            console.error("Faltan credenciales para la autorización.");
            return null;
          }

          const secret = process.env.HMAC_SECRET_KEY;
          if (!secret) throw new Error("HMAC_SECRET_KEY no configurado.");

          const isNonceAuthentic = verifySignedNonce(nonce, signedNonce, secret);
          if (!isNonceAuthentic) {
            console.error("Fallo de autorización: HMAC inválido.");
            return null;
          }

          const finalPayload: MiniAppWalletAuthSuccessPayload = JSON.parse(finalPayloadJson);
          const result = await verifySiweMessage(finalPayload, nonce);

          if (!result.isValid || !result.siweMessageData.address) {
            console.error("Fallo de autorización: Firma SIWE inválida.");
            return null;
          }

          const walletAddress = result.siweMessageData.address.toLowerCase();
          const userInfo = await MiniKit.getUserInfo(walletAddress);

          return {
            id: walletAddress,
            walletAddress: walletAddress,
            username: userInfo.username,
            profilePictureUrl: userInfo.profilePictureUrl,
          };

        } catch (error) {
          console.error("Error en el proceso de authorize:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.walletAddress = user.walletAddress;
        token.username = user.username;
        token.profilePictureUrl = user.profilePictureUrl;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (token.userId) {
        session.user.id = token.userId as string;
        session.user.walletAddress = token.walletAddress as string;
        session.user.username = token.username as string;
        session.user.profilePictureUrl = token.profilePictureUrl as string;
      }
      return session;
    },
  },
});
