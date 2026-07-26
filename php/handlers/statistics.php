<?php
// php/handlers/statistics.php — Statistics handler (PHP 5.6+ compatible)

// GET /api/statistics
function get_statistics() {
    require_auth();

    $projectsData = json_read('projects.json');
    $settings = json_read('settings.json');
    if (!is_array($settings)) $settings = array();
    $messagesData = json_read('messages.json');
    $trackingData = json_read('tracking.json');
    $likesData = json_read('likes.json');

    $allProjects = arr_get($projectsData, 'projects', array());
    $allProjects = array_map('normalize_project', $allProjects);
    usort($allProjects, function($a, $b) {
        $fa = $a['featured'] ? 1 : 0;
        $fb = $b['featured'] ? 1 : 0;
        $fo = $fb - $fa;
        if ($fo !== 0) return $fo;
        return (arr_get($a, 'order', 0)) - (arr_get($b, 'order', 0));
    });

    // Categories
    $categories = array();
    foreach ($allProjects as $p) {
        $cat = arr_get($p, 'category', '') ?: 'Uncategorized';
        if (!isset($categories[$cat])) $categories[$cat] = 0;
        $categories[$cat]++;
    }

    $skills = array_filter(array_map('trim', explode(',', arr_get($settings, 'aboutSkills', ''))));

    // Assets
    $assetsCount = 0;
    $orphanCount = 0;
    $uploadsDir = __DIR__ . '/../../uploads';
    if (is_dir($uploadsDir)) {
        $used = collect_used_upload_urls();
        $files = array_values(array_diff(scandir($uploadsDir), array('.', '..')));
        $assetsCount = count($files);
        $orphanCount = count(array_filter($files, function($f) use ($used) {
            return !in_array($f, $used);
        }));
    }

    // Tracking
    $events = arr_get($trackingData, 'events', array());
    $visitors = arr_get($trackingData, 'visitors', array());
    $totalViews = 0;
    $totalLikes = 0;
    $resumeDownloads = 0;
    $projectClicks = array();
    $locationCounts = array();
    $pageViews = array();

    foreach ($events as $e) {
        $eType = arr_get($e, 'type', '');
        if ($eType === 'pageview') $totalViews++;
        if ($eType === 'resume_download') $resumeDownloads++;
        if ($eType === 'project_click' && !empty($e['projectId'])) {
            $pid = $e['projectId'];
            if (!isset($projectClicks[$pid])) $projectClicks[$pid] = 0;
            $projectClicks[$pid]++;
        }
        $eLoc = arr_get($e, 'location', '');
        if ($eLoc) {
            if (!isset($locationCounts[$eLoc])) $locationCounts[$eLoc] = 0;
            $locationCounts[$eLoc]++;
        }
        $ePage = arr_get($e, 'page', '');
        if ($eType === 'pageview' && $ePage) {
            if (!isset($pageViews[$ePage])) $pageViews[$ePage] = 0;
            $pageViews[$ePage]++;
        }
    }

    // Average session time
    $sessions = array();
    foreach ($events as $e) {
        if (arr_get($e, 'type', '') === 'heartbeat') {
            $sid = arr_get($e, 'sessionId', 'anon');
            $ts = arr_get($e, 'timestamp', '');
            if (!isset($sessions[$sid])) {
                $sessions[$sid] = array('first' => $ts, 'last' => $ts);
            }
            $sessions[$sid]['last'] = $ts;
        }
    }
    $durations = array();
    foreach ($sessions as $s) {
        $d = strtotime($s['last']) - strtotime($s['first']);
        if ($d > 0 && $d < 7200) $durations[] = $d;
    }
    $avgTimeSpent = !empty($durations) ? round(array_sum($durations) / count($durations)) : 0;

    // Likes per project (format: { projectId: [visitorId, ...] })
    $likesPerProject = array();
    $likesArr = arr_get($likesData, 'likes', array());
    if (is_array($likesArr)) {
        foreach ($likesArr as $pid => $visitors) {
            if (is_array($visitors)) {
                $likesPerProject[$pid] = count($visitors);
                $totalLikes += count($visitors);
            }
        }
    }

    // Top locations — convert to [[loc, count], ...] for frontend
    arsort($locationCounts);
    $topLocations = array();
    foreach (array_slice($locationCounts, 0, 10, true) as $loc => $count) {
        $topLocations[] = array($loc, $count);
    }

    // Project titles map
    $projectTitles = array();
    foreach ($allProjects as $p) {
        $projectTitles[(string)$p['id']] = $p['title'];
    }

    // Published/draft counts
    $publishedCount = 0;
    $draftCount = 0;
    foreach ($allProjects as $p) {
        if ($p['published'] !== false) $publishedCount++;
        else $draftCount++;
    }

    send_json(array(
        'projectCount' => count($allProjects),
        'publishedCount' => $publishedCount,
        'draftCount' => $draftCount,
        'experienceCount' => is_array(arr_get($settings, 'experience', null)) ? count($settings['experience']) : 0,
        'educationCount' => is_array(arr_get($settings, 'education', null)) ? count($settings['education']) : 0,
        'messageCount' => count(arr_get($messagesData, 'messages', array())),
        'unreadCount' => count(array_filter(arr_get($messagesData, 'messages', array()), function($m) {
            return !$m['read'];
        })),
        'skillCount' => count($skills),
        'assetsCount' => $assetsCount,
        'orphanCount' => $orphanCount,
        'categories' => $categories,
        'recentProjects' => array_slice($allProjects, 0, 5),
        'allProjects' => array_map(function($p) {
            return array(
                'id' => $p['id'], 'title' => $p['title'], 'category' => arr_get($p, 'category', ''),
                'year' => arr_get($p, 'year', ''), 'thumbnail' => arr_get($p, 'thumbnail', ''),
                'published' => $p['published'], 'featured' => $p['featured'],
            );
        }, $allProjects),
        'projectTitles' => $projectTitles,
        'totalViews' => $totalViews,
        'uniqueVisitors' => count($visitors),
        'totalLikes' => $totalLikes,
        'resumeDownloads' => $resumeDownloads,
        'projectClicks' => $projectClicks,
        'topLocations' => $topLocations,
        'avgTimeSpent' => $avgTimeSpent,
        'pageViews' => $pageViews,
        'likesPerProject' => $likesPerProject,
    ));
}
