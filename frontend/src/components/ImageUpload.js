import React, { useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { Empty, Spin } from 'antd';
import Cropper from 'react-easy-crop';
import 'react-easy-crop/react-easy-crop.css';
import './ImageUpload.css';
import ImageViewer from './ImageViewer';
import { useRecoilState } from 'recoil';
import { transformedImageUrlState } from '../state/state';

function ImageUpload() {
    const [file, setFile] = useState(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [isInputDisabled, setIsInputDisabled] = useState(false); // Added state for disabling input
    const fileInputRef = useRef(null);
    const [transformedUrl, setTransformedUrl] = useRecoilState(transformedImageUrlState);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [croppedImageUrl, setCroppedImageUrl] = useState(null);

    const handleFileChange = (event) => {
        const reader = new FileReader();
        const file = event.target.files[0];

        if (file && (file.type !== 'image/png' || file.size > 4 * 1024 * 1024)) {
            alert('Only PNG files under 4MB are allowed.');
            if (fileInputRef.current) {
                fileInputRef.current.value = null;
            }
            return;
        }

        reader.onloadend = () => {
            setFile(file);
            setImagePreviewUrl(reader.result);
            setIsInputDisabled(true); // Disable the input
        };

        if (file) {
            reader.readAsDataURL(file);
        } else {
            setImagePreviewUrl(null);
            setUploading(false);
        }
    };

    const handleClear = () => {
        setFile(null);
        setImagePreviewUrl(null);
        setUploading(false);
        setTransformedUrl(null);
        setCroppedAreaPixels(null);
        setCroppedImageUrl(null);
        setIsInputDisabled(false); // Enable the input
        if (fileInputRef.current) {
            fileInputRef.current.value = null;
        }
    };

    const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleCrop = async () => {
        if (!croppedAreaPixels) {
            alert('Invalid crop dimensions, please complete the crop.');
            return;
        }

        const canvas = document.createElement('canvas');
        const image = new Image();
        image.src = imagePreviewUrl;
        await new Promise(resolve => {
            image.onload = resolve;
        });

        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;
        canvas.width = croppedAreaPixels.width;
        canvas.height = croppedAreaPixels.height;
        const ctx = canvas.getContext('2d');

        ctx.drawImage(
            image,
            croppedAreaPixels.x * scaleX,
            croppedAreaPixels.y * scaleY,
            croppedAreaPixels.width * scaleX,
            croppedAreaPixels.height * scaleY,
            0,
            0,
            croppedAreaPixels.width,
            croppedAreaPixels.height
        );

        canvas.toBlob(blob => {
            const croppedImageUrl = URL.createObjectURL(blob);
            setCroppedImageUrl(croppedImageUrl);
        }, 'image/png');
    };

    const handleTransform = async () => {
        if (!croppedImageUrl) {
            alert('Please crop the image first.');
            return;
        }

        setUploading(true);

        try {
            const blob = await fetch(croppedImageUrl).then(res => res.blob());
            const formData = new FormData();
            formData.append('file', blob, 'cropped-image.png');

            const response = await axios.post('http://localhost:8000/transform-image', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });
            setTransformedUrl(response.data.url);
        } catch (error) {
            console.error('Error transforming image:', error);
            alert('Error transforming image, please try again.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="image-upload-container">
            <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} disabled={isInputDisabled} />
            <div className="image-preview" onClick={() => !isInputDisabled && fileInputRef.current.click()}>
                {!croppedImageUrl && imagePreviewUrl ? (
                    <div className="image-crop">
                        <div className="crop-container">
                            <Cropper
                                image={imagePreviewUrl}
                                crop={crop}
                                zoom={zoom}
                                aspect={1}
                                onCropChange={setCrop}
                                onZoomChange={setZoom}
                                onCropComplete={onCropComplete}
                            />
                            <button className="crop-button" onClick={handleCrop}>Crop</button>
                        </div>
                    </div>
                ) : croppedImageUrl ? (
                    <div className="image-wrapper">
                        <img src={croppedImageUrl} alt="Cropped" className="cropped-image" />
                        {uploading && <div className="loading-overlay"><Spin className="loading-spinner" /></div>}
                    </div>
                ) : (
                    <Empty description="No Image Uploaded" className="image-empty" />
                )}
            </div>
            <div className="button-container">
                <button className="clear-button" onClick={handleClear}>Clear</button>
                <button className="transform-button" onClick={handleTransform} disabled={!croppedImageUrl}>Transform</button>
            </div>
            <ImageViewer />
        </div>
    );
}

export default ImageUpload;
