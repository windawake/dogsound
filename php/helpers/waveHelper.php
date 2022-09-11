<?php

require_once __DIR__."/../lib/FFT.class.php";

function getWaveEnd($buffers)
{

    $waveHeader = [];
    $waveHeader['riff']  = substr($buffers, 0, 4);
    $waveHeader['overallSize'] = unpack("V", substr($buffers, 4, 4))[1];
    $waveHeader['wave'] = substr($buffers, 8, 4);
    $waveHeader['fmtMarker'] = substr($buffers, 12, 4);
    $waveHeader['fmtLength'] = unpack("V", substr($buffers, 16, 4))[1];
    $waveHeader['formatType'] = unpack("v", substr($buffers, 20, 2))[1];
    $waveHeader['channels'] = unpack("v", substr($buffers, 22, 2))[1];
    $waveHeader['sampleRate'] = unpack("V", substr($buffers, 24, 4))[1];
    $waveHeader['byteRate'] = unpack("V", substr($buffers, 28, 4))[1];
    $waveHeader['blockAlign'] = unpack("v", substr($buffers, 32, 2))[1];
    $waveHeader['bitsPerSample'] = unpack("v", substr($buffers, 34, 2))[1];
    $waveHeader['dataMarker'] = substr($buffers, 36, 4);
    $waveHeader['dataSize'] = unpack("V", substr($buffers, 40, 4))[1];

    $waveHeader['sizeOfEachSample'] = ($waveHeader['channels'] * $waveHeader['bitsPerSample']) / 8;
    $waveHeader['bytesInEachChannel'] = $waveHeader['sizeOfEachSample']  / $waveHeader['channels'];
    $waveHeader['numSamples'] = $waveHeader['dataSize'] / $waveHeader['sizeOfEachSample'];

    if ($waveHeader['formatType'] != 1) {
        die("只支持pcm");
    }

    if ($waveHeader['bitsPerSample'] != 16) {
        die("只支持16位");
    }

    $highLimit = 32767;
    $stepLen = 512;
    $stepStart = 0;
    $stepEnd = 0;
    $sampleArr = [];
    $hasStart = false;
    $hasEnd = false;

    $waveEndpoint = "";
    for ($i = 0; $i < $waveHeader['numSamples']; $i+=$stepLen) {
        $energyStart = 0;
        $energyEnd = 0;
        $zeroPass = 0;
        $lastValSample = 0;
        $lastStep = floor($waveHeader['numSamples']/$stepLen) * $stepLen;

        if ($stepEnd != 0 && $i > $stepEnd) {
            break;
        }

        
        for($j=0; $j<$stepLen; $j++) {
            if (($i + $j + $stepLen) > $waveHeader['numSamples']) continue;

            $offset = 44 + $waveHeader['sizeOfEachSample'] * ($i + $j);
            $valSample = unpack("v", substr($buffers, $offset, 2))[1];
            $valSample = toInt16($valSample);

            $energyStart += abs($valSample);
            $sampleArr[$i+$j] = $valSample;
            
            if (($lastValSample >0 && $valSample <=0) || ($lastValSample <0 && $valSample >=0)) {
                $zeroPass++;
            }
            $lastValSample = $valSample;

            if ($stepEnd == 0) {
                $offset = 44 + $waveHeader['sizeOfEachSample'] * ($lastStep  - ($i + $j) - 1);
                $valSample = unpack("v", substr($buffers, $offset, 2))[1];
                $valSample = toInt16($valSample);
    
                $energyEnd += abs($valSample);
            }
        }

        if ($stepStart == 0 && $energyStart/($highLimit * $stepLen) > 0.03) {
            $stepStart = $i;
            $hasStart = true;
        }

        if ($stepEnd == 0 && $energyEnd/($highLimit * $stepLen) > 0.03) {
            $stepEnd =  $lastStep - ($i + $stepLen);
            $hasEnd = true;
        }

        if ($hasStart) {
            $waveEndpoint .= sprintf("R%d#%0.2f#%0.2f", $i, $energyStart/($highLimit * $stepLen), $zeroPass/$stepLen);
        }
    }

    
    $absCount = 16;
    $midLen = 8 * 1024;
    $midCount = intval(($stepEnd - $stepStart)/$midLen);
    $absFft = [];
    $sampleStart = 0;
    for($i=0; $i<$midCount; $i++) {
        $sampleStart = $stepStart + $midLen*$i;
        $rangeSampleArr = [];
        $rangeLen = 8;
        for ($i2 = 0; $i2 < $midLen; $i2+=$rangeLen) {
            $rangeSampleArr[] = $sampleArr[$sampleStart + $i2]/$highLimit;
        }

        // $sampleArr = array_slice($sampleArr, $stepStart, $stepEnd - $stepStart);
        $exp = round(log(count($rangeSampleArr), 2));

        $len = pow(2, $exp);
        $subLen = $len - count($rangeSampleArr);
        if ($subLen > 0) {
            for ($i3 =0; $i3 < $subLen; $i3++) {
                $rangeSampleArr[] = 0;
            }
        } else {
            $rangeSampleArr = array_slice($rangeSampleArr, 0, $len);
        }
        

        $fft = new FFT(count($rangeSampleArr));
        // Calculate the FFT of the function $f
        $w = $fft->fft($rangeSampleArr);
        $abs = $fft->getAbsFFT($w);
        $abs = array_slice($abs, 0, count($abs)/2);
        arsort($abs);
        $absRange = [];
        $count = 0;
        foreach ($abs as $key => $val) {
            if ($count == $absCount) {
                break;
            }
            $absRange[$key] = [number_format($val, 3), $count];
            $count++;
        }
        $absFft[$sampleStart] = $absRange;
    }

    $ret = [
        'endpoint' => $waveEndpoint,
        'absFft' =>  $absFft
    ];

    return $ret;
}

function toInt16($num)
{
    $int1 = $num & 32767;
    $int2 = ($num >> 15) & 65535;
    if ($int2 == 1) {
        $int1 = $int1 - 32767 - 1;
    }

    return $int1;
}

function getWaveAggregate($endPointWave)
{
    $arrLine = explode("R", substr($endPointWave, 1, -1));
    $lastWave = explode('#', $arrLine[0]);
    $startPos = $lastWave[0];
    $rangeCount = 0;
    $rangeEnergy = 0;
    $rangeZeroRate = 0;
    $arrAgg = [];
    $arrIndex = 0;

    for ($i = 1; $i < count($arrLine) - 3; $i++) {
        $curWave = explode('#', $arrLine[$i]);
        $nextWave = explode('#', $arrLine[$i+1]);
        $rangeEnergy += $curWave[1];
        $rangeZeroRate += $curWave[2];

        $rangeCount++;
        // 爆破音
        if ($curWave[1] > 0 && $curWave[2]/$curWave[1] > 3) {
            $arrAgg[$arrIndex] = [$startPos, number_format($rangeEnergy/$rangeCount, 2), number_format($rangeZeroRate/ $rangeCount, 2), $rangeCount];

            $startPos = $nextWave[0];
            $rangeCount = 0;
            $rangeEnergy = 0;
            $rangeZeroRate = 0;
            $arrIndex++;
        }

        
    }
    
    if ($rangeCount) {
        $arrAgg[] = [$startPos, number_format($rangeEnergy/$rangeCount, 2), number_format($rangeZeroRate/$rangeCount, 2), $rangeCount];
    }
    
    $newAgg = [];
    foreach ($arrAgg as $item) {
        // 样本太小过滤
        if ($item[3] > 10) {
            $newAgg[] = $item;
        }
    }
    return $newAgg;
}

function matchWaveResult($currentWave, $matchWave)
{
    $arrWaveAgg02 = getWaveAggregate($matchWave['endpoint']);
    $arrWaveAgg01 = getWaveAggregate($currentWave['endpoint']);
    

    $arrFft01 = array_values($currentWave['absFft']);
    $arrFft02 = array_values($matchWave['absFft']);

    // $energyMatchTotal = max(count($arrWaveAgg01), count($arrWaveAgg02));
    // $energyMatchSuccess = 0;
    
    // // 能量匹配一般都是100%，不是100%说明差距很大
    // foreach ($arrWaveAgg01 as $index => $item01) {
    //     if (!isset($arrWaveAgg02[$index])) {
    //         continue;
    //     }
    //     $item02 = $arrWaveAgg02[$index];
    //     $sub = abs($item01[1]/max($item02[1], 0.01) - $item01[2]/max($item02[2], 0.01));
    //     if ($sub < 1) {
    //         $energyMatchSuccess++;
    //     }
    // }
    
    // 爆破音
    $energyMatchTotal = max(count($arrWaveAgg01), count($arrWaveAgg02));
    $energyMatchSuccess = min(count($arrWaveAgg01), count($arrWaveAgg02));

    $fftMatchTotal = 0;
    $fftMatchSuccess = 0;
    foreach ($arrFft01 as $index => $absArr01) {
        if (!isset($arrFft02[$index])) {
            break;
        }
        $absArr02 = $arrFft02[$index];
        $checkCount = 0;
        $checkTotal = count($absArr01)/2;
        $fftMatchTotal += $checkTotal;
        foreach ($absArr01 as $frequecy => $amptitude01) {
            if ($checkCount > $checkTotal) {
                break;
            }
            $checkCount++;

            $matchFrequecy = 0;
            if (isset($absArr02[$frequecy])) $matchFrequecy = $frequecy;
            if (!$matchFrequecy && isset($absArr02[$frequecy+1])) $matchFrequecy = $frequecy+1;
            if (!$matchFrequecy && isset($absArr02[$frequecy-1])) $matchFrequecy = $frequecy-1;

            if ($matchFrequecy > 0) {
                $amptitude02 = $absArr02[$matchFrequecy];
                // 频率所在位置
                if (abs($amptitude02[1] - $amptitude01[1]) <= $checkTotal) {
                    $fftMatchSuccess++;
                    unset($absArr02[$matchFrequecy]);
                }
            }
        }
    }

    $matchTotal = $fftMatchTotal;
    $matchSuccess = $fftMatchSuccess * ($energyMatchSuccess / $energyMatchTotal);

    $result = [
        'matchTotal' => $matchTotal,
        'matchSuccess' => $matchSuccess,
        'matchRate' => $matchTotal == 0 ? 0 : $matchSuccess/$matchTotal
    ];

    return $result;
}