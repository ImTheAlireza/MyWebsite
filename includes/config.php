<?php

require_once __DIR__ . '/content.php';

$content = load_content();

$site = isset($content['site']) && is_array($content['site']) ? $content['site'] : array();
$nav = isset($content['nav']) && is_array($content['nav']) ? $content['nav'] : array();
$works = isset($content['works']) && is_array($content['works']) ? $content['works'] : array();
$services = isset($content['services']) && is_array($content['services']) ? $content['services'] : array();
$about = isset($content['about']) && is_array($content['about']) ? $content['about'] : array();
$contact = isset($content['contact']) && is_array($content['contact']) ? $content['contact'] : array();
