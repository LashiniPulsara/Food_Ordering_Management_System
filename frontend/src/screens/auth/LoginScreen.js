import React, { useState, useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import PremiumInput from '../../components/PremiumInput';
import PremiumButton from '../../components/PremiumButton';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading } = useContext(AuthContext);

  const handleLogin = () => {
    login(email, password).catch(err => alert(err.response?.data?.message || err.message || 'Login failed. Check your credentials.'));
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.content}>
        {/* Logo area */}
        <View style={styles.logoArea}>
          <Text style={styles.logoText}>🍽️</Text>
          <Text style={styles.brandText}>WMT<Text style={styles.brandAccent}>FOOD</Text></Text>
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to order your favorite food</Text>
        </View>
        
        <View style={styles.form}>
          <PremiumInput
            label="Email Address"
            placeholder="example@email.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            icon={<Ionicons name="mail-outline" size={20} color={COLORS.textLight} />}
          />
          
          <PremiumInput
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            icon={<Ionicons name="lock-closed-outline" size={20} color={COLORS.textLight} />}
          />
          
          <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} style={styles.forgotContainer}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          {isLoading ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 24 }} />
          ) : (
            <PremiumButton title="Log In" onPress={handleLogin} style={styles.loginBtn} />
          )}
        </View>

        <TouchableOpacity onPress={() => navigation.navigate('RoleSelection')} style={styles.linkContainer}>
          <Text style={styles.linkText}>Don't have an account? <Text style={styles.linkTextBold}>Sign up</Text></Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  content: { flex: 1, padding: 24, justifyContent: 'center' },
  logoArea: { alignItems: 'center', marginBottom: 32 },
  logoText: { fontSize: 48 },
  brandText: { fontSize: 28, fontWeight: '900', color: COLORS.textDark, marginTop: 8, letterSpacing: -0.5 },
  brandAccent: { color: COLORS.primary },
  header: { marginBottom: 36 },
  title: { fontSize: 32, fontWeight: '800', color: COLORS.textDark, marginBottom: 8, letterSpacing: -0.5 },
  subtitle: { fontSize: 16, color: COLORS.textMedium },
  form: { width: '100%' },
  forgotContainer: { alignItems: 'flex-end', marginBottom: 24 },
  forgotText: { color: COLORS.primary, fontSize: 14, fontWeight: '600' },
  loginBtn: { marginTop: 8 },
  linkContainer: { marginTop: 40, alignItems: 'center' },
  linkText: { color: COLORS.textMedium, fontSize: 15 },
  linkTextBold: { color: COLORS.primary, fontWeight: '700' },
});

export default LoginScreen;
