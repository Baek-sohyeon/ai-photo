import React from 'react';
import { useRecoilValue } from 'recoil';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload } from '@fortawesome/free-solid-svg-icons';
import './ImageUpload.css';
import {transformedImageUrlState} from "../state/state";
import {Empty} from "antd";

function ImageViewer() {
    const transformedUrl =  useRecoilValue(transformedImageUrlState);

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = transformedUrl;
        link.download = 'transformed-image.png'; // 파일 이름 지정
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="image-viewer-container">
            {transformedUrl ? (
                <div className="image-viewer">
                    <h3>Transformed Image</h3>
                    <div className="image-wrapper">
                        <img src={transformedUrl} alt="Transformed" className="transformed-image" />
                        <button onClick={handleDownload} className="download-button">
                            <FontAwesomeIcon icon={faDownload} /> Download
                        </button>
                    </div>
                </div>
            ) : (
                <Empty description="No Image Available" className="image-empty" />
            )}
        </div>
    );
}

export default ImageViewer;
