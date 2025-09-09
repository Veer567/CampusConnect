import { View, Text } from 'react-native'
import React, { use, useEffect } from 'react'
import { useAuth } from '@clerk/clerk-expo'
import { useSegments , useRouter, Stack } from 'expo-router';

export default function InitalLayout() {
    const { isLoaded, isSignedIn } = useAuth()
    
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => { 
        if (!isLoaded) return; // Wait until the auth state is loaded
        
        const inAuthScreen= segments[0] === '(auth)';

        if (!isSignedIn && !inAuthScreen) router.replace('/(auth)/login');
        else if (isSignedIn && inAuthScreen) router.replace('/(tabs)');
      

    },[isLoaded , isSignedIn, segments])

    return <Stack screenOptions={{ headerShown: false }} />;
}