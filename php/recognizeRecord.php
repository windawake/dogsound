<?php 
require_once "./helpers/waveHelper.php";
require_once "./helpers/commonHelper.php";
require_once "./helpers/autoLogin.php";

if (!isset($_FILES['audio_dog'])) {
    die("缺少狗狗的wav录音");
}

$dogFilename = $_FILES['audio_dog']['name'];
$buffers = file_get_contents($_FILES['audio_dog']['tmp_name']);

$dogFile = uniqid().substr($dogFilename, strrpos($dogFilename, '.'));
$config = getConfig();
$fileStore = $config['recognize']['fileStore'] ?? false;
if ($fileStore) {
    move_uploaded_file($_FILES['audio_dog']['tmp_name'], recoginzerFilePath($dogFile));
} else {
    unlink($_FILES['audio_dog']['tmp_name']);
}



$curWave = getWaveEnd($buffers);

$sql = sprintf("select id, wave_endpoint, abs_fft, dog_file, human_file, human_file_name, create_time from recorder_list where uid=%s and delete_time is null order by id desc", $_SESSION['uid']);

$res = getPdo()->query($sql);
$matchResult = [];
$matchResultList = [];
while ($row = $res -> fetch(PDO::FETCH_ASSOC)){
    $matchWave = [
        'endpoint' => $row['wave_endpoint'],
        'absFft' => json_decode($row['abs_fft'], true),
    ];

    $matchResult = matchWaveResult($curWave, $matchWave);
    $logArr = [
        'recoginzerFile' => $dogFile, 
        'recorderFile' => $row['dog_file'], 
        'matchResult' => $matchResult,
    ];
    $logText = json_encode($logArr);
    logInfo($logText);

    if ($matchResult['matchRate'] > 0.65) {
        $matchItem = array_merge($row, $matchResult);
        $matchResultList = [];
        $matchResultList[] = $matchItem;
        break;
    }

    // if ($matchResult['matchRate'] > 0.4) {
    //     $matchItem = array_merge($row, $matchResult);
    //     $matchResultList[] = $matchItem;
    // }
    
}


if (!$matchResultList) {
    ajaxError(400401, "没有找到匹配的数据", $matchResult);
}

array_multisort(array_column($matchResultList,'matchRate'),SORT_DESC,$matchResultList);

$matchItem = current($matchResultList);

$data = [
    'id' => $matchItem['id'],
    'create_time' => $matchItem['create_time'],
    'reply_file' => getAccessFile($matchItem['human_file']),
    'matchTotal' => $matchItem['matchTotal'],
    'matchSuccess' => $matchItem['matchSuccess'],
    'matchRate' => $matchItem['matchRate'],
];
ajaxSuccess("成功返回数据", $data);