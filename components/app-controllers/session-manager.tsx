import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { CircularProgress } from '@mui/material';

import PageLoader from '~/components/common/loader/page-loader';

import { inAppLinks, InAppLinks } from '~/constants/side-nav-links';

const dashboardHref = inAppLinks[InAppLinks.DASHBOARD]?.href!;
const authHref = inAppLinks[InAppLinks.AUTH]?.href;
const loginHref = inAppLinks[InAppLinks.AUTH]?.nested?.[InAppLinks.LOGIN]?.href;
const loginPath = `${authHref}${loginHref}`;
const pathCheck = new RegExp(loginPath);

export const SessionManager: React.FC = () => {
  const router = useRouter();
  const session = useSession();

  const isLoading = session.status === 'loading';
  const isAuthenticated = session.status === 'authenticated';

  const isOnPublicPath = pathCheck.test(router.asPath);
  const shouldRedirectToLogin =
    !isAuthenticated && !isOnPublicPath && !isLoading;
  const shouldRedirectInApp = isAuthenticated && isOnPublicPath && !isLoading;

  useEffect(() => {
    if (shouldRedirectToLogin) {
      router.replace({ pathname: loginPath, query: { from: router.asPath } });
    } else if (shouldRedirectInApp) {
      router.replace({ pathname: dashboardHref });
    }
  }, [isOnPublicPath, shouldRedirectInApp, shouldRedirectToLogin, router]);

  return (
    <PageLoader isLoading={isLoading}>
      <CircularProgress />
    </PageLoader>
  );
};

