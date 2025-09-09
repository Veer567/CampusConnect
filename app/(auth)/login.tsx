import { COLORS } from '@/constants/themes'
import { styles } from '@/styles/auth.styles'
import { useSSO } from '@clerk/clerk-expo'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import React from 'react'
import { Image, Text, TouchableOpacity, View } from 'react-native'


export default function Login() {

    const { startSSOFlow } = useSSO()
    const router = useRouter();


    const handleGoogleSignIn = async () => { 
        try {
            // Your Google Sign-In logic here
            const { createdSessionId, setActive } = await startSSOFlow({ strategy: 'oauth_google' });
             
            if (createdSessionId && setActive) {
                setActive({ session: createdSessionId });
                router.replace('/(tabs)');
            }
        } catch (error) {
            console.error("Google Sign-In error:", error);
        }
    }

  return (
    
    <View style={styles.container}>
      <View style={styles.brandSection}>
        <View style={styles.logoContainer}>
          <Ionicons name="leaf" size={32} color={COLORS.primary} /> 
        </View>
        <Text style={styles.appName}>Spotlight</Text>
        <Text style={styles.tagline}>Discover. Share. Inspire.</Text>
          </View>
          
          {/* Illustration Section */}
          <View style={styles.illustrationContainer}>
              <Image
                  source={require('../../assets/images/Online wishes-bro.png')}
                  style={styles.illustration}
                    resizeMode="cover"
              />
          </View>
              
          {/* Login Section */}
          
          <View style={styles.loginSection}>
              <TouchableOpacity
                  style={styles.googleButton}
                  onPress= {handleGoogleSignIn}
                  activeOpacity={0.9}
              >
                  <View style={styles.googleIconContainer}>
                      <Ionicons name="logo-google" size={24} color={COLORS.surface} />
                  </View>
                    <Text style={styles.googleButtonText}>Continue with Google</Text>
              </TouchableOpacity>
              <Text style={styles.termsText}>
                  By continuing, you agree to our Terms of Service and Privacy Policy.
              </Text>
          </View>
    </View>
  )
}
