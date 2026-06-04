import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '@/src/store/auth/auth.store';
import { loginSchema, TypeLoginSchema } from '@/src/schemas/auth/login.schema';
import { saveTokens } from '@/src/libs/auth/token-storage';
import {
  LOGIN_MUTATION,
  type LoginData,
  type LoginVars,
} from '@/src/graphql/mutations/auth.mutations';

export function useLogin() {
  const setIsAuthenticated = useAuthStore(s => s.setIsAuthenticated);
  const [requiresPin, setRequiresPin] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<TypeLoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: { login: '', password: '', pin: '' },
  });

  const [loginMutation, { loading }] = useMutation<LoginData, LoginVars>(LOGIN_MUTATION);

  const onSubmit = form.handleSubmit(async values => {
    setServerError(null);
    try {
      const { data } = await loginMutation({
        variables: {
          data: {
            login: values.login,
            password: values.password,
            pin: values.pin || undefined,
          },
        },
      });

      const result = data?.login;
      if (!result) return;

      // Server signals TOTP required via message without user
      if (result.message && !result.user) {
        setRequiresPin(true);
        setServerError(result.message);
        return;
      }

      if (result.user) {
        if (result.accessToken && result.refreshToken) {
          await saveTokens({
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
          });
        }
        setIsAuthenticated(true);
      }
    } catch (e: unknown) {
      const err = e as { graphQLErrors?: { message: string }[]; message?: string };
      setServerError(err?.graphQLErrors?.[0]?.message ?? err?.message ?? 'Something went wrong');
    }
  });

  return { form, onSubmit, loading, serverError, requiresPin };
}
