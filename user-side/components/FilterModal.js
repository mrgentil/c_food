import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, Switch } from 'react-native';
import { XMarkIcon, AdjustmentsHorizontalIcon, StarIcon, ClockIcon, CurrencyDollarIcon } from 'react-native-heroicons/outline';
import * as Animatable from 'react-native-animatable';

const FilterModal = ({ visible, onClose, onApplyFilters, initialFilters }) => {
    // Sort Options
    const sortOptions = [
        { id: 'recommended', label: 'Recommandé', icon: <StarIcon size={16} color="#4B5563" /> },
        { id: 'rating', label: 'Mieux notés', icon: <StarIcon size={16} color="#F59E0B" /> },
        { id: 'deliveryTime', label: 'Livraison rapide', icon: <ClockIcon size={16} color="#10B981" /> },
        { id: 'cost_low_high', label: 'Prix croissant', icon: <CurrencyDollarIcon size={16} color="#4B5563" /> },
    ];

    // Price Range Options
    const priceOptions = [
        { id: '$', label: '$' },
        { id: '$$', label: '$$' },
        { id: '$$$', label: '$$$' },
        { id: '$$$$', label: '$$$$' },
    ];

    // Dietary Options
    const dietaryOptions = [
        { id: 'vegetarian', label: 'Végétarien 🥗' },
        { id: 'vegan', label: 'Végan 🌱' },
        { id: 'gluten_free', label: 'Sans Gluten 🌾' },
        { id: 'halal', label: 'Halal 🍖' },
    ];

    // State
    const [sortBy, setSortBy] = useState('recommended');
    const [selectedPrices, setSelectedPrices] = useState([]);
    const [selectedDietary, setSelectedDietary] = useState([]);

    // Initialize from props
    useEffect(() => {
        if (initialFilters) {
            if (initialFilters.sortBy) setSortBy(initialFilters.sortBy);
            if (initialFilters.prices) setSelectedPrices(initialFilters.prices);
            if (initialFilters.dietary) setSelectedDietary(initialFilters.dietary);
        }
    }, [initialFilters, visible]);

    // Helpers
    const togglePrice = (price) => {
        if (selectedPrices.includes(price)) {
            setSelectedPrices(selectedPrices.filter(p => p !== price));
        } else {
            setSelectedPrices([...selectedPrices, price]);
        }
    };

    const toggleDietary = (diet) => {
        if (selectedDietary.includes(diet)) {
            setSelectedDietary(selectedDietary.filter(d => d !== diet));
        } else {
            setSelectedDietary([...selectedDietary, diet]);
        }
    };

    const clearFilters = () => {
        setSortBy('recommended');
        setSelectedPrices([]);
        setSelectedDietary([]);
    };

    const handleApply = () => {
        onApplyFilters({
            sortBy,
            prices: selectedPrices,
            dietary: selectedDietary
        });
        onClose();
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View className="flex-1 justify-end bg-black/50">
                <TouchableOpacity style={{ flex: 1 }} onPress={onClose} />

                <Animatable.View
                    animation="slideInUp"
                    duration={300}
                    className="bg-white rounded-t-3xl h-[85%] w-full shadow-2xl relative"
                >
                    {/* Handle Bar */}
                    <View className="items-center pt-3 pb-2">
                        <View className="w-12 h-1.5 bg-gray-300 rounded-full" />
                    </View>

                    {/* Header */}
                    <View className="px-5 py-3 flex-row justify-between items-center border-b border-gray-100">
                        <Text className="text-xl font-extrabold text-gray-900">Filtres</Text>
                        <TouchableOpacity onPress={onClose} className="bg-gray-100 p-2 rounded-full">
                            <XMarkIcon size={24} color="#374151" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false}>

                        {/* Sort Section */}
                        <View className="mb-6">
                            <Text className="font-bold text-gray-800 text-lg mb-3">Trier par</Text>
                            <View className="flex-row flex-wrap gap-2">
                                {sortOptions.map((option) => (
                                    <TouchableOpacity
                                        key={option.id}
                                        onPress={() => setSortBy(option.id)}
                                        className={`flex-row items-center px-4 py-2.5 rounded-xl border ${sortBy === option.id
                                                ? 'bg-[#0EA5E9]/10 border-[#0EA5E9]'
                                                : 'bg-white border-gray-200'
                                            }`}
                                    >
                                        {sortBy === option.id ? React.cloneElement(option.icon, { color: '#0EA5E9' }) : option.icon}
                                        <Text className={`ml-2 font-semibold ${sortBy === option.id ? 'text-[#0EA5E9]' : 'text-gray-600'
                                            }`}>
                                            {option.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View className="h-[1px] bg-gray-100 mb-6" />

                        {/* Price Range Section */}
                        <View className="mb-6">
                            <Text className="font-bold text-gray-800 text-lg mb-3">Prix</Text>
                            <View className="flex-row gap-3">
                                {priceOptions.map((option) => (
                                    <TouchableOpacity
                                        key={option.id}
                                        onPress={() => togglePrice(option.id)}
                                        className={`flex-1 items-center justify-center py-3 rounded-xl border ${selectedPrices.includes(option.id)
                                                ? 'bg-[#0EA5E9] border-[#0EA5E9]'
                                                : 'bg-white border-gray-200'
                                            }`}
                                    >
                                        <Text className={`font-bold text-lg ${selectedPrices.includes(option.id) ? 'text-white' : 'text-gray-600'
                                            }`}>
                                            {option.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View className="h-[1px] bg-gray-100 mb-6" />

                        {/* Dietary Section */}
                        <View className="mb-8">
                            <Text className="font-bold text-gray-800 text-lg mb-3">Diététique</Text>
                            <View className="flex-row flex-wrap gap-2">
                                {dietaryOptions.map((option) => (
                                    <TouchableOpacity
                                        key={option.id}
                                        onPress={() => toggleDietary(option.id)}
                                        className={`px-4 py-2.5 rounded-xl border ${selectedDietary.includes(option.id)
                                                ? 'bg-[#10B981]/10 border-[#10B981]'
                                                : 'bg-white border-gray-200'
                                            }`}
                                    >
                                        <Text className={`font-semibold ${selectedDietary.includes(option.id) ? 'text-[#10B981]' : 'text-gray-600'
                                            }`}>
                                            {option.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                    </ScrollView>

                    {/* Footer Actions */}
                    <View className="p-5 border-t border-gray-100 bg-white">
                        <View className="flex-row gap-4">
                            <TouchableOpacity
                                onPress={clearFilters}
                                className="flex-1 py-4 bg-gray-100 rounded-2xl items-center"
                            >
                                <Text className="font-bold text-gray-600 text-lg">Réinitialiser</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={handleApply}
                                className="flex-[2] py-4 bg-[#0EA5E9] rounded-2xl items-center shadow-lg shadow-blue-200"
                            >
                                <Text className="font-bold text-white text-lg">Appliquer</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                </Animatable.View>
            </View>
        </Modal>
    );
};

export default FilterModal;
