<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Symfony\Component\Process\Process;

class AdminController extends Controller
{
    // FIX: API key analytics & password SMTP tidak lagi ditulis di source code.
    // Nilainya disimpan di .env dan dibaca lewat config('services.analytics.key')
    // serta config('mail.mailers.smtp.password') saat dibutuhkan.

    // FIX: Command Injection, host divalidasi, perintah dijalankan sebagai array argumen (tanpa shell)
    public function pingServer(Request $request)
    {
        $validated = $request->validate([
            'host' => ['required', 'string', 'max:253', 'regex:/^[A-Za-z0-9.-]+$/'],
        ]);

        $process = new Process(['ping', '-c', '4', $validated['host']]);
        $process->setTimeout(15);
        $process->run();

        return response()->json(['result' => $process->getOutput()]);
    }

    // FIX: Command Injection, parameter di-whitelist, artisan dipanggil lewat API (tanpa shell)
    public function generateReport(Request $request)
    {
        $validated = $request->validate([
            'format' => ['sometimes', 'in:pdf,csv,xlsx'],
            'month'  => ['required', 'date_format:Y-m'],
        ]);

        Artisan::call('report:generate', [
            '--format' => $validated['format'] ?? 'pdf',
            '--month'  => $validated['month'],
        ]);

        return response()->json(['output' => Artisan::output()]);
    }
}
