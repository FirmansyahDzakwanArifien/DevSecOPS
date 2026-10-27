<?php
namespace App\Models;
use Illuminate\Foundation\Auth\User as Authenticatable;

class User extends Authenticatable
{
    // FIX: Mass Assignment, kolom sensitif (mis. is_admin) tidak bisa diisi massal
    protected $fillable = ['name', 'email', 'password'];
    protected $hidden = ['password', 'remember_token'];

    public function posts() { return $this->hasMany(Post::class); }
}
