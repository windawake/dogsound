<?php 
require_once "./helpers/waveHelper.php";
require_once "./helpers/commonHelper.php";
require_once "./helpers/autoLogin.php";

if (!isset($_FILES['audio_dog'])) {
    die("缺少狗狗的wav录音");
}

$dogFilename = $_FILES['audio_dog']['name'];
$humanFilename = $_FILES['audio_human']['name'];

$dogFile = uniqid("d").substr($dogFilename, strrpos($dogFilename, '.'));
$humanFile = uniqid("h").substr($humanFilename, strrpos($humanFilename, '.'));
move_uploaded_file($_FILES['audio_dog']['tmp_name'], recorderFilePath($dogFile));
move_uploaded_file($_FILES['audio_human']['tmp_name'], recorderFilePath($humanFile));


$buffers = file_get_contents(recorderFilePath($dogFile));

$waveEnd = getWaveEnd($buffers);

$argValues = [
    $_SESSION['uid'],
    $waveEnd['endpoint'],
    json_encode($waveEnd['absFft']),
    $dogFile,
    $dogFilename,
    $humanFile,
    $humanFilename,
    date("Y-m-d H:i:s"),
];

$sql = sprintf("INSERT INTO `recorder_list`(`id`, `uid`, `wave_endpoint`, `abs_fft`, `dog_file`, `dog_file_name`, `human_file`, `human_file_name`, `create_time`) VALUES (NULL, '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s')", ...$argValues);

$affectedRows = getPdo()->exec($sql);

ajaxSuccess('录音成功');