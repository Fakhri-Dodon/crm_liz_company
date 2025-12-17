# CRM Leads – Laravel + Vite + React (Inertia)

Dokumen ini menjelaskan **langkah demi langkah** bagaimana membangun **backend Leads menggunakan Laravel**, lalu **menghubungkannya ke frontend React menggunakan Vite + Inertia**.  
Ditulis secara runtut agar mudah dipahami, bahkan untuk pemula.

---

## 1. Arsitektur Aplikasi

Aplikasi ini menggunakan:

- **Laravel** → Backend API & routing
- **MySQL** → Database
- **React** → Frontend UI
- **Vite** → Build tool frontend
- **Inertia.js** → Penghubung Laravel & React
- **Axios** → HTTP client frontend

Alur data:
React Page → Axios → Laravel API → Database


---

## 2. Struktur Database (Leads)

Tabel `leads` digunakan untuk menyimpan data prospek:

| Field | Tipe |
|-----|------|
| id | char(36) |
| company_name | varchar |
| address | text |
| contact_person | varchar |
| email | varchar |
| phone | varchar |
| status | enum('new','sent') |
| assigned_to | varchar |
| created_by | char(36) |
| updated_by | char(36) |
| deleted_by | char(36) |
| deleted | tinyint(1) |
| created_at | timestamp |
| updated_at | timestamp |
| deleted_at | timestamp |

> Digunakan **soft delete** + flag `deleted`

---

## 3. Backend – Laravel

### 3.1 Model

**`app/Models/Lead.php`**

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Lead extends Model
{
    use SoftDeletes;

    protected $table = 'leads';

    protected $fillable = [
        'company_name',
        'address',
        'contact_person',
        'email',
        'phone',
        'status',
        'assigned_to',
        'created_by',
        'updated_by',
        'deleted_by',
        'deleted',
    ];
}

3.2 Controller

app/Http/Controllers/LeadController.php

<?php

namespace App\Http\Controllers;

use App\Models\Lead;
use App\Http\Requests\StoreLeadRequest;
use App\Http\Requests\UpdateLeadRequest;

class LeadController extends Controller
{
    public function index()
    {
        return Lead::where('deleted', false)
            ->orderByDesc('created_at')
            ->get();
    }

    public function store(StoreLeadRequest $request)
    {
        $lead = Lead::create([
            ...$request->validated(),
            'created_by' => auth()->id(),
        ]);

        return response()->json($lead, 201);
    }

    public function update(UpdateLeadRequest $request, $id)
    {
        $lead = Lead::findOrFail($id);

        $lead->update([
            ...$request->validated(),
            'updated_by' => auth()->id(),
        ]);

        return response()->json($lead);
    }

    public function destroy($id)
    {
        $lead = Lead::findOrFail($id);

        $lead->update([
            'deleted' => true,
            'deleted_by' => auth()->id(),
        ]);

        $lead->delete();

        return response()->json(['message' => 'Lead deleted']);
    }
}

3.3 API Routes

routes/api.php

use App\Http\Controllers\LeadController;
use Illuminate\Support\Facades\Route;

Route::prefix('leads')->group(function () {
    Route::get('/', [LeadController::class, 'index']);
    Route::post('/', [LeadController::class, 'store']);
    Route::put('/{id}', [LeadController::class, 'update']);
    Route::delete('/{id}', [LeadController::class, 'destroy']);
});

Akses API:

GET    /api/leads
POST   /api/leads
PUT    /api/leads/{id}
DELETE /api/leads/{id}

4. Frontend – React + Vite + Inertia
4.1 Axios Instance

resources/js/services/axios.js

import axios from 'axios';

export default axios.create({
    baseURL: '/api',
    headers: {
        'X-Requested-With': 'XMLHttpRequest',
    },
});

4.2 Leads Service

resources/js/services/leadsService.js

import axios from './axios';

const leadsService = {
    getAll() {
        return axios.get('/leads');
    },
    create(payload) {
        return axios.post('/leads', payload);
    },
    update(id, payload) {
        return axios.put(`/leads/${id}`, payload);
    },
    delete(id) {
        return axios.delete(`/leads/${id}`);
    },
};

export default leadsService;


⚠️ Service ini menggunakan export default, maka import harus tanpa {}

5. Page Leads (React)

resources/js/Pages/Leads/Index.jsx

import { useEffect, useState } from "react";
import HeaderLayout from "../../Layouts/Header/Layout";
import TableLayout from "../../Layouts/TableLayout";
import leadsService from "../../services/leadsService";

export default function LeadsIndex() {
    const [leads, setLeads] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            const res = await leadsService.getAll();
            setLeads(res.data);
        };

        fetchData();
    }, []);

    const columns = [
        { key: "company_name", label: "Company" },
        { key: "contact_person", label: "Contact" },
        { key: "email", label: "Email" },
        { key: "phone", label: "Phone" },
        { key: "status", label: "Status" },
    ];

    return (
        <>
            <HeaderLayout title="Leads" />
            <TableLayout columns={columns} data={leads} />
        </>
    );
}

6. Routing Frontend (Inertia)

routes/web.php

use Inertia\Inertia;

Route::get('/leads', function () {
    return Inertia::render('Leads/Index');
})->middleware('auth');


Akses di browser:

http://127.0.0.1:8000/leads

7. Menjalankan Aplikasi
Backend
php artisan migrate
php artisan serve

Frontend
npm install
npm run dev