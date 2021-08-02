/** Referring to Google Web Fundamentals */
/** https://developers.google.com/web/fundamentals/media/recording-video */
/** https://developers.google.com/web/updates/2016/01/mediarecorder */
/** https://developer.mozilla.org/en-US/docs/Web/API/MediaStream_Recording_API */
/** https://github.com/webrtc/samples/blob/gh-pages/src/content/getusermedia/record/js/main.js */

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

    const initCamera = () => {
        if (!navigator || !navigator.mediaDevices) {
            return;
        }
        const vidConstraints = {
            audio: true,
            video: {
                // this cause over constrained error
                width: {ideal: 1920},
                height: {ideal: 1080},
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

    const updateChunks = (e) => {
        console.log(e)
        if (e.data.size > 0) {
            const temp = recordedChunks;
            temp.push(e.data);
            setRecordedChunks(temp);
        }
    }

    const mergeChunks = () => {
        console.log(mediaRecorder)
        const superBuffer = new Blob(recordedChunks);
        const href = window.URL.createObjectURL(superBuffer);
        setHref(href);
        setMediaRecorder(null);
    }

    const clickRecord = async () => {
        if (!currentStream) {
            return;
        }

        const mediaRecorder = new MediaRecorder(currentStream, {mimeType: 'video/webm; codecs="opus, vp8"'});

        mediaRecorder.addEventListener('dataavailable', updateChunks, true);
        mediaRecorder.addEventListener('stop', mergeChunks, true);

        await mediaRecorder.start();

        setRecording(true);
        setMediaRecorder(mediaRecorder);
    }

    const clickStop = async () => {
        await mediaRecorder.stop();
        mediaRecorder.removeEventListener('dataavailable', updateChunks, true);
        mediaRecorder.removeEventListener('stop', mergeChunks, true);

        setRecording(false);
        setFinished(true);
    }

    const getVidInfo = () => {
        if (!vidTwo || !vidTwo.current) {

            return;
        }

        console.log(vidTwo.current.readyState);
        console.log(vidTwo.current.duration)
    }

    const playVid = () => {
        if (!vidTwo || !vidTwo.current) {
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
            {isFinished ?
                <video ref={vidTwo} style={{transform: 'scaleX(-1)', width: '100%'}} playsInline src={href}/> :
                <video ref={vidOne} autoPlay style={{transform: 'scaleX(-1)', width: '100%'}} playsInline muted/>}
            {isFinished ? null : isRecording ? <button onClick={clickStop}>Stop</button> :
                <button onClick={clickRecord}>Record</button>}
            {isFinished ? <a href={href} download={'test.webm'}>Download</a> : null}
            {isFinished ? <button onClick={getVidInfo}>current Status</button> : null}
            {isFinished ? <button onClick={playVid}>play</button> : null}
        </div>
    )
}

export default Recorder;
