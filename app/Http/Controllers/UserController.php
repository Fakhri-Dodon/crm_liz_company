<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Roles;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Illuminate\Support\Facades\Mail;
use App\Models\EmailLogs;
use App\Models\EmailTemplates;
use App\Mail\SystemMail;

class UserController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $users = User::with(['role'])->where('deleted', 0)->get();
        $roles = Roles::where('deleted', 0)->get();
        $templates = EmailTemplates::where('deleted', 0)->get();

        return Inertia::render('Users/Index', [
            'users' => $users,
            'roles' => $roles,
            'templates' => $templates,
            'auth_permissions' => auth()->user()->getPermissions('USER'),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        // dd($request);

        $validated = $request->validate([
            'role_id'   => 'required',
            'name'      => 'required|string|max:100',
            'position'  => 'required|string|max:100',
            'password'  => 'required|string|max:255',
            'email'     => 'required|string|email',
            'phone'     => 'required|string|max:20',
        ]); 

        User::create($validated);

        return redirect()->back()->with('message', 'Add New User Successfully');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $user = User::where('id', $id)
                ->where('deleted', 0)
                ->firstOrFail();

        $rules = [
            'name' => 'required',
            'position' => 'required',
            'email' => "required|email|unique:users,email,{$id}",
            'role_id' => 'required',
            'phone' => 'nullable',
        ];

        if ($request->filled('password')) {
            $rules['password'] = 'min:8';
        }

        $validated = $request->validate($rules);

        // If password provided, hash it. If not provided, ensure we don't overwrite existing password.
        if ($request->filled('password')) {
            $validated['password'] = bcrypt($request->password);
        } else {
            unset($validated['password']);
        }

        $user->update($validated);

        return redirect()->back()->with('message', 'User updated successfully');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $userTarget = User::findOrFail($id);

        if ($userTarget->deleted == 1) {
            return redirect()->route('user.index')
                ->with('error', 'User already deleted.');
        }

        $user = Auth::user();

        $userTarget->deleted_by = $user->id;
        $userTarget->deleted = 1;
        $userTarget->deleted_at = now();
        $userTarget->save();

        return redirect()->route('user.index')
            ->with('success', 'User deleted successfully!');
    }

    public function sendUserEmail(Request $request, $id)
    {
        // dd($request->all());

        if (!$request->has('template')) {
            return back()->withErrors(['error' => 'Pilih template terlebih dahulu.']);
        }

        $user = User::findOrFail($id);
    
        $template = EmailTemplates::findOrFail($request->template);

        $body = str_replace('{name}', $user->name, $template->content);
 
        try {
            Mail::to($user->email)->send(new SystemMail($template->subject, $body));

            EmailLogs::create([
                'sent_date' => now(),
                'to' => $user->email,
                'subject' => $template->subject,
                'body' => $body,
                'status' => 'success'
            ]);

            return back()->with('success', 'Email terkirim.');
        } catch (\Exception $e) {
            EmailLogs::create([
                'sent_date' => now(),
                'to'        => $user->email,
                'subject'   => $template->subject,
                'body'      => $body,
                'status'    => 'failed'
            ]);
            return back()->withErrors([
                'error' => 'Detail Error: ' . $e->getMessage()
            ]);
        }
    }
}
