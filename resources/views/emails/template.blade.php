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
        .button { display: inline-block; padding: 12px 25px; background-color: #3182ce; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 20px; }
        hr { border: 0; border-top: 1px solid #edf2f7; margin: 25px 0; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <div class="header">
                <h1 style="margin:0; font-size: 20px;">AdminPanel System</h1>
            </div>
            <div class="content">
                <h2 style="color: #2d3748; margin-top: 0;">{{ $subjectText }}</h2>
                <p style="font-size: 16px;">{!! nl2br(e($messageBody)) !!}</p>
                
                <hr>
                
                <p style="font-size: 14px; color: #4a5568;">
                    Jika Anda memiliki pertanyaan, silakan balas email ini atau hubungi tim support kami.
                </p>
            </div>
            <div class="footer">
                <p>&copy; {{ date('Y') }} AdminPanel. All rights reserved.</p>
            </div>
        </div>
    </div>
</body>
</html>