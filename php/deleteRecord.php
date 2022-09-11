<?php 
require_once "./helpers/waveHelper.php";
require_once "./helpers/commonHelper.php";
require_once "./helpers/autoLogin.php";

if ($_POST['id']) {
    $sql = sprintf("update recorder_list set delete_time = '%s'  where id = %s and uid=%s limit 1", date("Y-m-d H:i:s"), $_POST['id'], $_SESSION['uid']);
    $affectedRows = getPdo()->exec($sql);
    ajaxSuccess();
}

ajaxError();