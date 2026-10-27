<?php
namespace App\Http\Controllers;

use App\Models\Post;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ArticleController extends Controller
{
    // FIX: SQL Injection, memakai parameter binding
    public function search(Request $request)
    {
        $keyword = '%' . $request->input('q', '') . '%';
        $articles = DB::select("SELECT * FROM posts WHERE title LIKE ? OR content LIKE ?", [$keyword, $keyword]);
        return response()->json($articles);
    }

    // FIX: SQL Injection, category di-binding, kolom sort di-whitelist
    public function filterByCategory(Request $request)
    {
        $validated = $request->validate([
            'category' => ['required', 'string', 'max:50'],
            'sort'     => ['sometimes', 'in:created_at,title'],
        ]);

        $posts = Post::where('category', $validated['category'])
            ->orderByDesc($validated['sort'] ?? 'created_at')
            ->get();
        return response()->json($posts);
    }

    // FIX: IDOR, hanya pemilik post yang boleh menghapus
    public function deletePost(Request $request, $id)
    {
        $post = Post::findOrFail($id);
        abort_unless((int) $post->user_id === (int) session('user_id'), 403);
        $post->delete();
        return response()->json(['message' => 'Post deleted']);
    }

    // FIX: Mass Assignment, hanya field yang divalidasi, user_id diambil dari sesi
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title'    => ['required', 'string', 'max:255'],
            'content'  => ['required', 'string'],
            'category' => ['required', 'string', 'max:50'],
        ]);

        $post = Post::create($validated + ['user_id' => session('user_id')]);
        return response()->json($post);
    }
}
