const xhr = new XMLHttpRequest();
xhr.open("GET", "/php/user/getUser.php");
xhr.send();
xhr.onreadystatechange = function () {
    if (xhr.readyState === 4 && xhr.status === 200) {
        const res = JSON.parse(xhr.responseText);
        if (res.error_code == 0) {
            document.getElementById("username").innerHTML = res.data.username;
            document.getElementById("nickname").value = res.data.nickname;
            document.getElementById("password").value = res.data.password;
        }
    }
}

document.getElementById("saveUserSubmit").onclick = function(e) {
    const formData = new FormData();
    formData.append("nickname", document.getElementById("nickname").value);
    formData.append("password", document.getElementById("password").value);


    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/php/user/saveUser.php");
    xhr.send(formData);
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            const res = JSON.parse(xhr.responseText);
            if (res.error_code == 0) {
                alert(res.msg)
            } else {
                alert(res.msg);
            }
        }
    }

    e.preventDefault();
}

document.getElementById("changeUserSubmit").onclick = function(e) {
    const formData = new FormData();
    formData.append("username", document.getElementById("loginUser").value);
    formData.append("password", document.getElementById("loginPassword").value);


    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/php/user/changeUser.php");
    xhr.send(formData);
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            const res = JSON.parse(xhr.responseText);
            if (res.error_code == 0) {
                alert(res.msg);
                document.getElementById("navRecorder").click();
            } else {
                alert(res.msg);
            }
        }
    }

    e.preventDefault();
}