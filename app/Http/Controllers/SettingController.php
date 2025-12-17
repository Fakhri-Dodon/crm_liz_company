<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

class SettingController extends Controller
{
    public function general()
    {
        return Inertia::render('Settings/General');
    }

    public function userRoles()
    {
        return Inertia::render('Settings/UserRoles');
    }

    public function leads()
    {
        return Inertia::render('Settings/Leads');
    }

    public function proposals()
    {
        return Inertia::render('Settings/Proposals');
    }

    public function email()
    {
        return Inertia::render('Settings/Emails');
    }
}
