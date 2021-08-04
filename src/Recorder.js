/** Reference:
 * https://www.webrtc-experiment.com/RecordRTC/simple-demos/
 * https://www.webrtc-experiment.com/RecordRTC/simple-demos/video-recording.html
 * https://github.com/muaz-khan/RecordRTC/blob/master/simple-demos/video-recording.html */

import React, { useEffect, useRef, useState } from 'react';
import RecordRTC from 'recordrtc';

const Recorder = (props) => {
    const [recorder, setRecorder] = useState(null); // RecordRTC instance
    const [camera, setCamera] = useState(null); // MediaStream
    const [permission, setPermission] = useState({ status: false, error: null });
    const [isRecorded, setRecorded] = useState(false); // Flag
    const [recordURL, setRecordURL] = useState(null);
    const [isReocrding, setRecording] = useState(false);
    const [facing, setFacing] = useState("user"); // "environment" or "user"
    const [isLoading, setLoading] = useState(true);
    const [streamStack, setStack] = useState([]);
    const [captureMode, setCapture] = useState("video"); // using props to set initial mode
    const [photoURL, setPhotoURL] = useState(null);
    const [canFlipCamera, setCanFlip] = useState(false);

    const [supportedConstratint, setSupportedConstraint] = useState(null);


    const [availCameras, setAvailCameras] = useState([]);
    const [currentCamIdx, setCurrentIdx] = useState(0);

    const streamedVideoRef = useRef(null);

    useEffect(() => {
        const initWrap = async () => {
            await checkAvailableCameras();
            await askPermission(facing);
        }

        initWrap();

    }, []);

    useEffect(() => {
        return () => {
            if (camera) {
                camera.getTracks().forEach(track => track.stop());
            }
            if (recordURL) {
                URL.revokeObjectURL(recordURL);
            }
            if (photoURL) {
                URL.revokeObjectURL(photoURL);
            }
        }
    }, []);

    // Lift up methods inside current component to its parent component
    const liftUpCallbacks = () => {

    }

    // Cehck available cameras
    const checkAvailableCameras = async () => {
        const tempStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        // const tempStack = [...streamStack, tempStream];
        // setStack(tempStack);
        tempStream.getTracks().forEach(track => { console.log(track); track.stop() });

        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((device) => { return device.kind == "videoinput" });

        let supported = navigator.mediaDevices.getSupportedConstraints();

        if (videoInputs.length > 1) {
            setCanFlip(true);
        }
        setAvailCameras(videoInputs);
        setSupportedConstraint(supported);
    }

    // Ask for the camera access permission
    const askPermission = async (facingMode, camId = null) => {
        if (camId) {
            const forceConstraints = {
                audio: true,
                video: {
                    deviceId: {
                        exact: camId
                    },
                    zoom: 1.0,
                }
            }

            navigator.mediaDevices.getUserMedia(forceConstraints)
                .then(handleSuccess)
                .catch(error => {
                    console.log(error);
                    setPermission({ status: false, error: error });
                    setLoading(false);
                });

            return;
        }

        const testConstraints = {
            audio: true,
            video: {
                facingMode: facingMode, // exact causes edge not working
                zoom: 1.0,

            }
        }

        navigator.mediaDevices.getUserMedia(testConstraints)
            .then(handleSuccess)
            .catch(error => {
                console.log(error);
                setPermission({ status: false, error: error });
                setLoading(false);
            });
    }


    // Set the initial properties for the video element
    const handleSuccess = (stream) => {
        if (!streamedVideoRef || !streamedVideoRef.current) {
            return;
        }
        streamedVideoRef.current.muted = true; // it could be set in in-line style, yet neat to write in here
        streamedVideoRef.current.volume = 0;
        streamedVideoRef.current.srcObject = stream; // set video to play current MediaStream

        const tempStack = [...streamStack, stream];

        setCamera(stream);
        setStack(tempStack);
        setPermission({ status: true, error: null });
        setLoading(false);
    }

    const stopVideoStream = () => {
        camera.getTracks().forEach(track => { if (track.kind === 'video') { track.stop() } });
        setCamera(null);
    }

    const stopMediaStream = () => {
        // camera.getTracks().forEach(track => {console.log(track); track.stop()});
        for (let stream of streamStack) {
            stream.getTracks().forEach(track => { console.log(track); track.stop() });
        }
        setCamera(null);
        setStack([]);
    }

    const iteratesAvailCameras = async () => {
        setLoading(true);

        setPermission({ status: false, error: null });

        stopMediaStream();

        console.log(availCameras);

        if (availCameras.length === currentCamIdx) {
            console.log(availCameras[0]);
            await askPermission("user", availCameras[0].deviceId);
            setCurrentIdx(0);
            return;
        }
        console.log(availCameras[currentCamIdx])
        await askPermission("user", availCameras[currentCamIdx].deviceId);
        setCurrentIdx(currentCamIdx + 1);

    }

    const toggleFacing = async () => {
        setLoading(true);

        // if (camera) {
        //     stopMediaStream();
        // }

        setPermission({ status: false, error: null });

        stopMediaStream();

        if (facing === "user") {
            await askPermission("environment");
            // add to check if its successful
            setFacing("environment");
        } else if (facing === "environment") {
            await askPermission("user");
            setFacing("user");
        }

    }

    const checkPermission = () => {
        if (!permission.status) {
            console.log(permission.error);
            return false;
        }

        return true;
    }

    // Demo method
    const destroyCamera = async () => {
        if (!camera) {
            return;
        }
        stopMediaStream();
    }

    const takePhoto = () => {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        canvas.wdith = streamedVideoRef.current.videoWidth;
        canvas.height = streamedVideoRef.current.videoHeight;
        context.drawImage(streamedVideoRef.current, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(blob => {
            if (!blob) {
                throw 'canvas.toBlob returns null';
            }

            const tempURL = URL.createObjectURL(blob);
            setPhotoURL(tempURL);
        })
    }

    const startRecording = () => {
        // Create new RecordRTC instance
        const tempRecorder = RecordRTC(camera, {
            type: 'video',
            // MimeType: "video/webm;codecs=vp8",
        });

        // Testing raw recorder to use webm
        const rawRecorder = new MediaRecorder(camera, {
            type: 'video',
            MimeType: "video/webm;codecs=vp8",
        });

        streamedVideoRef.current.muted = true; // it could be set in in-line style, yet neat to write in here
        streamedVideoRef.current.volume = 0;

        tempRecorder.startRecording();
        tempRecorder.camera = camera;

        setRecorder(tempRecorder);
        setRecording(true);
    }

    const stopRecording = () => {
        recorder.stopRecording(stopRecordingCallback);
    }

    const stopRecordingCallback = () => {
        streamedVideoRef.current.src = streamedVideoRef.current.srcObject = null;
        streamedVideoRef.current.autoplay = false;
        streamedVideoRef.current.muted = false;
        streamedVideoRef.current.volume = 1;

        const recordURL = URL.createObjectURL(recorder.getBlob()); // Deprecateed
        streamedVideoRef.current.src = recordURL;

        // recorder.camera.stop();

        recorder.destroy();
        setRecorder(null);
        setRecordURL(recordURL);
        setRecorded(true);
        setRecording(false);
    }

    const retry = () => {
        // Clear meemory
        URL.revokeObjectURL(recordURL);

        streamedVideoRef.current.autoplay = true;
        streamedVideoRef.current.muted = true; // it could be set in in-line style, yet neat to write in here
        streamedVideoRef.current.volume = 0;
        streamedVideoRef.current.srcObject = camera;

        setRecordURL(null);
        setRecorded(false);
    }

    const play = () => {
        streamedVideoRef.current.play();
    }

    return (
        <React.Fragment>
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    position: 'relative',
                    zIndex: '1',
                    overflowY: 'scroll',
                    width: '100%',
                    height: '100%',
                }}
            >
                <h3>Mode: {facing} (force flipping doesn't change this)</h3>
                <video style={{
                    width: '90%',
                    maxWidth: '960px',
                    transform: facing === "user" ? 'scaleX(-1)' : null,
                }}
                       autoPlay
                       playsInline
                       ref={streamedVideoRef}
                />
                {isRecorded ?
                    <React.Fragment>
                        <button onClick={play}>Play</button>
                        <button onClick={retry}>Retry</button>
                        <a href={recordURL} download={'test.webm'}>Download</a>
                    </React.Fragment> :
                    <React.Fragment>
                        {isReocrding ?
                            <button onClick={stopRecording}>Stop</button> :
                            <React.Fragment>
                                {canFlipCamera ? <button onClick={toggleFacing}>Flip Camera</button> : null}
                                {canFlipCamera ? <button onClick={iteratesAvailCameras}>Force Flip Camera</button> : null}
                                <button onClick={startRecording}>Record</button>
                                <button onClick={destroyCamera}>destory camera</button>
                                <button onClick={takePhoto}>Take Photo</button>
                            </React.Fragment>
                        }
                    </React.Fragment>}
                <div>
                    <span>
                        {!permission.status ? 'failed to load camera' : null}
                    </span>
                </div>
                <div>
                    <img style={{
                        transform: facing === "user" ? 'scaleX(-1)' : null,
                        width: '90%',
                        maxWidth: '960px',
                    }}
                         src={photoURL}
                    />
                </div>
            </div>
            {isLoading ?
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'absolute',
                        zIndex: '10',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'white',
                    }}
                >
                    <h1>Loading...</h1>
                </div>
                : null}
        </React.Fragment>
    )
}

export default Recorder;
