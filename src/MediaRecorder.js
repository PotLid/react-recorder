/** Reference: https://github.com/webrtc/samples/blob/gh-pages/src/content/getusermedia/record/js/main.js */
import React, {createRef} from 'react';

class MediaRecorder extends React.Component {
    constructor(props) {
        super(props);

        this.state = {

        }

        this.streamView = createRef();
    }

    render() {
        return (
            <div>
                <video ref={this.streamView} style={{width: '100%', transform: 'scaleX(-1)'}} playsInline autoPlay />
            </div>
        )
    }

}

export default MediaRecorder;
