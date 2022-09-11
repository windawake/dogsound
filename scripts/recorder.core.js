class DogRecorder {
    context = null;
    bufferSize = 512;
    recorder = null;
    audioInput = null;
    static constraints = {
        audio: {
            noiseSuppression: 1,
            echoCancellation: 1,
            autoGainControl: 1
        }
    };
    bufferRec = [];
    bufferLen = 0;
    processStart = 0;
    setTimeout = null;
    findSound = 0; // 0未发现 1已发现 2可结束
    highLimit = 32767;
    soundEndTimes = 0;

    constructor(stream) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.context = new AudioContext();
        this.recorder = this.context.createScriptProcessor(this.bufferSize, 1, 1);
        this.audioInput = this.context.createMediaStreamSource(stream);
    }

    connect() {
        this.audioInput.connect(this.recorder);
        this.recorder.connect(this.context.destination);
    }

    disconnect() {
        this.audioInput.disconnect();
        this.recorder.disconnect();
    }

    processBuffer() {
        let $this = this;
        this.recorder.onaudioprocess = function (e) {
            let left = e.inputBuffer.getChannelData(0);
            var leftArr = new Int16Array(left.length);
            for (var i = 0; i < left.length; i++) {
                // if (left[i] * 0x7FFF == 0) {
                //     console.log(left[i], left[i] * 0x7FFF);
                // }
                let decibel = Math.max(-1, Math.min(1, left[i]));
			    decibel = decibel<0? decibel*0x8000 : decibel*0x7FFF;
                leftArr[i] = decibel;
            }
            $this.bufferRec.push(leftArr);
            $this.bufferLen += left.length;
        }
    }


    processRecBuffer() {
        let $this = this;
        this.recorder.onaudioprocess = function (e) {
            let left = e.inputBuffer.getChannelData(0);
            var leftArr = new Int16Array(left.length);
            let energy = 0;
            for (var i = 0; i < left.length; i++) {
                let decibel = Math.max(-1, Math.min(1, left[i]));
			    decibel = decibel<0? decibel*0x8000 : decibel*0x7FFF;
                leftArr[i] = decibel;
                energy += Math.abs(decibel);
            }
            
            let dbRate = energy / (left.length * $this.highLimit);
            // console.log(dbRate);
            if (dbRate > 0.03 && $this.findSound == 0) {
                $this.findSound = 1;
            }

            if ($this.findSound == 1) {
                $this.bufferRec.push(leftArr);
                $this.bufferLen += left.length;
            }

            if (dbRate < 0.03 && $this.findSound == 1) {
                $this.soundEndTimes++;
                // console.log($this.soundEndTimes);
                if ($this.soundEndTimes > 48) {
                    $this.recognizeRecorder();
                    $this.findSound = 0;
                    $this.soundEndTimes = 0;
                }
                
            }
            
        }
    }

    getDataView() {
        const sampleRate = 44100;
        const bitRate = 16;
        const dataLength = this.bufferLen * (bitRate / 8);
        // we create our wav file
        let buffer = new ArrayBuffer(44 + dataLength);
        let view = new DataView(buffer);

        // RIFF chunk descriptor
        this.writeUTFBytes(view, 0, 'RIFF');
        view.setUint32(4, 44 + dataLength, true);
        this.writeUTFBytes(view, 8, 'WAVE');
        // FMT sub-chunk
        this.writeUTFBytes(view, 12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        // stereo (2 channels)
        view.setUint16(22, 1, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * (bitRate / 8), true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        // data sub-chunk
        this.writeUTFBytes(view, 36, 'data');
        view.setUint32(40, dataLength, true);

        // write the PCM samples
        let offset = 44;
        for (let i = 0; i < this.bufferRec.length; i++) {
            let arr = this.bufferRec[i];
            for (let j = 0; j < arr.length; j++) {
                view.setInt16(offset, arr[j], true);
                offset += 2;
            }
        }

        this.bufferRec = [];
        this.bufferLen = 0;
        return view;
    }


    writeUTFBytes(view, offset, string) {
        let lng = string.length;
        for (let i = 0; i < lng; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    }

    recognizeRecorder() {
        const soundDogRec = document.getElementById('soundDogRec');
        const replyDogRec = document.getElementById('replyDogRec');

        let view = this.getDataView();
        if (view.byteLength <= 444) {
            document.getElementById("recAlert").innerHTML = "没有采样到声音，请重新发出声音";
            document.getElementById("recAlert").classList.remove("d-none");
            setTimeout(function(){
            document.getElementById("recAlert").classList.add("d-none");
            }, 3000);
            return;
        }
        const audio = document.createElement('audio');
        audio.controls = true;
        const blob = new Blob([view], { 'type': 'audio/wav; codecs=MS_PCM' });
        const audioURL = window.URL.createObjectURL(blob);
        audio.src = audioURL;
        audio.title = (Date.parse(new Date()) / 1000) + ".wav";
        soundDogRec.innerHTML = audio.outerHTML;

        const formData = new FormData();
        formData.append("audio_dog", blob, audio.title);
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/php/recognizeRecord.php");
        xhr.send(formData);
        xhr.onreadystatechange = function () {
          if (xhr.readyState === 4 && xhr.status === 200) {
            const res = JSON.parse(xhr.responseText);
            if (res.error_code == 0) {
              replyDogRec.innerHTML = `
                <audio src="${res.data.reply_file}"></audio>
              `;
              replyDogRec.getElementsByTagName("audio")[0].play();
            } else {
              document.getElementById("recAlert").innerHTML = res.msg;
              document.getElementById("recAlert").classList.remove("d-none");
              setTimeout(function(){
                document.getElementById("recAlert").classList.add("d-none");
              }, 3000);
            }

            // if (turnOff) {
            //     document.getElementById("recAlert").innerHTML = "识别器采样结束，请重新点击按钮";
            // }
        }
      }
    }
};

// 奇怪不用火狐浏览器也行
// if (navigator.userAgent.indexOf("Firefox") < 0) {
//     alert("当前应用只支持firefox浏览器");
// }