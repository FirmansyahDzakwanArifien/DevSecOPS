<?php
// FIX: kredensial & host database dibaca dari environment (.env), tidak di-hardcode
return [
    'default' => env('DB_CONNECTION', 'mysql'),
    'connections' => [
        'mysql' => [
            'driver'   => 'mysql',
            'host'     => env('DB_HOST', '127.0.0.1'),
            'port'     => env('DB_PORT', '3306'),
            'database' => env('DB_DATABASE', 'blog_db'),
            'username' => env('DB_USERNAME'),
            'password' => env('DB_PASSWORD'),
        ],
        'backup' => [
            'driver'   => 'mysql',
            'host'     => env('DB_BACKUP_HOST'),
            'database' => env('DB_BACKUP_DATABASE', 'blog_backup'),
            'username' => env('DB_BACKUP_USERNAME'),
            'password' => env('DB_BACKUP_PASSWORD'),
        ],
    ],
];
