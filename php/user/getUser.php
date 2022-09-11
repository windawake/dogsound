<?php 
require_once "../helpers/commonHelper.php";

if ($_COOKIE['username']) {
    $sql = sprintf("select * from user where username='%s' limit 1", $_COOKIE['username']);
    $sth = getPdo()->prepare($sql);
    $sth->execute();

    $result = $sth->fetchAll();
    if ($result) {
        ajaxSuccess('成功返回数据', $result[0]);
    }
}


ajaxError();