<?php
// php/db.php — Persistent content storage (PHP 5.6+ compatible)
// Projects, project details, and panel settings are stored in SQLite when the
// extension is available. JSON remains a migration/compatibility fallback.

define('DATA_DIR', __DIR__ . '/../data');
define('PROJECT_DB_PATH', DATA_DIR . '/.portfolio.sqlite');

function json_file_read($filename) {
    $path = DATA_DIR . '/' . $filename;
    if (!file_exists($path)) return null;
    $content = file_get_contents($path);
    if ($content === false) return null;
    return json_decode($content, true);
}

function json_encode_pretty($data) {
    $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    if ($json === false) {
        send_error('Failed to encode data', 500);
    }
    return $json;
}

function json_file_write($filename, $data, $required) {
    if (!is_dir(DATA_DIR) && !@mkdir(DATA_DIR, 0755, true)) {
        if ($required) send_error('Failed to create data directory', 500);
        return false;
    }

    $path = DATA_DIR . '/' . $filename;
    $json = json_encode_pretty($data);
    $tmp = @tempnam(DATA_DIR, '.content-');
    if ($tmp === false) {
        if ($required) send_error('Failed to create temporary data file', 500);
        return false;
    }

    $written = @file_put_contents($tmp, $json, LOCK_EX);
    if ($written === false || $written !== strlen($json)) {
        @unlink($tmp);
        if ($required) send_error('Failed to write data file', 500);
        return false;
    }

    @chmod($tmp, 0644);
    if (!@rename($tmp, $path)) {
        @unlink($tmp);
        if ($required) send_error('Failed to replace data file', 500);
        return false;
    }

    return true;
}

function project_db_replace_on_connection($db, $projects) {
    if (!is_array($projects)) $projects = array();
    if (!$db->exec('BEGIN IMMEDIATE TRANSACTION')) return false;

    if (!$db->exec('DELETE FROM projects')) {
        $db->exec('ROLLBACK');
        return false;
    }

    $statement = $db->prepare(
        'INSERT INTO projects (id, payload, published, featured, sort_order, created_at, updated_at) ' .
        'VALUES (:id, :payload, :published, :featured, :sort_order, :created_at, :updated_at)'
    );
    if (!$statement) {
        $db->exec('ROLLBACK');
        return false;
    }

    foreach ($projects as $project) {
        if (!is_array($project)) continue;
        $id = isset($project['id']) && $project['id'] !== '' ? (string)$project['id'] : generate_uuid();
        $project['id'] = $id;
        $payload = json_encode($project, JSON_UNESCAPED_UNICODE);
        if ($payload === false) {
            $db->exec('ROLLBACK');
            return false;
        }

        $statement->reset();
        if (method_exists($statement, 'clear')) $statement->clear();
        $statement->bindValue(':id', $id, SQLITE3_TEXT);
        $statement->bindValue(':payload', $payload, SQLITE3_TEXT);
        $statement->bindValue(':published', isset($project['published']) && $project['published'] === false ? 0 : 1, SQLITE3_INTEGER);
        $statement->bindValue(':featured', isset($project['featured']) && $project['featured'] === true ? 1 : 0, SQLITE3_INTEGER);
        $statement->bindValue(':sort_order', isset($project['order']) ? intval($project['order']) : 0, SQLITE3_INTEGER);
        $statement->bindValue(':created_at', isset($project['createdAt']) ? (string)$project['createdAt'] : '', SQLITE3_TEXT);
        $statement->bindValue(':updated_at', isset($project['updatedAt']) ? (string)$project['updatedAt'] : '', SQLITE3_TEXT);
        $result = $statement->execute();
        if ($result === false) {
            $db->exec('ROLLBACK');
            return false;
        }
        if (is_object($result)) $result->finalize();
    }

    return $db->exec('COMMIT');
}

function settings_db_write_on_connection($db, $settings) {
    if (!is_array($settings)) return false;
    $payload = json_encode($settings, JSON_UNESCAPED_UNICODE);
    if ($payload === false) return false;

    $statement = $db->prepare(
        'INSERT OR REPLACE INTO site_settings (settings_id, payload, updated_at) ' .
        'VALUES (1, :payload, :updated_at)'
    );
    if (!$statement) return false;
    $statement->bindValue(':payload', $payload, SQLITE3_TEXT);
    $statement->bindValue(':updated_at', date('c'), SQLITE3_TEXT);
    $result = $statement->execute();
    if ($result === false) return false;
    if (is_object($result)) $result->finalize();
    return true;
}

function settings_db_read_on_connection($db) {
    $statement = $db->prepare('SELECT payload FROM site_settings WHERE settings_id = 1');
    if (!$statement) return null;
    $result = $statement->execute();
    if ($result === false) return null;
    $row = $result->fetchArray(SQLITE3_ASSOC);
    $result->finalize();
    if (!$row || !isset($row['payload'])) return null;
    $settings = json_decode($row['payload'], true);
    return is_array($settings) ? $settings : null;
}

function project_db_connection() {
    static $initialized = false;
    static $connection = null;

    if ($initialized) return $connection;
    $initialized = true;

    if (!class_exists('SQLite3')) {
        error_log('SQLite3 extension unavailable; projects are using the JSON compatibility store.');
        return null;
    }

    if (!is_dir(DATA_DIR) && !@mkdir(DATA_DIR, 0755, true)) {
        error_log('Unable to create data directory for the project database.');
        return null;
    }

    try {
        $db = new SQLite3(PROJECT_DB_PATH, SQLITE3_OPEN_READWRITE | SQLITE3_OPEN_CREATE);
        $db->busyTimeout(5000);
        $db->exec('PRAGMA journal_mode = WAL');
        $db->exec('PRAGMA synchronous = FULL');
        $created = $db->exec(
            'CREATE TABLE IF NOT EXISTS projects (' .
            'id TEXT PRIMARY KEY NOT NULL, ' .
            'payload TEXT NOT NULL, ' .
            'published INTEGER NOT NULL DEFAULT 1, ' .
            'featured INTEGER NOT NULL DEFAULT 0, ' .
            'sort_order INTEGER NOT NULL DEFAULT 0, ' .
            'created_at TEXT, ' .
            'updated_at TEXT' .
            ')'
        );
        $settingsCreated = $db->exec(
            'CREATE TABLE IF NOT EXISTS site_settings (' .
            'settings_id INTEGER PRIMARY KEY NOT NULL, ' .
            'payload TEXT NOT NULL, updated_at TEXT' .
            ')'
        );
        $metadataCreated = $db->exec(
            'CREATE TABLE IF NOT EXISTS storage_meta (' .
            'meta_key TEXT PRIMARY KEY NOT NULL, meta_value TEXT NOT NULL' .
            ')'
        );
        if (!$created || !$settingsCreated || !$metadataCreated) {
            throw new Exception('Unable to create content database tables');
        }
        $db->exec('CREATE INDEX IF NOT EXISTS idx_projects_order ON projects(featured DESC, sort_order ASC)');

        // One-time migration: seed a new database from the existing JSON file.
        // The marker prevents intentionally deleted projects from being restored.
        $migrationDone = $db->querySingle(
            "SELECT meta_value FROM storage_meta WHERE meta_key = 'projects_json_migrated'"
        );
        if ((string)$migrationDone !== '1') {
            $count = intval($db->querySingle('SELECT COUNT(*) FROM projects'));
            if ($count === 0) {
                $legacy = json_file_read('projects.json');
                $legacyProjects = is_array($legacy) && isset($legacy['projects']) && is_array($legacy['projects'])
                    ? $legacy['projects']
                    : array();
                if (!empty($legacyProjects) && !project_db_replace_on_connection($db, $legacyProjects)) {
                    throw new Exception('Failed to migrate projects.json into SQLite');
                }
            }
            $db->exec(
                "INSERT OR REPLACE INTO storage_meta (meta_key, meta_value) " .
                "VALUES ('projects_json_migrated', '1')"
            );
        }

        // Categories and the rest of the panel settings belong to the same
        // persistent database so deployments cannot restore old defaults.
        $settingsMigrationDone = $db->querySingle(
            "SELECT meta_value FROM storage_meta WHERE meta_key = 'settings_json_migrated'"
        );
        if ((string)$settingsMigrationDone !== '1') {
            $storedSettings = settings_db_read_on_connection($db);
            if ($storedSettings === null) {
                $legacySettings = json_file_read('settings.json');
                if (is_array($legacySettings) && !settings_db_write_on_connection($db, $legacySettings)) {
                    throw new Exception('Failed to migrate settings.json into SQLite');
                }
            }
            $db->exec(
                "INSERT OR REPLACE INTO storage_meta (meta_key, meta_value) " .
                "VALUES ('settings_json_migrated', '1')"
            );
        }

        @chmod(PROJECT_DB_PATH, 0660);
        $connection = $db;
        return $connection;
    } catch (Exception $error) {
        error_log('Project database initialization failed: ' . $error->getMessage());
        $connection = null;
        return null;
    }
}

function project_db_read_all($db) {
    $projects = array();
    $result = $db->query(
        'SELECT payload FROM projects ' .
        'ORDER BY featured DESC, sort_order ASC, created_at DESC'
    );
    if ($result === false) return null;

    while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
        $project = json_decode($row['payload'], true);
        if (is_array($project)) $projects[] = $project;
    }
    $result->finalize();
    return $projects;
}

function json_read($filename) {
    if ($filename === 'projects.json' || $filename === 'settings.json') {
        $db = project_db_connection();
        if ($db !== null) {
            if ($filename === 'projects.json') {
                $projects = project_db_read_all($db);
                if ($projects !== null) {
                    // Brands are portfolio metadata and are retained in the JSON mirror
                    // while project records themselves live in SQLite.
                    $mirror = json_file_read('projects.json');
                    $brands = is_array($mirror) && isset($mirror['brands']) && is_array($mirror['brands']) ? $mirror['brands'] : array();
                    return array('projects' => $projects, 'brands' => $brands);
                }
                error_log('Failed to read projects from SQLite; falling back to JSON.');
            } else {
                $settings = settings_db_read_on_connection($db);
                if ($settings !== null) return $settings;
                error_log('Failed to read settings from SQLite; falling back to JSON.');
            }
        }
    }

    return json_file_read($filename);
}

function json_write($filename, $data) {
    if ($filename === 'projects.json' || $filename === 'settings.json') {
        $db = project_db_connection();
        if ($db !== null) {
            if ($filename === 'projects.json') {
                $projects = is_array($data) && isset($data['projects']) && is_array($data['projects'])
                    ? $data['projects']
                    : array();
                if (!project_db_replace_on_connection($db, $projects)) {
                    send_error('Failed to save projects in the database', 500);
                }
                // Keep a best-effort JSON mirror for backup and host portability.
                // Preserve brand metadata in the mirror as it is not part of the legacy projects table.
                $brands = is_array($data) && isset($data['brands']) && is_array($data['brands']) ? $data['brands'] : array();
                json_file_write($filename, array('projects' => $projects, 'brands' => $brands), false);
            } else {
                if (!settings_db_write_on_connection($db, $data)) {
                    send_error('Failed to save settings in the database', 500);
                }
                json_file_write($filename, $data, false);
            }
            return;
        }
    }

    json_file_write($filename, $data, true);
}

function generate_uuid() {
    // random_bytes() only exists in PHP 7+. Keep uploads working on the
    // PHP 5.6 hosts supported by this project by using OpenSSL when needed.
    if (function_exists('random_bytes')) {
        $data = random_bytes(16);
    } elseif (function_exists('openssl_random_pseudo_bytes')) {
        $data = openssl_random_pseudo_bytes(16);
    } else {
        // Last-resort compatibility fallback for hosts without OpenSSL.
        $seed = uniqid((string)mt_rand(), true) . microtime(true);
        $data = substr(hash('sha256', $seed, true), 0, 16);
    }

    if ($data === false || strlen($data) < 16) {
        $seed = uniqid((string)mt_rand(), true) . microtime(true);
        $data = substr(hash('sha256', $seed, true), 0, 16);
    }

    $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
    $data[8] = chr(ord($data[8]) & 0x3f | 0x80);
    return vsprintf('%s%s-%s-%s-%s-%s%s', str_split(bin2hex($data), 4));
}
