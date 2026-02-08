import { useState } from 'react';
import imageCompression from 'browser-image-compression';

// ==========================================
// 🔧 CLOUDINARY CONFIGURATION
// ==========================================
const CLOUDINARY_CLOUD_NAME = 'dul9gmbzj';
const CLOUDINARY_UPLOAD_PRESET = 'c_food';
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

const ImageUpload = ({ onUpload, initialValue, className }) => {
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState(initialValue || '');
    const [error, setError] = useState('');

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setUploading(true);
        setError('');

        try {
            console.log("🖼️ Start compression...");

            // 1. Compression Options
            const options = {
                maxSizeMB: 0.5,
                maxWidthOrHeight: 800,
                useWebWorker: false
            };

            // 2. Compress the image
            const compressedFile = await imageCompression(file, options);
            console.log("✅ Compression done. Size:", (compressedFile.size / 1024).toFixed(2), "KB");

            // 3. Prepare FormData for Cloudinary
            const formData = new FormData();
            formData.append('file', compressedFile);
            formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
            formData.append('folder', 'food-delivery');

            console.log("☁️ Starting Cloudinary upload...");

            // 4. Upload to Cloudinary
            const response = await fetch(CLOUDINARY_UPLOAD_URL, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || 'Upload failed');
            }

            const data = await response.json();
            console.log("✅ Upload done! URL:", data.secure_url);

            // 5. Update State & Parent
            setPreview(data.secure_url);
            onUpload(data.secure_url);

        } catch (err) {
            console.error("❌ Upload error:", err);
            let msg = "Erreur lors de l'upload.";
            if (err.message.includes('preset')) {
                msg = "Erreur: Upload preset 'food-delivery' non trouvé. Créez-le dans Cloudinary Settings > Upload.";
            }
            setError(`${msg} (${err.message})`);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className={`flex flex-col gap-3 ${className}`}>
            {/* Preview Area */}
            <div className="relative w-full h-48 bg-[#F4F7FE] rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden group hover:border-[#4318FF] transition-colors">
                {preview ? (
                    <img src={preview} alt="Aperçu" className="w-full h-full object-cover" />
                ) : (
                    <div className="flex flex-col items-center text-gray-400">
                        <span className="material-symbols-outlined text-4xl mb-2">cloud_upload</span>
                        <span className="text-sm font-medium">Cliquez pour ajouter une image</span>
                    </div>
                )}

                {/* Overlay with Spinner or Text */}
                <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${uploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    {uploading ? (
                        <div className="h-8 w-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        <span className="text-white font-bold text-sm bg-black/50 px-3 py-1 rounded-full">Modifier</span>
                    )}
                </div>

                {/* Hidden File Input */}
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={uploading}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />
            </div>

            {/* Error Message */}
            {error && <p className="text-red-500 text-xs font-bold text-center">{error}</p>}
        </div>
    );
};

export default ImageUpload;
