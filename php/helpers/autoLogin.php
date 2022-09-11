<?php 
session_start();
if (isset($_COOKIE['username'])) {
    $sql = sprintf("select * from user where username='%s' limit 1", $_COOKIE['username']);
    $sth = getPdo()->prepare($sql);
    $sth->execute();

    $result = $sth->fetchAll();
    if ($result) {
        $_SESSION['uid'] = $result[0]['id'];
    } else {
        exit("cookie错误，请求失败");
    }
} else {
    $username = uniqid();
    $password = mt_rand(100000, 999999);

    $sql = sprintf("INSERT INTO `user`(`id`, `username`, `password`, `create_time`) VALUES (NULL, '%s', '%s', '%s')", $username, $password, date("Y-m-d H:i:s"));

    $affectedRows = getPdo()->exec($sql);
    if ($affectedRows) {
        $_SESSION['uid'] = getPdo()->lastInsertId();
        setcookie('username', $username, time()+ 3600*24*365, '/');
    }
}