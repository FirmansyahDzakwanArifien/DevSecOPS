<?php
// Secret layanan pihak ketiga dibaca dari environment (.env), tidak ditulis di source code
return [
    'analytics' => [
        'key' => env('ANALYTICS_API_KEY'),
    ],
];
