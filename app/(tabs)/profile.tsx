import { View, Text, Button, Alert } from 'react-native';
import React from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';

export default function Profile() {
  const { signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut(); // Logs out the user
      router.replace('/(auth)/login'); // Redirect to login screen
    } catch (err) {
      Alert.alert('Sign out failed', 'Please try again.');
      console.error('Sign out error:', err);
    }
  };

  return (
    <View style={{ padding: 20, marginTop: 50 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Profile</Text>
      <Button title="Sign Out" onPress={handleSignOut} />
    </View>
  );
}
