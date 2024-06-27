import React, { useState } from 'react';
import ImageUpload from './components/ImageUpload';
import ImageViewer from './components/ImageViewer';
import './App.css'
function App() {

    return (
        <div className={'image-wrapper'}>
            <ImageUpload />
        </div>
    );
}

export default App;
