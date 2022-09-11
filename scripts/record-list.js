const xhr = new XMLHttpRequest();
xhr.open("GET", "/php/getRecordList.php");
xhr.send();
xhr.onreadystatechange = function () {
  if (xhr.readyState === 4 && xhr.status === 200) {
    const res = JSON.parse(xhr.responseText);
    if (res.error_code == 0) {
      const list = res.data.list;
      for (let i = 0; i < list.length; i++) {
        const item = list[i];
        document.getElementById("recorderList").innerHTML += `
            <li class="list-group-item" data-id="${item.id}">
              <label>${item.file_name}</label>
              <button class="btn btn-primary btn-sm" onclick="document.getElementById('audioDog_${i}').play()">
                <span class="dog-icon"></span>
                播放
              </button>
              <button class="btn btn-primary btn-sm" onclick="document.getElementById('audioHuman_${i}').play()">
                <span class="human-icon"></span>
                播放
              </button>
              <button class="btn btn-danger btn-sm del-recorder">
                删除
              </button>
              <audio id="audioDog_${i}" src="${item.dog_file}">该浏览器不支持audio</audio>
              <audio id="audioHuman_${i}" src="${item.human_file}">该浏览器不支持audio</audio>
            </li>
         `;
      }

      document.querySelectorAll(".del-recorder").forEach(function(delDom){
        delDom.onclick = function() {
          let liDom = this.parentNode;
          let id = liDom.dataset.id;
          const xhr = new XMLHttpRequest();
          const formData = new FormData();
          formData.append("id", id);
          xhr.open("POST", "/php/deleteRecord.php");
          xhr.send(formData);
          xhr.onreadystatechange = function () {
            if (xhr.readyState === 4 && xhr.status === 200) {
              const res = JSON.parse(xhr.responseText);
              if (res.error_code == 0) {
                liDom.remove();
              }
            }
          };
        }
      });
    }
  }
}