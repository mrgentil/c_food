import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    ScrollView,
    Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { UserAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import * as Animatable from 'react-native-animatable';
import { useNavigation } from '@react-navigation/native';
import { getFriendlyErrorMessage } from '../utils/firebaseErrors';

const { width } = Dimensions.get('window');

const AuthScreen = () => {
    const navigation = useNavigation();
    const { signInUser, createUser } = UserAuth();

    // State
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Form Fields
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');

    const handleLogin = async () => {
        if (!email || !password) {
            setError('Veuillez remplir tous les champs');
            return;
        }

        setError('');
        setLoading(true);

        try {
            await signInUser(email, password);
            // AuthContext handles redirect
        } catch (err) {
            console.error('Erreur connexion:', err);
            setError(getFriendlyErrorMessage(err.code));
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async () => {
        if (!email || !password || !firstName || !lastName || !phoneNumber) {
            setError('Veuillez remplir tous les champs');
            return;
        }

        if (password.length < 6) {
            setError('Le mot de passe doit contenir au moins 6 caractères');
            return;
        }

        setError('');
        setLoading(true);

        try {
            // 1. Create Auth User
            const userCredential = await createUser(email, password);
            const user = userCredential.user;

            // 2. Create User Profile in Firestore
            await setDoc(doc(db, 'user', user.uid), {
                uid: user.uid,
                email: email.toLowerCase(),
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                phoneNumber: phoneNumber.trim(),
                role: 'client',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            // 3. Navigation is handled by AuthContext
        } catch (err) {
            console.error('Erreur inscription:', err);
            setError(getFriendlyErrorMessage(err.code));
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#F0F9FF' }}>
            <StatusBar style="dark" />
            <SafeAreaView style={{ flex: 1 }}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={{ flex: 1 }}
                >
                    <ScrollView
                        contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Header Animation */}
                        <Animatable.View
                            animation="fadeInDown"
                            duration={1000}
                            style={styles.header}
                        >
                            <View style={styles.logoContainer}>
                                <Text style={{ fontSize: 40 }}>🍔</Text>
                            </View>
                            <Text style={styles.title}>C-Food</Text>
                            <Text style={styles.subtitle}>
                                {isLogin ? 'Bon retour parmi nous ! 👋' : 'Créez votre compte client 🚀'}
                            </Text>
                        </Animatable.View>

                        {/* Tab Switcher */}
                        <View style={styles.tabContainer}>
                            <TouchableOpacity
                                style={[styles.tab, isLogin && styles.activeTab]}
                                onPress={() => { setIsLogin(true); setError(''); }}
                            >
                                <Text style={[styles.tabText, isLogin && styles.activeTabText]}>Se connecter</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.tab, !isLogin && styles.activeTab]}
                                onPress={() => { setIsLogin(false); setError(''); }}
                            >
                                <Text style={[styles.tabText, !isLogin && styles.activeTabText]}>S'inscrire</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Form */}
                        <Animatable.View
                            animation="fadeInUp"
                            duration={800}
                            style={styles.formContainer}
                        >
                            {error ? (
                                <Animatable.View animation="shake" style={styles.errorContainer}>
                                    <Ionicons name="alert-circle" size={20} color="#EF4444" />
                                    <Text style={styles.errorText}>{error}</Text>
                                </Animatable.View>
                            ) : null}

                            {!isLogin && (
                                <View style={styles.rowInputs}>
                                    <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
                                        <Ionicons name="person-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                                        <TextInput
                                            placeholder="Prénom"
                                            value={firstName}
                                            onChangeText={setFirstName}
                                            style={styles.input}
                                            placeholderTextColor="#94A3B8"
                                        />
                                    </View>
                                    <View style={[styles.inputContainer, { flex: 1 }]}>
                                        <TextInput
                                            placeholder="Nom"
                                            value={lastName}
                                            onChangeText={setLastName}
                                            style={styles.input}
                                            placeholderTextColor="#94A3B8"
                                        />
                                    </View>
                                </View>
                            )}

                            {!isLogin && (
                                <View style={styles.inputContainer}>
                                    <Ionicons name="call-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                                    <TextInput
                                        placeholder="Téléphone (ex: 0812345678)"
                                        value={phoneNumber}
                                        onChangeText={setPhoneNumber}
                                        keyboardType="phone-pad"
                                        style={styles.input}
                                        placeholderTextColor="#94A3B8"
                                    />
                                </View>

                            )}

                            <View style={styles.inputContainer}>
                                <Ionicons name="mail-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                                <TextInput
                                    placeholder="Email"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    style={styles.input}
                                    placeholderTextColor="#94A3B8"
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Ionicons name="lock-closed-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                                <TextInput
                                    placeholder="Mot de passe"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                    style={styles.input}
                                    placeholderTextColor="#94A3B8"
                                />
                            </View>

                            <TouchableOpacity
                                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                                onPress={isLogin ? handleLogin : handleRegister}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text style={styles.submitText}>
                                        {isLogin ? 'Se connecter' : 'S\'inscrire'}
                                    </Text>
                                )}
                            </TouchableOpacity>

                            {isLogin && (
                                <TouchableOpacity style={{ marginTop: 15, alignItems: 'center' }}>
                                    <Text style={{ color: '#0EA5E9', fontWeight: '600' }}>Mot de passe oublié ?</Text>
                                </TouchableOpacity>
                            )}
                        </Animatable.View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
};

const styles = {
    header: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 30,
    },
    logoContainer: {
        width: 80,
        height: 80,
        backgroundColor: 'white',
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        shadowColor: '#0EA5E9',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
        borderWidth: 1,
        borderColor: '#F0F9FF',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#0F172A',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#64748B',
        fontWeight: '500',
    },
    tabContainer: {
        flexDirection: 'row',
        marginHorizontal: 24,
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 4,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 12,
    },
    activeTab: {
        backgroundColor: '#0EA5E9',
    },
    tabText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#64748B',
    },
    activeTabText: {
        color: 'white',
        fontWeight: '700',
    },
    formContainer: {
        marginHorizontal: 24,
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 3,
        marginBottom: 24,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF2F2',
        padding: 12,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    errorText: {
        color: '#B91C1C',
        marginLeft: 8,
        flex: 1,
        fontSize: 14,
    },
    rowInputs: {
        flexDirection: 'row',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#1E293B',
    },
    submitButton: {
        backgroundColor: '#0EA5E9',
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 8,
        shadowColor: '#0EA5E9',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 5,
    },
    submitButtonDisabled: {
        opacity: 0.7,
    },
    submitText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '700',
    },
};

export default AuthScreen;
