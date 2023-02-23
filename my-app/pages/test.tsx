import * as faceapi from 'face-api.js';
import React, { useState } from 'react';
import styles from './test.module.scss'
import Image from 'next/image';

function SelfieVerification() {
    const [modelsLoaded, setModelsLoaded] = React.useState(false);
    const [captureVideo, setCaptureVideo] = React.useState(false);
    const [downloadLink, setDownloadLink] = React.useState('');
    const [recordingStarted, setRecordingStarted] = React.useState(false);
    const [showAction, setShowAction] = useState(false);
    const [action, setAction] = useState(0);
    const videoRef = React.useRef();
    const videoBlobArr = React.useRef([]); //blob array
    const recordTime = React.useRef(0);
    const timeoutId = React.useRef<any>(null);
    const cameraStreamRef = React.useRef<any>(); // storing live feed
    const videoHeight = 480;
    const videoWidth = 640;
    const canvasRef = React.useRef();
    const mediaRecRef = React.useRef<any>(); // storing recording

    // Loading Models and fetching them.
    React.useEffect(() => {
        const loadModels = async () => {
            const MODEL_URL = '/models/';
            Promise.all([faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL)]).then(
                () => setModelsLoaded(true)
            );
        };
        loadModels();
        setAction(getRandomInt(3));
    }, []);

    // Function to start webcam and show video
    const startVideo = () => {
        setCaptureVideo(true);
        navigator.mediaDevices
            .getUserMedia({ video: { width: 300 }, audio: false })
            .then(stream => {
                const video: any = videoRef.current;
                video.srcObject = stream;
                cameraStreamRef.current = stream;
                video.play();
            })
            .catch(err => {
                console.error('error:', err);
            });
    };

    // Function to start recording
    const startRecording = () => {
        setTimeout(() => {
            setShowAction(true);
        }, 1000)
        recordTime.current = 0;
        mediaRecRef.current = new MediaRecorder(cameraStreamRef.current, {
            mimeType: 'video/webm'
        });
        mediaRecRef.current.addEventListener('dataavailable', function (e: any) {
            if (recordTime.current === 10) {
                setRecordingStarted(false);
                console.log(
                    'final video',
                    URL.createObjectURL(
                        new Blob(videoBlobArr.current, { type: 'video/webm' })
                    )
                );
                setDownloadLink(
                    URL.createObjectURL(
                        new Blob(videoBlobArr.current, { type: 'video/webm' })
                    )
                );
                mediaRecRef.current.stop();
            }
            recordTime.current = recordTime.current + 1;
            console.log('DAAATA', e.data);
            videoBlobArr.current.push(e.data);
        });
        mediaRecRef.current.start(1000);
    };

    //Face detection
    const handleVideoOnPlay = () => {
        timeoutId.current = setInterval(async () => {
            if (canvasRef && canvasRef.current) {
                canvasRef.current.innerHTML = faceapi.createCanvas(
                    videoRef.current as any
                );
                const displaySize = {
                    width: videoWidth,
                    height: videoHeight
                };
                faceapi.matchDimensions(canvasRef.current, displaySize);
                const detections = await faceapi.detectAllFaces(
                    videoRef.current,
                    new faceapi.TinyFaceDetectorOptions()
                );
                console.log('detections', detections);
                if (detections.length > 0) {
                    startRecording();
                    setRecordingStarted(true);
                    clearInterval(timeoutId.current);
                }
                const resizedDetections = faceapi.resizeResults(
                    detections,
                    displaySize
                );
                canvasRef && canvasRef.current && canvasRef.current
                    .getContext('2d')
                    .clearRect(0, 0, videoWidth, videoHeight);
                canvasRef && canvasRef.current && faceapi.draw.drawDetections(canvasRef.current, resizedDetections);
            }
        }, 1000);
    };
    const closeWebcam = () => {
        videoRef.current.pause();
        videoRef.current.srcObject.getTracks()[0].stop();
        setCaptureVideo(false);
    };

    function getRandomInt(max: number) {
        return Math.floor(Math.random() * max);
    }


    return (
        <div className={`${styles.mainContainer}`}>
            <div>
                {downloadLink && <a href={downloadLink}>download</a>}
                <div className={`${styles.conatiner2}`}>
                    {captureVideo && modelsLoaded ? (
                        <button
                            onClick={closeWebcam}
                            className={`${styles.btn1}`}
                        >
                            Close Webcam
                        </button>) : (
                        <button
                            onClick={startVideo}
                            className={`${styles.btn2}`}
                        > Open Webcam
                        </button>)}
                </div>
                {captureVideo ? (
                    modelsLoaded ? (
                        
                            <div
                                className={`${styles.vdoParent}`}
                                style={{ border: recordingStarted ? "5px solid #41C66E" : "" }}
                            >
                                <video
                                    ref={videoRef}
                                    onPlay={handleVideoOnPlay}
                                    className={`${styles.vdo}`}
                                />
                                {/* <div style={{border: "2px solid red", height:"200px", width:"200px", position: "absolute"}}> 
                                <canvas ref={canvasRef} style={{ position: 'absolute', display: "none" }} />
                                </div> */}
                            </div>
                     ) : (<div>loading...</div>)
                ) : (
                    <></>
                    )}
            </div>
        </div>);
}
export default SelfieVerification;