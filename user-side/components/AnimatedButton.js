import React from 'react';
import { Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import * as Animatable from 'react-native-animatable';

const AnimatedButton = ({
    onPress,
    title,
    loading = false,
    variant = 'primary', // primary, secondary, danger
    containerStyle = '',
    textStyle = '',
    icon = null
}) => {

    // Base styles
    const baseContainer = "py-4 rounded-2xl flex-row justify-center items-center shadow-md active:scale-95 duration-200";
    const baseText = "font-bold text-lg text-center";

    // Variants
    const variants = {
        primary: {
            container: "bg-[#0EA5E9]",
            text: "text-white"
        },
        secondary: {
            container: "bg-white border border-gray-100",
            text: "text-gray-800"
        },
        danger: {
            container: "bg-red-50 border border-red-100",
            text: "text-red-600"
        },
        ghost: {
            container: "bg-transparent shadow-none",
            text: "text-[#0EA5E9]"
        }
    };

    const selectedVariant = variants[variant] || variants.primary;

    return (
        <Animatable.View animation="fadeIn" duration={800} useNativeDriver>
            <TouchableOpacity
                onPress={onPress}
                disabled={loading}
                className={`${baseContainer} ${selectedVariant.container} ${containerStyle} ${loading ? 'opacity-70' : ''}`}
            >
                {loading ? (
                    <ActivityIndicator color={variant === 'primary' ? 'white' : '#0EA5E9'} />
                ) : (
                    <>
                        {icon && icon}
                        <Text className={`${baseText} ${selectedVariant.text} ${textStyle} ${icon ? 'ml-2' : ''}`}>
                            {title}
                        </Text>
                    </>
                )}
            </TouchableOpacity>
        </Animatable.View>
    );
};

export default AnimatedButton;
