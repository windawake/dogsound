const dogTap = document.getElementById('dogTap');
const humanTap = document.getElementById('humanTap');
const soundDogTap = document.getElementById('soundDogTap');
const soundHumanTap = document.getElementById('soundHumanTap');
const canvas = document.querySelector('.visualizer');
const recordingDom = document.getElementById('recording');

let tapData = {
  curSoundDom: null,
  list: [{
    audioId: "audio_dog",
    tapDom: dogTap,
    soundDom: soundDogTap,
    fileName: "",
    dataView: null,
    errorMsg: "请点击下方左边图标给狗狗录音"
  },
  {
    audioId: "audio_human",
    tapDom: humanTap,
    soundDom: soundHumanTap,
    fileName: "",
    dataView: null,
    errorMsg: "请点击下方右边图标配上自己的录音"
  }],
};

const onMobile = 'ontouchstart' in window,
  eStart = onMobile ? 'touchstart' : 'mousedown',
  eMove = onMobile ? 'touchmove' : 'mousemove',
  eCancel = onMobile ? 'touchcancel' : 'mouseup';

function disableRepeat(dom) {
  // 禁用点击三秒
  if (dom.disabled) {
    console.log("防止重复提交");
    return;
  }

  dom.disabled = true;
  setTimeout(function () {
    this.disabled = false;
  }.bind(dom), 2000);
}

let dogRecorder = null;
// const canvasCtx = canvas.getContext("2d");
if (navigator.mediaDevices == undefined) {
  alert("请修改成https访问");
}

if (navigator.mediaDevices.getUserMedia) {
  console.log('getUserMedia supported.');

  let onSuccess = function (stream) {
    // 全局
    dogRecorder = new DogRecorder(stream);

    for (let item of tapData.list) {
      let tapDom = item.tapDom;
      tapDom.onclick = function () {
        if (!tapDom.classList.contains("outline-primary-light")) {
          if (dogRecorder.processStart == 1) {
            alert("当前还有其它的录音未完成！");
            return;
          }
          dogRecorder.processStart = 1;
          console.log("recorder started");
          tapDom.classList.add("outline-primary-light");
          recordingDom.classList.remove("d-none");
          dogRecorder.connect();
          dogRecorder.processBuffer();

          dogRecorder.setTimeout = setTimeout(function () {
            recordEnd();
          }, 10000);
        } else {
          recordEnd();
        }

      }

      function recordEnd() {
        console.log("recorder stopped");
        tapDom.classList.remove("outline-primary-light");
        recordingDom.classList.add("d-none");

        if (dogRecorder.processStart == 0) {
          return;
        }
        dogRecorder.processStart = 0;
        if (dogRecorder.setTimeout) {
          clearTimeout(dogRecorder.setTimeout);
        }

        tapData.curSoundDom = item.soundDom;
        let dataView = dogRecorder.getDataView();
        dogRecorder.disconnect();
        const blob = new Blob([dataView], { 'type': 'audio/wav; codecs=MS_PCM' });

        const audioURL = window.URL.createObjectURL(blob);
        tapData.curSoundDom.innerHTML = `
          <div class="ppq-audio-player player-paused row" data-start="0" data-end="1">
            <audio preload="auto"
        src="${audioURL}"></audio>
            <div class="col-2 play-pause-btn"><a href="javascript: void(0);" class="play-pause-icon"></a></div>
            <div class="col-2 d-flex align-content-center flex-wrap player-time player-time-current">00:00</div>
            <div class="col player-slider">
                <div class="player-bar">
                    <div class="player-bar-loaded" style="width: 100%;"></div>
                    <div class="player-bar-played"></div>
                </div>
                <div class="clip-start"></div>
                <div class="clip-end"></div>
            </div>
            <div class="col-2 d-flex align-content-center flex-wrap player-time player-time-duration">00:20</div>
          </div>
        `;

        const playerDom =  tapData.curSoundDom.querySelector('.ppq-audio-player');

        loadPlayer(playerDom);

        for (let item of tapData.list) {
          if (item.soundDom == tapData.curSoundDom) {
            item.fileName = (Date.parse(new Date()) / 1000) + ".wav";
            item.dataView = dataView;
          }
        }
        tapData.curSoundDom = null;
        tapDom.classList.remove("outline-primary-light");
      }
    }
    // visualize(stream);
  }

  let onError = function (err) {
    console.log('The following error occured: ' + err);
  }

  navigator.mediaDevices.getUserMedia(DogRecorder.constraints).then(onSuccess, onError);

  document.getElementById("recordSubmit").onclick = function () {
    const formData = new FormData();
    for (let item of tapData.list) {
      if (item.dataView == null) {
        document.getElementById("recordAlert").innerHTML = item.errorMsg;
        document.getElementById("recordAlert").classList.remove("d-none");
        setTimeout(function () {
          document.getElementById("recordAlert").classList.add("d-none");
        }, 4000);
        return;
      }

      const dataView = item.dataView;
      const dataViewLength = dataView.byteLength - 44;
      const player = item.soundDom.querySelector('.ppq-audio-player');

      const start = Math.round(player.dataset.start * dataViewLength / 2) * 2;
      const end = Math.round(player.dataset.end * dataViewLength / 2) * 2;
      const dataLength = end - start;
      console.log("start:"+start+";end:"+end+";dataLength:"+dataLength);

      let buffer = new ArrayBuffer(44 + dataLength);
      let newView = new DataView(buffer);
      for (let i=0; i < 44; i++) {
        newView.setInt8(i, dataView.getInt8(i));
      }
      newView.setUint32(4, 44 + dataLength, true);
      newView.setUint32(40, dataLength, true);

      for (let i=0; i< dataLength; i++) {
        newView.setInt8(44 + i, dataView.getInt8(44 + start + i));
      }

      const itemBlob = new Blob([newView], { 'type': 'audio/wav; codecs=MS_PCM' });
      formData.append(item.audioId, itemBlob, item.fileName);
    }

    disableRepeat(this);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/php/saveRecord.php");
    xhr.send(formData);
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4 && xhr.status === 200) {
        const res = JSON.parse(xhr.responseText);
        alert(res.msg);
        if (res.error_code == 0) {
          window.location.href = "/index.html";
        }
      }
    }

  }

} else {
  console.log('getUserMedia not supported on your browser!');
  alert('请使用手机浏览器打开');
}

// testRecord();
// function testRecord() {
//   console.log("testRecord");
//   let buffer = new ArrayBuffer(2);
//   let newView = new DataView(buffer);
  
//   newView.setInt16(0, 300, true);
//   const formData = new FormData();
//   const itemBlob = new Blob([newView], { 'type': 'audio/wav; codecs=MS_PCM' });
//   formData.append("audio_dog", itemBlob, "demo.wav");

//   const xhr = new XMLHttpRequest();
//   xhr.open("POST", "/php/testRecord.php");
//   xhr.send(formData);
//   xhr.onreadystatechange = function () {
//     console.log(xhr.responseText)
//   }
// }

function loadPlayer($player) {
  const barDom = $player.querySelector('.player-bar'),
    playedDom = $player.querySelector('.player-bar-played'),
    currentDom = $player.querySelector('.player-time-current'),
    durationDom = $player.querySelector('.player-time-duration'),
    clipStartDom = $player.querySelector('.clip-start'),
    clipEndDom = $player.querySelector('.clip-end');

  const playerSliderDom = $player.querySelector('.player-slider');
  const audioEle = $player.querySelector('audio');



  audioEle.addEventListener('loadeddata', function () {
    // console.log(audioEle.duration);
    currentDom.innerHTML = '00:00';
    durationDom.innerHTML = convertTimeStr(audioEle.duration);
  });

  // 监听timeupdate，更新时间和进度条
  audioEle.addEventListener('timeupdate', function () {
    // console.log(audioEle.currentTime);
    currentDom.innerHTML = convertTimeStr(audioEle.currentTime);
    playedDom.style.width = (audioEle.currentTime / audioEle.duration) * 100 + '%';
    // audio stop
    if (audioEle.currentTime >= $player.dataset.end * audioEle.duration) {
        audioEle.pause();
        audioEle.currentTime = $player.dataset.start * audioEle.duration;
        $player.classList.remove('player-playing');
        $player.classList.add('player-paused');
    }
  });

  // 监听ended，播放完恢复暂停状态
  audioEle.addEventListener('ended', function () {
    $player.classList.remove('player-playing');
    $player.classList.add('player-paused');

  });

  // 监听进度条touch，更新进度条和播放进度
  barDom.addEventListener(eStart, function (e) {
    audioEle.currentTime = getCurrentTime(e, barDom, audioEle.duration);
    barDom.addEventListener(eMove, function (e) {
      audioEle.currentTime = getCurrentTime(e, barDom, audioEle.duration);
    });
  });

  barDom.addEventListener(eCancel, function () {
    barDom.unbind(eMove);
  });

  // 监听进度条touch，更新进度条和播放进度
  clipStartDom.addEventListener(eStart, function (e1) {
    clipStartDom.addEventListener(eMove, function (e) {
      // debugger;
      let offsetX = getCurrentOffset(e, playerSliderDom);
      // debugger;
      // console.log(offsetX);
      // debugger;
      const minLeft = 0;
      const maxLeft = clipEndDom.offsetLeft - e.target.offsetWidth;
      offsetX = offsetX > maxLeft ? maxLeft : offsetX;
      offsetX = offsetX < minLeft ? minLeft : offsetX;

      clipStartDom.style.left = offsetX + "px";
      $player.dataset.start = offsetX/(barDom.offsetWidth + e.target.offsetWidth);
      audioEle.currentTime = $player.dataset.start * audioEle.duration;
      // console.log(audioEle.currentTime);
    });
  });
  clipStartDom.addEventListener(eCancel, function () {
    clipStartDom.unbind(eMove);
  });

  // 监听进度条touch，更新进度条和播放进度
  clipEndDom.addEventListener(eStart, function (e1) {
    clipEndDom.addEventListener(eMove, function (e) {
      let offsetX = getCurrentOffset(e, playerSliderDom);
      // debugger;
      // offsetX = clipEndDom.offsetLeft + offsetX + 12;
      // console.log(offsetX, playerSliderDom.offsetWidth);
      const maxLeft = playerSliderDom.offsetWidth - e.target.offsetWidth;
      const minLeft = clipStartDom.offsetLeft + e.target.offsetWidth;
      offsetX = offsetX > maxLeft ? maxLeft : offsetX;
      offsetX = offsetX < minLeft ? minLeft : offsetX;
      clipEndDom.style.left = offsetX + "px";
      $player.dataset.end = offsetX/(barDom.offsetWidth + e.target.offsetWidth);
    });
  });
  clipEndDom.addEventListener(eCancel, function () {
    clipEndDom.unbind(eMove);
  });

  // 监听播放暂停按钮click
  $player.querySelector('.play-pause-btn').addEventListener('click', function () {
    if ($player.classList.contains('player-playing')) {
      $player.classList.remove('player-playing');
      $player.classList.add('player-paused');
      audioEle.pause();
    } else {
      $player.classList.add('player-playing');
      $player.classList.remove('player-paused');
      audioEle.play();
    }
    return false;
  });
}


function getCurrentTime(e, barDom, duration) {
  // var et = onMobile ? e.originalEvent.touches[0] : e;
	// 			return Math.round((audioEle.duration * (et.pageX - barDom.offset().left)) / barDom.width());
  $bar = $(barDom);
  console.log($bar.offset().left, $bar.width());
  var et = onMobile ? e.touches[0] : e;
  return (duration * (et.pageX - $bar.offset().left)) / $bar.width();
}

function getCurrentOffset(e, playerSliderDom) {
  $playerSlider = $(playerSliderDom);

  var et = onMobile ? e.touches[0] : e;
  return Math.round(et.pageX - $playerSlider.offset().left);
  // console.log(et.pageX, playerSliderDom.offsetLeft);
  // return Math.round(et.pageX - playerSliderDom.offsetLeft - et.target.offsetWidth/2);
}

// 秒转为时间字符串
function convertTimeStr(secs) {
  var m = Math.floor(secs / 60),
      s = Math.floor(secs - m * 60);
  return (m < 10 ? '0' + m : m) + ':' + (s < 10 ? '0' + s : s);
}