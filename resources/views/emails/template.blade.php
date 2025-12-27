<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .wrapper { background-color: #f4f7f6; padding: 40px 10px; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
        .header { background: #1a202c; padding: 25px; text-align: center; color: #ffffff; }
        .content { padding: 30px; }
        .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #718096; }
        hr { border: 0; border-top: 1px solid #edf2f7; margin: 25px 0; }
        .message-body { font-size: 16px; color: #2d3748; white-space: pre-line; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <div class="header">
                {{-- Nama sistem bisa dibuat dinamis atau tetap --}}
                <h1 style="margin:0; font-size: 20px; color: #ffffff;">AdminPanel Official</h1>
            </div>
            <div class="content">
                {{-- Subjek sebagai Judul Pesan --}}
                <h2 style="color: #2d3748; margin-top: 0; border-bottom: 2px solid #3182ce; display: inline-block; padding-bottom: 5px;">
                    {{ $subjectText }}
                </h2>
                
                <div class="message-body" style="margin-top: 20px;">
                    {{-- Menggunakan {!! !!} agar format HTML dari database seperti <br> atau <b> muncul --}}
                    {!! $messageBody !!}
                </div>
                
                <hr>
                
                <p style="font-size: 14px; color: #4a5568;">
                    Email ini dikirim secara otomatis oleh sistem. Jika Anda memiliki pertanyaan, silakan hubungi tim kami melalui kontak resmi.
                </p>
            </div>
            <div class="footer">
                <p>&copy; {{ date('Y') }} AdminPanel. All rights reserved.</p>
                <p style="margin-top: 5px;">Sentul, Jawa Barat, Indonesia</p>
            </div>
        </div>
    </div>
</body>
</html>