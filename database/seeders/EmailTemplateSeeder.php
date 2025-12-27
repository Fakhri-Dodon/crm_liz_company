<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class EmailTemplateSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('email_templates')->insert([
            [
                'id' => Str::uuid()->toString(),
                'name' => 'User Welcome',
                'subject' => 'Selamat Datang di AdminPanel',
                'content' => '
                    <p>Halo <strong>{name}</strong>,</p>
                    <p>Akun Anda telah berhasil dibuat oleh Admin. Sekarang Anda dapat mengakses sistem menggunakan email ini.</p>
                    <p>Silakan hubungi IT Support jika Anda mengalami kendala saat login pertama kali.</p>
                    <p>Terima kasih!</p>
                ',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => Str::uuid()->toString(),
                'name' => 'Client Professional',
                'subject' => 'Penawaran Kerjasama Layanan',
                'content' => '
                    <p>Yth. <strong>{name}</strong>,</p>
                    <p>Terima kasih telah menghubungi kami. Kami sangat senang dapat membantu kebutuhan bisnis Anda.</p>
                    <p>Berikut kami lampirkan detail layanan yang Anda minta. Tim kami akan segera menghubungi Anda kembali untuk diskusi lebih lanjut.</p>
                    <p>Salam hangat,<br>Management Team</p>
                ',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => Str::uuid()->toString(),
                'name' => 'Internal Notice',
                'subject' => 'Pemberitahuan Sistem Maintenance',
                'content' => '
                    <p>Informasi untuk <strong>{name}</strong>,</p>
                    <p>Sistem akan mengalami pemeliharaan rutin pada hari Sabtu pukul 22.00 WIB. Mohon untuk melakukan logout sebelum waktu tersebut.</p>
                    <p>Mohon maaf atas ketidaknyamanannya.</p>
                ',
                'created_at' => now(),
                'updated_at' => now(),
            ]
        ]);
    }
}