<?php
namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken as Middleware;

class VerifyCsrfToken extends Middleware
{
    /**
     * The URIs that should be excluded from CSRF verification.
     * FIX: tidak ada pengecualian, semua request yang mengubah data wajib membawa token CSRF.
     */
    protected $except = [];
}
