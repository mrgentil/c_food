import { useState } from 'react';

const ImageWithFallback = ({ src, alt, className, fallback }) => {
    const [error, setError] = useState(false);

    if (!src || error) {
        return fallback;
    }

    return (
        <img
            src={src}
            alt={alt}
            className={className}
            onError={() => setError(true)}
        />
    );
};

export default ImageWithFallback;
