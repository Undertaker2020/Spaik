import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { registerSchema, TypeRegisterSchema } from '@/src/schemas/auth/register.schema';
import {
  CREATE_USER_MUTATION,
  type CreateUserData,
  type CreateUserVars,
} from '@/src/graphql/mutations/auth.mutations';

export function useRegister() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm<TypeRegisterSchema>({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: '', email: '', password: '' },
  });

  const [createUserMutation, { loading }] = useMutation<CreateUserData, CreateUserVars>(
    CREATE_USER_MUTATION,
  );

  const onSubmit = form.handleSubmit(async values => {
    setServerError(null);
    try {
      const { data } = await createUserMutation({ variables: { data: values } });

      if (data?.createUser) {
        setSuccess(true);
        setTimeout(() => router.replace('/(auth)/login'), 1500);
      }
    } catch (e: unknown) {
      const err = e as { graphQLErrors?: { message: string }[]; message?: string };
      setServerError(err?.graphQLErrors?.[0]?.message ?? err?.message ?? 'Something went wrong');
    }
  });

  return { form, onSubmit, loading, serverError, success };
}
