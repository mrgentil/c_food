import React from 'react';
import { View } from 'react-native';
import * as Animatable from 'react-native-animatable';

const Skeleton = ({ width, height, style, borderRadius = 8 }) => {
    return (
        <Animatable.View
            animation="flash"
            iterationCount="infinite"
            duration={1500}
            style={[
                {
                    width: width,
                    height: height,
                    backgroundColor: '#E5E7EB', // gray-200
                    borderRadius: borderRadius,
                },
                style,
            ]}
            useNativeDriver
        />
    );
};

export default Skeleton;
