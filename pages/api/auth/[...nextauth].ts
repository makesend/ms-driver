import pick from 'lodash/pick';
import NextAuth from 'next-auth';
import { encode } from 'next-auth/jwt';
import type { AuthOptions, SessionStrategy } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
const sessionStrategy = 'jwt' as SessionStrategy;

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
dayjs.extend(relativeTime);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault('Asia/Bangkok');

import { authServices } from '~/services/server/auth';

import type { DriverBasicInfo } from '~/constants/driver-data';
import { DriverBasicInfoKeys } from '~/constants/driver-data';
import { envs } from '~/constants/envs';
import { inAppLinks } from '~/constants/side-nav-links';
import { authProviders } from '~/constants/auth-provider';

const msDriverCredentials = CredentialsProvider({
  type: 'credentials',
  id: authProviders.MSDriver,
  name: 'MS Driver Login',
  credentials: {
    phone: { label: 'Phone', type: 'text' },
    birthday: { label: 'Birthday', type: 'text' },
  },
  authorize: async (credentials, _req) => {
    if (!credentials) return null;

    const driverId = await authServices.login(credentials).then(({ id }) => id);

    const driverData = await authServices.getDriverData(driverId);

    const driverInfo = pick<typeof driverData>(
      driverData,
      Object.values(DriverBasicInfoKeys)
    );

    return { id: driverId, ...driverInfo };
  },
});

const oneDay = 60 * 60 * 24;

export const authOptions: AuthOptions = {
  providers: [msDriverCredentials],
  secret: envs.NEXTAUTH_SECRET,
  session: {
    strategy: sessionStrategy,
    maxAge: oneDay,
  },
  jwt: {
    secret: envs.NEXTAUTH_SECRET,
    encode: async ({ token, secret, ...ctx }) => {
      const tmr = dayjs()
        .add(1, 'day')
        .set('hours', 0)
        .set('minutes', 0)
        .set('seconds', 0);

      const diff = dayjs(tmr).diff(dayjs());

      const maxAge = Math.round(diff / 1000);

      return await encode({ token, secret, maxAge });
    },
  },
  pages: {
    // TODO: consider using recursion, curry, or linked list
    signIn: `${inAppLinks.auth}/${inAppLinks.login}`,
  },
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.user = user;
      }

      return token;
    },
    session: async ({ session, token }) => {
      if (token) {
        session.user = token.user as DriverBasicInfo;
        session.expires = new Date((token.exp as number) * 1000).toISOString();
      }

      return session;
    },
  },
  debug: envs.APP_ENV === 'development',
};

export default NextAuth(authOptions);
