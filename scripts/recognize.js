window.onload = function () {
  const dogRec = document.getElementById('dogRec');
  const recognizingDom = document.getElementById('recognizing');

  let dogRecorder = null;

  if (navigator.mediaDevices.getUserMedia) {
    console.log('getUserMedia supported.');

    let onSuccess = function (stream) {
      // 全局
      dogRecorder = new DogRecorder(stream);

      dogRec.onclick = function () {
        if (!dogRec.classList.contains("outline-primary-light")) {
          dogRecorder.processStart = 1;
          console.log("recorder started");
          dogRec.classList.add("outline-primary-light");
          recognizingDom.classList.remove("d-none");
          dogRecorder.connect();
          dogRecorder.processRecBuffer();

          dogRecorder.setTimeout = setTimeout(function(){
            recordEnd();
          }, 30000);
        } else {
          recordEnd();
        }
        
      }

      function recordEnd() {
        console.log("recorder stopped");
        dogRec.classList.remove("outline-primary-light");
        recognizingDom.classList.add("d-none");

        if (dogRecorder.processStart == 0) {
          return;
        }
        dogRecorder.processStart = 0;
        if (dogRecorder.setTimeout) {
          clearTimeout(dogRecorder.setTimeout);
        }

        if (dogRecorder.bufferLen == 0) {
          document.getElementById("recAlert").innerHTML = "采样结束，请重新点击";
          document.getElementById("recAlert").classList.remove("d-none");
          setTimeout(function(){
          document.getElementById("recAlert").classList.add("d-none");
          }, 3000);
        } else {
          dogRecorder.recognizeRecorder();
        }

        dogRecorder.disconnect();
        // visualize(stream);
      }

    }

    let onError = function (err) {
      console.log('The following error occured: ' + err);
    }
    navigator.mediaDevices.getUserMedia(DogRecorder.constraints).then(onSuccess, onError);

  } else {
    console.log('getUserMedia not supported on your browser!');
    alert('请使用手机浏览器打开');
  }
}
