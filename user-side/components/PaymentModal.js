import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, Image, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';

import { XMarkIcon, ShieldCheckIcon, ClockIcon } from 'react-native-heroicons/outline';
import { initiatePayment, checkPaymentStatus } from '../api/shwary';

const PaymentModal = ({ visible, onClose, operator, amount, onSubmit, defaultPhone }) => {
    const [phoneNumber, setPhoneNumber] = useState(defaultPhone || '');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('idle'); // idle, processing, success, error, waiting_confirmation
    const [showManualButton, setShowManualButton] = useState(false);

    // Card State
    const [cardNumber, setCardNumber] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvc, setCvc] = useState('');

    // Update phone number when modal opens
    useEffect(() => {
        if (visible) {
            if (defaultPhone) setPhoneNumber(defaultPhone);
            setShowManualButton(false);
        }
    }, [visible, defaultPhone]);

    // Timer to show manual button if polling takes too long
    useEffect(() => {
        let timer;
        if (status === 'waiting_confirmation') {
            timer = setTimeout(() => {
                setShowManualButton(true);
            }, 15000); // Show button after 15 seconds
        } else {
            setShowManualButton(false);
        }
        return () => clearTimeout(timer);
    }, [status]);

    const operatorInfo = {
        airtel: {
            name: 'Airtel Money',
            color: '#E31E24',
            logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/Airtel_logo.svg/2560px-Airtel_logo.svg.png',
        },
        mpesa: {
            name: 'M-Pesa',
            color: '#00A651',
            logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/M-PESA_LOGO-01.svg/2560px-M-PESA_LOGO-01.svg.png',
        },
        orange: {
            name: 'Orange Money',
            color: '#FF6B00',
            logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Orange_logo.svg/2560px-Orange_logo.svg.png',
        },
        visa: {
            name: 'Visa / MasterCard',
            color: '#1A1F71',
            logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/2560px-Visa_Inc._logo.svg.png',
        }
    };

    const info = operatorInfo[operator] || operatorInfo['airtel'];

    const formatPrice = (price) => {
        return new Intl.NumberFormat('fr-CD', {
            minimumFractionDigits: 0,
        }).format(price) + ' CDF';
    };

    const handlePayment = async () => {
        if (operator === 'visa') {
            if (!cardNumber || !expiry || !cvc) {
                Alert.alert('Erreur', 'Veuillez remplir tous les champs de la carte');
                return;
            }
            setLoading(true);
            setStatus('processing');

            // Simulate Card Processing
            setTimeout(() => {
                finalizeSuccess({
                    id: 'card-' + Date.now(),
                    status: 'completed',
                    paymentVerificationStatus: 'paid'
                });
            }, 3000);
            return;
        }

        if (!phoneNumber.trim()) {
            Alert.alert('Erreur', 'Veuillez entrer votre numéro de téléphone');
            return;
        }

        // Simple format check (ensure it starts with +243 or 0)
        let formattedPhone = phoneNumber.trim();
        if (formattedPhone.startsWith('0')) {
            formattedPhone = '+243' + formattedPhone.substring(1);
        } else if (!formattedPhone.startsWith('+')) {
            formattedPhone = '+243' + formattedPhone;
        }

        setLoading(true);
        setStatus('processing');

        try {
            // 📞 1. Appel API Shwary (Initier le paiement)
            const result = await initiatePayment(formattedPhone, amount);

            if (result.status === 'completed') {
                finalizeSuccess(result);
            } else {
                setStatus('waiting_confirmation');
                startPolling(result.id);
            }

        } catch (error) {
            setLoading(false);
            setStatus('error');
            Alert.alert('Échec du lancement', error.message);
        }
    };

    // Use a ref to track active state across closures (timeout/interval)
    const activeRef = useRef(true);

    // Reset ref when modal opens/closes
    useEffect(() => {
        if (visible) {
            activeRef.current = true;
        } else {
            activeRef.current = false;
        }
    }, [visible]);

    const startPolling = async (transactionId) => {
        activeRef.current = true;

        const pollInterval = setInterval(async () => {
            if (!activeRef.current) {
                clearInterval(pollInterval);
                return;
            }

            try {
                const txData = await checkPaymentStatus(transactionId);

                if (txData.status === 'completed') {
                    clearInterval(pollInterval);
                    activeRef.current = false;
                    finalizeSuccess(txData);
                } else if (txData.status === 'failed') {
                    clearInterval(pollInterval);
                    activeRef.current = false;
                    setLoading(false);
                    setStatus('error');
                    Alert.alert('Paiement échoué', txData.failureReason || 'La transaction a été annulée ou a échoué.');
                }
            } catch (error) {
                const errorMsg = error.message || '';
                if (errorMsg.includes('401') || errorMsg.includes('Unauthorized')) {
                    clearInterval(pollInterval);
                    activeRef.current = false; // Disable global timeout
                    console.warn("⚠️ Deployment Issue: Status API blocked. Falling back to manual confirmation.");
                    setStatus('waiting_confirmation');
                    setShowManualButton(true);
                } else {
                    console.log('Polling check failed, retrying...');
                }
            }
        }, 4000); // Check every 4 seconds

        setTimeout(() => {
            clearInterval(pollInterval);
            if (activeRef.current && status !== 'success') {
                activeRef.current = false;
                setLoading(false);
                setStatus('error');
                Alert.alert('Délai dépassé', 'Nous n\'avons pas reçu la confirmation à temps. Vérifiez votre solde.');
            }
        }, 60000);
    };

    const finalizeSuccess = (txData) => {
        setStatus('success');
        setTimeout(async () => {
            await onSubmit({
                operator: info.name,
                phoneNumber: operator === 'visa' ? 'Card **** ' + cardNumber.slice(-4) : phoneNumber,
                transactionRef: txData.id,
                amount: amount,
                fullResponse: txData
            });
            setLoading(false);
            setStatus('idle');
            setPhoneNumber('');
            setCardNumber('');
            setExpiry('');
            setCvc('');
        }, 2000);
    };

    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={() => !loading && onClose()}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className="flex-1"
            >
                <View className="flex-1 justify-end bg-black/50">
                    <View className="bg-white rounded-t-3xl p-6 pb-8 h-auto">

                        {/* Header */}
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-2xl font-extrabold text-gray-800">Paiement Sécurisé</Text>
                            {!loading || status === 'waiting_confirmation' ? (
                                <TouchableOpacity onPress={onClose} className="bg-gray-100 p-2 rounded-full">
                                    <XMarkIcon size={24} color="#6B7280" />
                                </TouchableOpacity>
                            ) : null}
                        </View>

                        {/* Content based on Status */}
                        {status === 'waiting_confirmation' ? (
                            <View className="items-center py-10">
                                <View className="bg-yellow-100 p-6 rounded-full mb-4">
                                    <ClockIcon size={64} color="#EAB308" />
                                </View>
                                <Text className="text-xl font-bold text-gray-900 mb-2 text-center">Vérifiez votre téléphone 📱</Text>
                                <Text className="text-gray-600 text-center px-4">
                                    Veuillez confirmer le paiement en entrant votre code PIN sur la demande qui s'affiche.
                                </Text>
                                <ActivityIndicator size="large" color="#EAB308" style={{ marginTop: 20, marginBottom: 20 }} />


                                {/* Manual Override - Appears if API Status check is blocked (401) or times out */}
                                {showManualButton && (
                                    <View className="w-full px-4 mt-4 bg-yellow-50 p-4 rounded-xl items-center">
                                        <Text className="text-xs text-center text-gray-500 mb-3">
                                            La validation automatique semble bloquée.
                                            Si vous avez validé le paiement sur votre téléphone, cliquez ci-dessous.
                                        </Text>
                                        <TouchableOpacity
                                            onPress={() => finalizeSuccess({
                                                id: 'manual-override',
                                                status: 'assumed_success',
                                                paymentVerificationStatus: 'manual_check' // Flag for backend/admin
                                            })}
                                            className="bg-yellow-500 py-3 px-6 rounded-xl w-full"
                                        >
                                            <Text className="text-white font-bold text-center">J'ai validé le paiement ✔️</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}

                                <TouchableOpacity
                                    onPress={() => {
                                        activeRef.current = false;
                                        setLoading(false);
                                        onClose();
                                    }}
                                    className="mt-4 py-2 px-4 rounded-full border border-gray-200"
                                >
                                    <Text className="text-gray-500 font-bold text-center">Annuler / Fermer</Text>
                                </TouchableOpacity>
                            </View>
                        ) : status === 'success' ? (
                            <View className="items-center py-10">
                                <View className="bg-green-100 p-6 rounded-full mb-4">
                                    <ShieldCheckIcon size={64} color="#00A651" />
                                </View>
                                <Text className="text-2xl font-bold text-gray-900 mb-2">Paiement Réussi !</Text>
                                <Text className="text-gray-500 text-center">Votre commande est en cours de création...</Text>
                            </View>
                        ) : (
                            <View>
                                {/* Operator Banner */}
                                <View className="flex-row items-center bg-gray-50 p-4 rounded-2xl mb-6 border border-gray-100">
                                    <Image
                                        source={{ uri: info.logo }}
                                        className="w-12 h-12 rounded-lg mr-4"
                                        resizeMode="contain"
                                    />
                                    <View>
                                        <Text className="text-gray-500 text-xs uppercase font-bold">Payer avec</Text>
                                        <Text className="text-xl font-bold text-gray-900">{info.name}</Text>
                                    </View>
                                </View>

                                {/* Amount Display */}
                                <View className="mb-6 items-center">
                                    <Text className="text-gray-400 text-xs uppercase font-bold tracking-widest mb-1">Montant Total</Text>
                                    <Text className="text-4xl font-black text-gray-900">{formatPrice(amount)}</Text>
                                </View>

                                {operator === 'visa' ? (
                                    /* Card Inputs */
                                    <View className="mb-6 space-y-4">
                                        <View>
                                            <Text className="text-gray-700 font-bold mb-2 ml-1">Numéro de carte</Text>
                                            <TextInput
                                                className="bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-gray-900 font-bold"
                                                value={cardNumber}
                                                onChangeText={setCardNumber}
                                                placeholder="0000 0000 0000 0000"
                                                placeholderTextColor="#9CA3AF"
                                                keyboardType="numeric"
                                                maxLength={19}
                                            />
                                        </View>
                                        <View className="flex-row space-x-4">
                                            <View className="flex-1">
                                                <Text className="text-gray-700 font-bold mb-2 ml-1">Expiration</Text>
                                                <TextInput
                                                    className="bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-gray-900 font-bold"
                                                    value={expiry}
                                                    onChangeText={setExpiry}
                                                    placeholder="MM/YY"
                                                    placeholderTextColor="#9CA3AF"
                                                    maxLength={5}
                                                />
                                            </View>
                                            <View className="flex-1">
                                                <Text className="text-gray-700 font-bold mb-2 ml-1">CVC</Text>
                                                <TextInput
                                                    className="bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-gray-900 font-bold"
                                                    value={cvc}
                                                    onChangeText={setCvc}
                                                    placeholder="123"
                                                    placeholderTextColor="#9CA3AF"
                                                    keyboardType="numeric"
                                                    maxLength={3}
                                                    secureTextEntry
                                                />
                                            </View>
                                        </View>
                                    </View>
                                ) : (
                                    /* Phone Input */
                                    <View className="mb-6">
                                        <Text className="text-gray-700 font-bold mb-2 ml-1">Numéro de téléphone</Text>
                                        <TextInput
                                            className="bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-gray-900 font-bold text-lg"
                                            style={{ color: '#111827' }} // Force text color to dark gray/black
                                            value={phoneNumber}
                                            onChangeText={setPhoneNumber}
                                            placeholder="Ex: 081 234 5678"
                                            placeholderTextColor="#9CA3AF"
                                            keyboardType="phone-pad"
                                            editable={!loading}
                                        />
                                        <Text className="text-xs text-gray-400 ml-4 mt-2">
                                            🔒 Une demande de paiement vous sera envoyée sur ce numéro.
                                        </Text>
                                    </View>
                                )}

                                {/* Action Button */}
                                <TouchableOpacity
                                    onPress={handlePayment}
                                    disabled={loading}
                                    className={`py-4 rounded-2xl shadow-lg flex-row justify-center items-center ${loading ? 'bg-gray-300' : ''}`}
                                    style={{ backgroundColor: loading ? '#D1D5DB' : info.color }}
                                >
                                    {loading && <ActivityIndicator color="white" className="mr-3" />}
                                    <Text className="text-center text-white font-extrabold text-lg">
                                        {loading ? 'Traitement...' : `Payer avec ${info.name}`}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

export default PaymentModal;
