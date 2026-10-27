<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;

class FileController extends Controller
{
    // FIX: Path Traversal, path di-resolve dengan realpath() lalu dipastikan tetap di dalam direktori yang diizinkan
    private function safePath(string $baseDir, ?string $relative): string
    {
        $base = realpath($baseDir);
        $full = realpath($baseDir . DIRECTORY_SEPARATOR . (string) $relative);
        abort_if($base === false || $full === false || !str_starts_with($full, $base . DIRECTORY_SEPARATOR), 404);
        return $full;
    }

    public function download(Request $request)
    {
        $path = $this->safePath(storage_path('app/public'), $request->input('file'));
        return response()->download($path);
    }

    public function previewImage(Request $request)
    {
        $path = $this->safePath(storage_path('app/public/images'), $request->input('path'));
        abort_unless(in_array(mime_content_type($path), ['image/jpeg', 'image/png'], true), 415);
        return response()->file($path);
    }
}
