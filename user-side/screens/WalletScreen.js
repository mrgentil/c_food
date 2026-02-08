import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, TextInput, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeftIcon, PlusIcon, ArrowDownTrayIcon, ArrowUpTrayIcon, XMarkIcon } from 'react-native-heroicons/outline';
import { useNavigation } from '@react-navigation/native';
import PaymentModal from '../components/PaymentModal';
import { UserAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, onSnapshot, collection, query, where, orderBy, addDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';

const WalletScreen = () => {
    const navigation = useNavigation();
    const { user } = UserAuth();
    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState([]);

    // Top Up State
    const [showAmountModal, setShowAmountModal] = useState(false);
    const [topUpAmount, setTopUpAmount] = useState('');
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedOperator, setSelectedOperator] = useState(null);

    useEffect(() => {
        if (!user?.uid) return;

        // 1. Listen to User Balance
        const unsubUser = onSnapshot(doc(db, 'user', user.uid), (doc) => {
            setBalance(doc.data()?.walletBalance || 0);
        });

        // 2. Listen to Wallet Transactions
        const q = query(
            collection(db, 'transactions'),
            where('userId', '==', user.uid),
            orderBy('createdAt', 'desc')
        );

        const unsubTrans = onSnapshot(q, (snapshot) => {
            setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        return () => {
            unsubUser();
            unsubTrans();
        };
    }, [user]);

    const handleTopUpRequest = () => {
        setTopUpAmount('');
        setShowAmountModal(true);
    };

    const confirmAmountAndPaper = () => {
        if (!topUpAmount || isNaN(topUpAmount) || Number(topUpAmount) <= 0) {
            Alert.alert('Erreur', 'Veuillez entrer un montant valide.');
            return;
        }
        setShowAmountModal(false);
        Alert.alert(
            "Choisir méthode",
            "Comment voulez-vous recharger ?",
            [
                { text: "Airtel Money", onPress: () => launchPayment('airtel') },
                { text: "M-Pesa", onPress: () => launchPayment('mpesa') },
                { text: "Orange Money", onPress: () => launchPayment('orange') },
                { text: "Visa / MasterCard", onPress: () => launchPayment('visa') },
                { text: "Annuler", style: "cancel" }
            ]
        );
    };

    const launchPayment = (operator) => {
        setSelectedOperator(operator);
        setShowPaymentModal(true);
    };

    const handlePaymentSuccess = async (paymentDetails) => {
        try {
            const amount = Number(topUpAmount);

            // 1. Record Transaction
            await addDoc(collection(db, 'transactions'), {
                userId: user.uid,
                type: 'credit', // 'credit' = deposit, 'debit' = spend
                amount: amount,
                method: paymentDetails.operator,
                reference: paymentDetails.transactionRef,
                description: 'Rechargement Portefeuille',
                createdAt: serverTimestamp()
            });

            // 2. Update User Balance
            await updateDoc(doc(db, 'user', user.uid), {
                walletBalance: increment(amount)
            });

            setShowPaymentModal(false);
            Alert.alert('Succès', 'Votre portefeuille a été rechargé avec succès !');

        } catch (error) {
            console.error("TopUp Error:", error);
            Alert.alert("Erreur", "Le rechargement a échoué côté serveur.");
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('fr-CD', {
            minimumFractionDigits: 0,
        }).format(price) + ' CDF';
    };

    return (
        <View className="flex-1 bg-gray-50">
            <StatusBar style="dark" />
            <SafeAreaView className="flex-1">
                {/* Header */}
                <View className="flex-row items-center justify-between px-4 py-4">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 bg-white rounded-full shadow-sm">
                        <ArrowLeftIcon size={20} color="black" />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold text-gray-800">Mon Portefeuille</Text>
                    <View className="w-10" />
                </View>

                <ScrollView className="px-4 pt-4">
                    {/* Balance Card */}
                    <View className="bg-[#10B981] p-6 rounded-3xl shadow-lg mb-6">
                        <Text className="text-white/80 font-medium mb-1">Solde disponible</Text>
                        <Text className="text-white text-4xl font-bold mb-6">{formatPrice(balance)}</Text>

                        <View className="flex-row space-x-4">
                            <TouchableOpacity
                                onPress={handleTopUpRequest}
                                className="flex-1 bg-white/20 py-3 rounded-xl flex-row items-center justify-center space-x-2 active:bg-white/30"
                            >
                                <PlusIcon size={20} color="white" />
                                <Text className="text-white font-bold">Recharger</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => Alert.alert('Retrait', 'Le retrait vers Mobile Money sera bientôt disponible.')}
                                className="flex-1 bg-white/20 py-3 rounded-xl flex-row items-center justify-center space-x-2 active:bg-white/30"
                            >
                                <ArrowUpTrayIcon size={20} color="white" />
                                <Text className="text-white font-bold">Retirer</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Transaction History */}
                    <Text className="text-lg font-bold text-gray-800 mb-4">Historique</Text>

                    {transactions.length === 0 ? (
                        <View className="bg-white rounded-2xl p-8 items-center justify-center border border-gray-100 mb-20">
                            <View className="bg-gray-100 p-4 rounded-full mb-4">
                                <ArrowDownTrayIcon size={32} color="#9CA3AF" />
                            </View>
                            <Text className="text-gray-500 font-medium text-center">Aucune transaction pour le moment.</Text>
                        </View>
                    ) : (
                        <View className="pb-20">
                            {transactions.map((tx) => (
                                <View key={tx.id} className="bg-white p-4 mb-2 rounded-xl flex-row justify-between items-center shadow-sm">
                                    <View>
                                        <Text className="font-bold text-gray-800">{tx.description}</Text>
                                        <Text className="text-xs text-gray-500">{tx.method} • {new Date(tx.createdAt?.seconds * 1000).toLocaleDateString()}</Text>
                                    </View>
                                    <Text className={`font-bold ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                                        {tx.type === 'credit' ? '+' : '-'}{formatPrice(tx.amount)}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    )}
                </ScrollView>

                {/* Amount Input Modal */}
                <Modal
                    visible={showAmountModal}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setShowAmountModal(false)}
                >
                    <View className="flex-1 bg-black/50 justify-center items-center px-4">
                        <View className="bg-white w-full max-w-sm rounded-2xl p-6">
                            <View className="flex-row justify-between items-center mb-4">
                                <Text className="text-xl font-bold text-gray-800">Recharger</Text>
                                <TouchableOpacity onPress={() => setShowAmountModal(false)}>
                                    <XMarkIcon size={24} color="#9CA3AF" />
                                </TouchableOpacity>
                            </View>

                            <Text className="text-gray-500 mb-2">Montant à ajouter (FC)</Text>
                            <TextInput
                                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xl font-bold mb-6 text-center"
                                placeholder="ex: 5000"
                                keyboardType="numeric"
                                value={topUpAmount}
                                onChangeText={setTopUpAmount}
                                autoFocus
                            />

                            <TouchableOpacity
                                onPress={confirmAmountAndPaper}
                                className="bg-[#10B981] py-3 rounded-xl items-center"
                            >
                                <Text className="text-white font-bold text-lg">Continuer</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                {/* Payment Processor Modal */}
                <PaymentModal
                    visible={showPaymentModal}
                    onClose={() => setShowPaymentModal(false)}
                    operator={selectedOperator || 'airtel'}
                    amount={Number(topUpAmount)} // Pass the amount
                    onSubmit={handlePaymentSuccess}
                />

            </SafeAreaView>
        </View>
    );
};

export default WalletScreen;
