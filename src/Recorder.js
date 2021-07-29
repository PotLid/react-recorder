/** Reference:
 * https://www.webrtc-experiment.com/RecordRTC/simple-demos/
 * https://www.webrtc-experiment.com/RecordRTC/simple-demos/video-recording.html
 * https://github.com/muaz-khan/RecordRTC/blob/master/simple-demos/video-recording.html */

import React, {useEffect, useRef, useState} from 'react';
import RecordRTC from 'recordrtc';

const CustomMediaRecorder = (props) => {
    const [recorder, setRecorder] = useState(null); // RecordRTC instance
    const [camera, setCamera] = useState(null); // MediaStream
    const [permission, setPermission] = useState({status: false, error: null});
    const [isRecorded, setRecorded] = useState(false); // Flag
    const [recordURL, setRecordURL] = useState(null);
    const [isReocrding, setRecording] = useState(false);

    const streamedVideoRef = useRef(null);

    useEffect(() => {
        const initWrap = async () => {
            await askPermission();
        }

        initWrap();

    }, []);

    useEffect(() => {
        return () => {
            if (recordURL) {
                URL.revokeObjectURL(recordURL);
            }
        }
    }, []);

    // Lift up methods inside current component to its parent component
    const liftUpCallbacks = () => {

    }

    // Ask for the camera access permission
    const askPermission = async () => {
        const vidConstraints = {
            audio: true,
            video: {
                width: {ideal: 1920},
                height: {ideal: 1080},
            }
        }

        const defaultConstraints = {
            audio: true,
            video: true
        }

        navigator.mediaDevices.getUserMedia(defaultConstraints)
            .then(handleSuccess)
            .catch(error => {
                setPermission({status: false, error: error});
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

        setCamera(stream);
        setPermission({status: true, error: null});
    }

    const startRecording = () => {
        // Create new RecordRTC instance
        const tempRecorder = RecordRTC(camera, {
            type: 'video',
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
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                zIndex: 10,
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <video style={{width: '90%', maxWidth: '960px'}} autoPlay playsInline ref={streamedVideoRef}/>
            {isRecorded ?
                <React.Fragment>
                    <button onClick={play}>Play</button>
                    <button onClick={retry}>Retry</button>
                    <a href={recordURL} download={'test.webm'}>Download</a>
                </React.Fragment> :
                <React.Fragment>
                    {isReocrding ?
                        <button onClick={stopRecording}>Stop</button> :
                        <button onClick={startRecording}>Record</button>}
                </React.Fragment>}
            <button onClick={() => {
                camera.stop()
            }}>destory camera
            </button>
        </div>
    )
}

export default CustomMediaRecorder;
