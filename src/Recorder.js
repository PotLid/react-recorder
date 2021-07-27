/** Referring Google Web Fundamentals */
/** https://developers.google.com/web/fundamentals/media/recording-video */

import React, {useState, useEffect, useRef} from 'react';

const Recorder = (props) => {

    const [cameras, setCameras] = useState(null);
    const [camerasCount, setCamerasCount] = useState(0);
    const [facingMode, setFacingMode] = useState("user"); // "environment" for rear camera
    const [isRecording, setRecording] = useState(false);
    const [isFinished, setFinished] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [currentStream, setStream] = useState(null);
    const [recordedChunks, setRecordedChunks] = useState([]);
    const [href, setHref] = useState(null);

    const vidOne = useRef(null);
    const vidTwo = useRef(null);

    useEffect(() => {
        const asyncInit = async () => {
            await initCamera()
        };

        asyncInit();
    }, []);

    const initCamera = async () => {
        if (!navigator || !navigator.mediaDevices) {
            return;
        }
        const vidConstraints = {
            audio: true,
            video: {
                // this cause over constrained error
                // width: {ideal: 1920},
                // height: {ideal: 1080},
                facingMode: facingMode,
            }
        }

        navigator.mediaDevices.getUserMedia(vidConstraints)
            .then(handleSuccess)
            .catch(err => {
                console.log(err.name + ": " + err.message);
            });
        if (!cameras) {
            navigator.mediaDevices.enumerateDevices()
                .then(devices => {
                    const videoDevices = devices.filter(device => device.kind === 'videoinput');
                    setCameras(videoDevices);
                    setCamerasCount(videoDevices.length);
                })
                .catch(err => {
                    console.log(err.name + ": " + err.message);
                });
        }
    }

    const handleSuccess = (stream) => {
        if (!vidOne || !vidOne.current) {
            return;
        }
        vidOne.current.srcObject = stream;
        setStream(stream);
    }

    const clickRecord = () => {
        if(!currentStream) {
            return;
        }

        const mediaRecorder = new MediaRecorder(currentStream, {mimeType: 'video/webm'});

        mediaRecorder.addEventListener('dataavailable', e => {
            if(e.data.size > 0) {
                const temp = recordedChunks;
                temp.push(e.data);
                setRecordedChunks(temp);
            }
        });

        mediaRecorder.addEventListener('stop', () => {
            const href = URL.createObjectURL(new Blob(recordedChunks));
            setHref(href);
        })

        mediaRecorder.start();


        setRecording(true);
        setMediaRecorder(mediaRecorder);
    }

    const clickStop = () => {
        mediaRecorder.stop();

        setRecording(false);
        setFinished(true);
    }

    const getVidInfo = () => {
        if(!vidTwo || !vidTwo.current) {
            return;
        }

        console.log(vidTwo.current.readyState);
    }

    const playVid = () => {
        if(!vidTwo || !vidTwo.current) {
            return;
        }

        vidTwo.current.play();
    }

    return (
        <div
            className="recorder_rap"
            style={{
                width: '100%',
                height: '100%',
            }}
        >
            {isFinished ? <video ref={vidTwo} src={href}/> : <video ref={vidOne} autoPlay style={{transform: 'scaleX(-1)'}}/>}
            {isFinished ? null : isRecording ? <button onClick={clickStop}>Stop</button> : <button onClick={clickRecord}>Record</button>}
            {isFinished ? <a href={href} download={'test.webm'}>Download</a> : null}
            {isFinished ? <button onClick={getVidInfo}>current Status</button> : null}
            {isFinished ? <button>play</button> : null}
        </div>
    )
}

export default Recorder;
