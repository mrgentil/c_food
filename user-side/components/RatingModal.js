import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, Alert } from 'react-native';
import { XMarkIcon, StarIcon } from 'react-native-heroicons/solid';
import { StarIcon as StarOutlineIcon } from 'react-native-heroicons/outline';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { UserAuth } from '../contexts/AuthContext';

const RatingModal = ({ visible, onClose, restaurant, order }) => {
    const { user } = UserAuth();
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (rating === 0) {
            Alert.alert('Note requise', 'Veuillez sélectionner au moins une étoile');
            return;
        }

        setSubmitting(true);
        try {
            // Check if already rated
            const ratingsRef = collection(db, 'ratings');
            const q = query(
                ratingsRef,
                where('userId', '==', user.uid),
                where('orderId', '==', order.id)
            );
            const existingRatings = await getDocs(q);

            if (!existingRatings.empty) {
                Alert.alert('Déjà noté', 'Vous avez déjà noté cette commande');
                setSubmitting(false);
                return;
            }

            // Submit rating
            await addDoc(ratingsRef, {
                userId: user.uid,
                userName: `${order.userFirstName} ${order.userLastName}`,
                restaurantId: restaurant.id,
                restaurantName: restaurant.name,
                orderId: order.id,
                rating: rating,
                comment: comment.trim(),
                createdAt: serverTimestamp(),
            });

            Alert.alert('Merci ! 🎉', 'Votre avis a été enregistré avec succès');

            // Reset and close
            setRating(0);
            setComment('');
            onClose();
        } catch (error) {
            console.error('Error submitting rating:', error);
            Alert.alert('Erreur', 'Impossible d\'enregistrer votre avis : ' + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View className="flex-1 justify-end bg-black/50">
                <View className="bg-white rounded-t-3xl p-6 pb-8">
                    {/* Header */}
                    <View className="flex-row justify-between items-center mb-6">
                        <Text className="text-2xl font-extrabold text-gray-800">Notez votre expérience</Text>
                        <TouchableOpacity onPress={onClose} className="bg-gray-100 p-2 rounded-full">
                            <XMarkIcon size={24} color="#6B7280" />
                        </TouchableOpacity>
                    </View>

                    {/* Restaurant Name */}
                    <Text className="text-center text-gray-600 mb-4">{restaurant?.name}</Text>

                    {/* Stars */}
                    <View className="flex-row justify-center items-center space-x-3 mb-8">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <TouchableOpacity
                                key={star}
                                onPress={() => setRating(star)}
                                className="active:scale-110"
                            >
                                {star <= rating ? (
                                    <StarIcon size={48} color="#FBBF24" />
                                ) : (
                                    <StarOutlineIcon size={48} color="#D1D5DB" />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Rating Text */}
                    {rating > 0 && (
                        <Text className="text-center text-gray-500 mb-6">
                            {rating === 5 && '🤩 Excellent !'}
                            {rating === 4 && '😊 Très bien !'}
                            {rating === 3 && '😐 Correct'}
                            {rating === 2 && '😕 Décevant'}
                            {rating === 1 && '😞 Très mauvais'}
                        </Text>
                    )}

                    {/* Comment */}
                    <View className="mb-6">
                        <Text className="text-gray-700 font-bold mb-2">Commentaire (optionnel)</Text>
                        <TextInput
                            className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-gray-800 min-h-24"
                            value={comment}
                            onChangeText={setComment}
                            placeholder="Partagez votre expérience..."
                            placeholderTextColor="#9CA3AF"
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity
                        onPress={handleSubmit}
                        disabled={submitting || rating === 0}
                        className={`py-4 rounded-2xl ${submitting || rating === 0 ? 'bg-gray-300' : 'bg-sky-500 active:bg-sky-600'
                            }`}
                    >
                        <Text className="text-center text-white font-extrabold text-lg">
                            {submitting ? 'Envoi...' : 'Envoyer mon avis'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

export default RatingModal;
