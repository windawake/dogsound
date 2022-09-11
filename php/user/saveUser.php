<?php 
require_once "../helpers/commonHelper.php";

if (isset($_COOKIE['username']) && isset($_POST['nickname']) && isset($_POST['password'])) {
    $sql = sprintf("select * from user where username='%s' limit 1", $_COOKIE['username']);
    $sth = getPdo()->prepare($sql);
    $sth->execute();

    $result = $sth->fetchAll(PDO::FETCH_ASSOC);
    if ($result) {
        $nickname = $_POST['nickname'];
        $password = $_POST['password'];
        $sql = sprintf("update user set nickname='%s', password='%s' where username='%s' limit 1", $nickname, $password, $_COOKIE['username']);

        $affectedRows = getPdo()->exec($sql);
        ajaxSuccess();
    }
}

ajaxError();