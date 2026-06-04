import { useEffect, useState } from 'react';
import { useMutation } from '@apollo/client';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/src/store/auth/auth.store';
import {
  VERIFY_ACCOUNT_MUTATION,
} from '@/src/graphql/mutations/auth.mutations';

interface VerifyData {
  verifyAccount: {
    user: { username: string } | null;
    message: string | null;
  };
}

interface VerifyVars {
  data: { token: string };
}

export function useVerify(token: string | undefined) {
  const router = useRouter();
  const setIsAuthenticated = useAuthStore(s => s.setIsAuthenticated);
  const [error, setError] = useState<string | null>(null);

  const [verifyMutation, { loading }] = useMutation<VerifyData, VerifyVars>(
    VERIFY_ACCOUNT_MUTATION,
  );

  useEffect(() => {
    if (!token) {
      setError('Invalid verification link');
      return;
    }

    verifyMutation({ variables: { data: { token } } })
      .then(({ data }) => {
        if (data?.verifyAccount.user) {
          setIsAuthenticated(true);
          router.replace('/(tabs)');
        }
      })
      .catch((e: unknown) => {
        const err = e as { graphQLErrors?: { message: string }[]; message?: string };
        setError(err?.graphQLErrors?.[0]?.message ?? err?.message ?? 'Verification failed');
      });
  }, [token]);

  return { loading, error };
}