<?php
namespace App\Http\Controllers;

use App\Models\Menu;
use App\Models\Roles;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class RolesController extends Controller
{
    public function roleStore(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:50|unique:roles,name',
            'description' => 'nullable|string|max:100',
        ]);

        \App\Models\Roles::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'name' => $request->name,
            'description' => $request->description,
            'created_by' => Auth::id(),
            'deleted'    => 0,
        ]);

        return back()->with('success', 'Role Created');
    }
}

?>