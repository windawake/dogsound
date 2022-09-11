<?php 
require_once "./helpers/waveHelper.php";
require_once "./helpers/commonHelper.php";
require_once "./helpers/autoLogin.php";

$sql = sprintf("select id, dog_file, dog_file_name, human_file, human_file_name, create_time from recorder_list where uid=%s and delete_time is null order by id desc", $_SESSION['uid']);

$res = getPdo()->query($sql);
$list = [];
while ($row = $res -> fetch(PDO::FETCH_ASSOC)){
    $fileName = str_replace(['-', ':'], '', $row['create_time']);
    $fileName = str_replace(' ', '_', $fileName);
    $list[] = [
        'id' => $row['id'],
        'dog_file' => getAccessFile($row['dog_file']),
        'dog_file_name' => $row['dog_file_name'],
        'human_file' => getAccessFile($row['human_file']),
        'human_file_name' => $row['human_file_name'],
        'create_time' => $row['create_time'],
        'file_name' => $fileName,
    ];
}

$data['list'] = $list;
ajaxSuccess("成功返回数据", $data);