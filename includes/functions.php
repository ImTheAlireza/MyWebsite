<?php

function e($value)
{
    return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
}

function asset($path)
{
    $scriptName = isset($_SERVER['SCRIPT_NAME']) ? $_SERVER['SCRIPT_NAME'] : '';
    $base = rtrim(dirname($scriptName), '/\\');
    return ($base === '' ? '' : $base) . '/assets/' . ltrim($path, '/');
}
