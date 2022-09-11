<?php
ini_set('date.timezone','Asia/Shanghai');
set_exception_handler('customException');


function getConfig()
{
    static $sysConfig;
    if ($sysConfig == null) {
        $json = file_get_contents(__DIR__ . "/../../app.json");
        $sysConfig = json_decode($json, true);
    }

    return $sysConfig;
    
}
/**
 * 获取pdo连接
 *
 * @return PDO
 */
function getPdo()
{
    static $dbh;
    try {
        $config = getConfig()['mysql'];
        if ($dbh == null) {
            $dbms = 'mysql';     //数据库类型
            $host = $config['host']; //数据库主机名
            $dbName = $config['dbname'];    //使用的数据库
            $user = $config['user'];      //数据库连接用户名
            $pass = $config['password'];          //对应的密码
            $dsn = "$dbms:host=$host;dbname=$dbName";
            $dbh = new PDO($dsn, $user, $pass); //初始化一个PDO对象
        }
        return $dbh;
    } catch (PDOException $e) {
        die("Error!: " . $e->getMessage() . "<br/>");
    }
}

function recorderFilePath($filename)
{
    return __DIR__ . "/../../storage/files/recorder/" . $filename;
}

function recoginzerFilePath($filename)
{
    return __DIR__ . "/../../storage/files/recognizer/" . $filename;
}

function getAccessFile($filename)
{
    return "/storage/files/recorder/" . $filename;
}

function ajaxSuccess($msg = '执行成功', $data = [])
{
    header('Content-Type:application/json; charset=utf-8');
    $arr = [
        'error_code' => 0,
        'msg' => $msg,
        'data' => $data
    ];

    exit(json_encode($arr, JSON_UNESCAPED_UNICODE));
}


function ajaxError($errorCode = 400400, $msg = '执行失败', $data = [])
{
    header('Content-Type:application/json; charset=utf-8');
    $arr = [
        'error_code' => $errorCode,
        'msg' => $msg,
        'data' => $data
    ];

    exit(json_encode($arr, JSON_UNESCAPED_UNICODE));
}

function logInfo($text)
{
    $filename = date('Y-m-d') . '.log';
    $logFile = __DIR__ . '/../../storage/logs/' . $filename;
    $fd = fopen($logFile, "a");
    $text = '[' . date('Y-m-d H:i:s') . '] ' . $text . PHP_EOL;
    fwrite($fd, $text);
    fclose($fd);
}

function logError($text)
{
    $filename = 'error_'.date('Y-m-d') . '.log';
    $logFile = __DIR__ . '/../../storage/logs/' . $filename;
    $fd = fopen($logFile, "a");
    $text = '[' . date('Y-m-d H:i:s') . '] ' . $text . PHP_EOL;
    fwrite($fd, $text);
    fclose($fd);
}

function customException($exception)
{
    logError($exception);
    throw $exception;
}