import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './api';

interface User {
  id: number;
  email: string;
  displayName: string;
  initials?: string;
  avatar?: string;
}

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: user, isLoading, error } = useQuery<User | null>({
    queryKey: ['/api/user'],
    queryFn: api.getUser,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const loginMutation = useMutation({
    mutationFn: api.login,
    onSuccess: (userData) => {
      queryClient.setQueryData(['/api/user'], userData);
      queryClient.invalidateQueries({ queryKey: ['/api/wishlist'] });
    },
  });

  const registerMutation = useMutation({
    mutationFn: api.register,
    onSuccess: (userData) => {
      queryClient.setQueryData(['/api/user'], userData);
      queryClient.invalidateQueries({ queryKey: ['/api/wishlist'] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: api.logout,
    onSuccess: () => {
      queryClient.setQueryData(['/api/user'], null);
      queryClient.clear();
    },
  });

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    loginMutation,
    registerMutation,
    logoutMutation,
  };
}