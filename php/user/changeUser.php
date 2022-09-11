<?php 
require_once "../helpers/commonHelper.php";

if ($_POST['username'] && $_POST['password']) {
    $sql = sprintf("select * from user where username='%s' and password='%s' limit 1", $_POST['username'], $_POST['password']);
    $sth = getPdo()->prepare($sql);
    $sth->execute();

    $result = $sth->fetchAll(PDO::FETCH_ASSOC);
    if ($result) {
        setcookie('username', $_POST['username'], time()+ 3600*24*365, '/');
        ajaxSuccess();
    } else {
        ajaxError(400400, '账号或密码不正确');
    }
}

ajaxError();