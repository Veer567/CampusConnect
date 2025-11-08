// InitalLayout.tsx  
// This component manages navigation flow depending on authentication status.  
// It ensures users are automatically redirected to the correct screen group —  
// either the login/register flow or the main app tabs.

import React, { useEffect } from 'react';
import { useAuth } from '@clerk/clerk-expo';
const { useSegments, useRouter } = require('expo-router');

// Props definition for wrapping child components
type InitalLayoutProps = {
  children: React.ReactNode;
};

export default function InitalLayout({ children }: InitalLayoutProps) {
  const { isLoaded, isSignedIn } = useAuth(); // Clerk authentication state
  const segments = useSegments(); // Current route segment group (e.g., '(auth)', '(tabs)')
  const router = useRouter(); // Router for navigation control

  useEffect(() => {
    // Wait until Clerk has loaded the user's authentication state
    if (!isLoaded) return;

    // Check if current route belongs to the "(auth)" group
    const inAuthGroup = segments[0] === '(auth)';

    // 🔐 Redirect logic:
    // 1. If user is NOT signed in and not already in the auth group → go to login
    if (!isSignedIn && !inAuthGroup) {
      router.replace('/(auth)/login');
    } 
    // 2. If user IS signed in but in the auth group → redirect to main app tabs
    else if (isSignedIn && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isLoaded, isSignedIn, segments]);

  // Render the app’s children (screen content) once auth redirection logic is done
  return <>{children}</>; 
}
