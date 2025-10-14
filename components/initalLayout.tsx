import React, { useEffect } from 'react';
import { useAuth } from '@clerk/clerk-expo';
const { useSegments, useRouter } = require('expo-router');

type InitalLayoutProps = {
  children: React.ReactNode;
};

export default function InitalLayout({ children }: InitalLayoutProps) {
  const { isLoaded, isSignedIn } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isSignedIn && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isSignedIn && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isLoaded, isSignedIn, segments]);

  return <>{children}</>; // 👈 render children safely
}
