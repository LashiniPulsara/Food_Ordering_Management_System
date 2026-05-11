import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import api, { API_BASE_URL } from '../../api/axios';
import PremiumInput from '../../components/PremiumInput';
import PremiumButton from '../../components/PremiumButton';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';

const RegisterScreen = ({ navigation, route }) => {
  const selectedRole = route.params?.role || 'customer';
  const isRestaurant = selectedRole === 'restaurantOwner';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword || !phone) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/auth/register', { name, email, password, phone, role: selectedRole });
      Alert.alert('Success', 'Account created successfully! Please login.');
      navigation.navigate('Login');
    } catch (err) {
      if (err.message === 'Network Error') {
        Alert.alert('Registration Failed', `Cannot connect to server.\nCurrent API: ${API_BASE_URL}\n\nMake sure backend is running and phone + PC are on same Wi-Fi.`);
      } else {
        Alert.alert('Registration Failed', err.response?.data?.message || err.message || 'Something went wrong');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>
            Sign up as <Text style={{ color: COLORS.primary, fontWeight: '700' }}>{isRestaurant ? 'Restaurant Owner' : 'Customer'}</Text>
          </Text>
        </View>

        <PremiumInput label="Full Name" placeholder="John Doe" value={name} onChangeText={setName}
          icon={<Ionicons name="person-outline" size={20} color={COLORS.textLight} />} />
        <PremiumInput label="Email" placeholder="example@email.com" value={email} onChangeText={setEmail}
          autoCapitalize="none" keyboardType="email-address"
          icon={<Ionicons name="mail-outline" size={20} color={COLORS.textLight} />} />
        <PremiumInput label="Phone" placeholder="+94 712 345 678" value={phone} onChangeText={setPhone}
          keyboardType="phone-pad"
          icon={<Ionicons name="call-outline" size={20} color={COLORS.textLight} />} />
        <PremiumInput label="Password" placeholder="Create a strong password" value={password} onChangeText={setPassword}
          secureTextEntry
          icon={<Ionicons name="lock-closed-outline" size={20} color={COLORS.textLight} />} />
        <PremiumInput label="Confirm Password" placeholder="Repeat password" value={confirmPassword} onChangeText={setConfirmPassword}
          secureTextEntry
          icon={<Ionicons name="shield-checkmark-outline" size={20} color={COLORS.textLight} />} />
          
        {isLoading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 24 }} />
        ) : (
          <PremiumButton title="Sign Up" onPress={handleRegister} style={{ marginTop: 16 }} />
        )}

        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backContainer}>
          <Ionicons name="arrow-back" size={16} color={COLORS.textMedium} style={{ marginRight: 6 }} />
          <Text style={styles.linkText}>Back to roles</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.linkContainer}>
          <Text style={styles.linkText}>Already have an account? <Text style={styles.linkTextBold}>Log in</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24, paddingTop: 60 },
  header: { marginBottom: 32 },
  title: { fontSize: 32, fontWeight: '800', color: COLORS.textDark, marginBottom: 8, letterSpacing: -0.5 },
  subtitle: { fontSize: 16, color: COLORS.textMedium },
  backContainer: { flexDirection: 'row', marginTop: 32, alignItems: 'center', justifyContent: 'center' },
  linkContainer: { marginTop: 20, alignItems: 'center', marginBottom: 40 },
  linkText: { color: COLORS.textMedium, fontSize: 15 },
  linkTextBold: { color: COLORS.primary, fontWeight: '700' },
});

export default RegisterScreen;
