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
    Dimensions,
    Modal,
    FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from '../../firebase/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

const { width } = Dimensions.get('window');

const CITIES = [
    'Kinshasa', 'Lubumbashi', 'Goma', 'Kisangani', 'Bukavu', 'Matadi', 'Kananga', 'Mbuji-Mayi', 'Likasi', 'Kolwezi',
    'Kikwit', 'Uvira', 'Mbandaka', 'Bunia', 'Kalemie', 'Tshikapa', 'Gemena', 'Kindu', 'Isiro', 'Bandundu', 'Boma',
    'Kamina', 'Lisala', 'Lodja', 'Zongo', 'Beni', 'Butembo', 'Mwene-Ditu'
].sort();

const InputField = ({ icon, placeholder, value, onChangeText, secureTextEntry, keyboardType, autoCapitalize, showPassword, setShowPassword }) => (
    <View style={styles.inputContainer}>
        <Ionicons name={icon} size={20} color="#94A3B8" style={styles.inputIcon} />
        <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor="#94A3B8"
            keyboardType={keyboardType || 'default'}
            autoCapitalize={autoCapitalize || 'none'}
            secureTextEntry={secureTextEntry && !showPassword}
            style={styles.input}
        />
        {secureTextEntry && (
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#94A3B8"
                />
            </TouchableOpacity>
        )}
    </View>
);

const LoginScreen = ({ navigation }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [city, setCity] = useState('Kinshasa');
    const [showCityPicker, setShowCityPicker] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const { signIn } = useAuth();

    const handleLogin = async () => {
        if (!email || !password) {
            setError('Veuillez remplir tous les champs');
            return;
        }

        setError('');
        setLoading(true);

        const result = await signIn(email, password);

        if (!result.success) {
            setError(result.error);
        }

        setLoading(false);
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
            // 1. Créer le compte Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 2. Créer le profil livreur dans Firestore
            await setDoc(doc(db, 'user', user.uid), {
                uid: user.uid,
                email: email.toLowerCase(),
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                phoneNumber: phoneNumber.trim(),
                city: city,
                role: 'driver',
                vehicleType: 'moto',
                isAvailable: true,
                rating: 5.0,
                totalDeliveries: 0,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            // L'AuthContext va automatiquement détecter la connexion
        } catch (err) {
            console.error('Erreur inscription:', err);
            if (err.code === 'auth/email-already-in-use') {
                setError('Cet email est déjà utilisé');
            } else if (err.code === 'auth/invalid-email') {
                setError('Email invalide');
            } else {
                setError('Erreur lors de l\'inscription');
            }
        }

        setLoading(false);
    };



    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Logo & Title */}
                    <View style={styles.headerSection}>
                        <View style={styles.logoCircle}>
                            <Text style={styles.logoEmoji}>🛵</Text>
                        </View>
                        <Text style={styles.title}>C-FOOD Driver</Text>
                        <Text style={styles.subtitle}>
                            {isLogin ? 'Connectez-vous pour livrer' : 'Créez votre compte livreur'}
                        </Text>
                    </View>

                    {/* Tab Switcher */}
                    <View style={styles.tabContainer}>
                        <TouchableOpacity
                            style={[styles.tab, isLogin && styles.tabActive]}
                            onPress={() => { setIsLogin(true); setError(''); }}
                        >
                            <Text style={[styles.tabText, isLogin && styles.tabTextActive]}>
                                Connexion
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tab, !isLogin && styles.tabActive]}
                            onPress={() => { setIsLogin(false); setError(''); }}
                        >
                            <Text style={[styles.tabText, !isLogin && styles.tabTextActive]}>
                                Inscription
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Error Message */}
                    {error ? (
                        <View style={styles.errorContainer}>
                            <Ionicons name="alert-circle" size={18} color="#EF4444" />
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    ) : null}

                    {/* Form */}
                    <View style={styles.formContainer}>
                        {!isLogin && (
                            <>
                                <View style={styles.rowInputs}>
                                    <View style={{ flex: 1, marginRight: 8 }}>
                                        <InputField
                                            icon="person-outline"
                                            placeholder="Prénom"
                                            value={firstName}
                                            onChangeText={setFirstName}
                                            autoCapitalize="words"
                                            showPassword={showPassword}
                                            setShowPassword={setShowPassword}
                                        />
                                    </View>
                                    <View style={{ flex: 1, marginLeft: 8 }}>
                                        <InputField
                                            icon="person-outline"
                                            placeholder="Nom"
                                            value={lastName}
                                            onChangeText={setLastName}
                                            autoCapitalize="words"
                                            showPassword={showPassword}
                                            setShowPassword={setShowPassword}
                                        />
                                    </View>
                                </View>

                                <InputField
                                    icon="call-outline"
                                    placeholder="Téléphone (+243...)"
                                    value={phoneNumber}
                                    onChangeText={setPhoneNumber}
                                    keyboardType="phone-pad"
                                    showPassword={showPassword}
                                    setShowPassword={setShowPassword}
                                />

                                {/* City Selector Button */}
                                <TouchableOpacity
                                    style={styles.inputContainer}
                                    onPress={() => {
                                        setSearchText('');
                                        setShowCityPicker(true);
                                    }}
                                >
                                    <Ionicons name="location-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                                    <Text style={[styles.input, { color: city ? '#1E293B' : '#94A3B8' }]}>
                                        {city || 'Sélectionner une ville'}
                                    </Text>
                                    <Ionicons name="chevron-down" size={20} color="#94A3B8" />
                                </TouchableOpacity>

                                {/* City Search Modal */}
                                <Modal
                                    visible={showCityPicker}
                                    animationType="slide"
                                    transparent={true}
                                    onRequestClose={() => setShowCityPicker(false)}
                                >
                                    <View style={styles.modalContainer}>
                                        <View style={styles.modalContent}>
                                            <View style={styles.modalHeader}>
                                                <Text style={styles.modalTitle}>Choisir une ville</Text>
                                                <TouchableOpacity onPress={() => setShowCityPicker(false)}>
                                                    <Ionicons name="close" size={24} color="#1E293B" />
                                                </TouchableOpacity>
                                            </View>

                                            {/* Search Input */}
                                            <View style={styles.searchContainer}>
                                                <Ionicons name="search" size={20} color="#94A3B8" style={{ marginRight: 8 }} />
                                                <TextInput
                                                    placeholder="Rechercher une ville..."
                                                    value={searchText}
                                                    onChangeText={setSearchText}
                                                    style={styles.searchInput}
                                                    placeholderTextColor="#94A3B8"
                                                    autoFocus
                                                />
                                            </View>

                                            {/* City List */}
                                            <FlatList
                                                data={CITIES.filter(c => c.toLowerCase().includes(searchText.toLowerCase()))}
                                                keyExtractor={item => item}
                                                renderItem={({ item }) => (
                                                    <TouchableOpacity
                                                        style={[styles.cityOption, city === item && styles.cityOptionActive]}
                                                        onPress={() => {
                                                            setCity(item);
                                                            setShowCityPicker(false);
                                                        }}
                                                    >
                                                        <Text style={[styles.cityText, city === item && styles.cityTextActive]}>
                                                            {item}
                                                        </Text>
                                                        {city === item && (
                                                            <Ionicons name="checkmark" size={20} color="#0EA5E9" />
                                                        )}
                                                    </TouchableOpacity>
                                                )}
                                                showsVerticalScrollIndicator={false}
                                                ListEmptyComponent={
                                                    <Text style={{ textAlign: 'center', marginTop: 20, color: '#94A3B8' }}>
                                                        Aucune ville trouvée
                                                    </Text>
                                                }
                                            />
                                        </View>
                                    </View>
                                </Modal>
                            </>
                        )}

                        <InputField
                            icon="mail-outline"
                            placeholder="Email"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            showPassword={showPassword}
                            setShowPassword={setShowPassword}
                        />

                        <InputField
                            icon="lock-closed-outline"
                            placeholder="Mot de passe"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            showPassword={showPassword}
                            setShowPassword={setShowPassword}
                        />

                        {/* Submit Button */}
                        <TouchableOpacity
                            onPress={isLogin ? handleLogin : handleRegister}
                            disabled={loading}
                            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={styles.submitText}>
                                    {isLogin ? 'Se connecter' : 'Créer mon compte'}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Footer */}
                    <Text style={styles.footerText}>
                        {isLogin ? 'Pas encore de compte ? ' : 'Déjà un compte ? '}
                        <Text
                            style={styles.footerLink}
                            onPress={() => { setIsLogin(!isLogin); setError(''); }}
                        >
                            {isLogin ? "S'inscrire" : 'Se connecter'}
                        </Text>
                    </Text>

                    {/* 🛠️ DEBUG ONLY: Reset Onboarding */}
                    <TouchableOpacity
                        onPress={async () => {
                            await AsyncStorage.removeItem('driver_onboarding_seen');
                            alert('Onboarding réinitialisé ! Rechargez l\'app.');
                            navigation.replace('Splash');
                        }}
                        style={{ marginTop: 20, alignItems: 'center' }}
                    >
                        <Text style={{ color: '#CBD5E1', fontSize: 10 }}>↺ Reset Onboarding</Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = {
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    scrollContent: {
        flexGrow: 1,
        padding: 24,
        justifyContent: 'center',
    },
    headerSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    logoCircle: {
        width: 90,
        height: 90,
        backgroundColor: '#0EA5E9',
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#0EA5E9',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 10,
    },
    logoEmoji: {
        fontSize: 44,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#0EA5E9',
        letterSpacing: 1,
    },
    subtitle: {
        color: '#64748B',
        marginTop: 8,
        fontSize: 15,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#F1F5F9',
        borderRadius: 16,
        padding: 4,
        marginBottom: 24,
    },
    tab: {
        flex: 1,
        paddingVertical: 14,
        alignItems: 'center',
        borderRadius: 12,
    },
    tabActive: {
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    tabText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#64748B',
    },
    tabTextActive: {
        color: '#0EA5E9',
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF2F2',
        padding: 14,
        borderRadius: 12,
        marginBottom: 16,
    },
    errorText: {
        color: '#EF4444',
        marginLeft: 8,
        flex: 1,
    },
    formContainer: {
        marginBottom: 24,
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
    cityOption: {
        paddingVertical: 16,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cityOptionActive: {
        backgroundColor: '#F0F9FF',
        borderRadius: 8,
    },
    cityText: {
        fontSize: 15,
        color: '#1E293B',
    },
    cityTextActive: {
        color: '#0EA5E9',
        fontWeight: '700',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        height: '80%', // Takes up 80% of screen
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 16,
    },
    searchInput: {
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
    footerText: {
        textAlign: 'center',
        color: '#64748B',
        fontSize: 14,
    },
    footerLink: {
        color: '#0EA5E9',
        fontWeight: '600',
    },
};

export default LoginScreen;
