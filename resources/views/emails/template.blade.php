<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $subjectText ?? 'Notification' }}</title>
    <style>
        /* Base Reset */
        body { margin: 0; padding: 0; width: 100% !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; background-color: #f8fafc; color: #334155; -webkit-font-smoothing: antialiased; }
        
        /* Layout */
        .wrapper { width: 100%; background-color: #f8fafc; padding: 40px 0; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
        
        /* Header */
        .header { background-color: #ffffff; padding: 32px 40px; border-bottom: 1px solid #f1f5f9; text-align: left; }
        .logo-text { font-size: 20px; font-weight: 700; color: #0f172a; text-decoration: none; display: inline-block; letter-spacing: -0.5px; }
        
        /* Content */
        .content { padding: 40px; }
        .subject-heading { font-size: 22px; font-weight: 600; color: #0f172a; margin: 0 0 24px 0; line-height: 1.3; }
        
        /* Message Body */
        .message-body { font-size: 16px; color: #475569; }
        .message-body p { margin-bottom: 16px; margin-top: 0; }
        .message-body strong { color: #0f172a; font-weight: 600; }
        .message-body a { color: #2563eb; text-decoration: none; font-weight: 500; }
        .message-body a:hover { text-decoration: underline; }

        /* Support Box */
        .support-note { margin-top: 32px; padding-top: 24px; border-top: 1px solid #f1f5f9; font-size: 14px; color: #64748b; }

        /* Footer */
        .footer { background-color: #f8fafc; padding: 32px 20px; text-align: center; font-size: 12px; color: #94a3b8; }
        .footer-links { margin-bottom: 16px; }
        .footer-links a { color: #64748b; text-decoration: none; margin: 0 8px; font-weight: 500; }
        .footer-links a:hover { text-decoration: underline; color: #475569; }
        .address { margin-top: 8px; line-height: 1.5; }

        /* Mobile Responsive */
        @media only screen and (max-width: 600px) {
            .wrapper { padding: 0; }
            .container { border: none; border-radius: 0; }
            .content, .header { padding: 24px; }
        }
    </style>
</head>
<body>

    <div class="wrapper">
        <div class="container">
            
            <div class="header">
                <a href="{{ url('/') }}" class="logo-text" style="text-decoration: none;">
                    
                    @if(!empty($companyInfo['logo']))
                        {{-- Pastikan path gambarnya absolut (full URL) agar muncul di email --}}
                        <img src="{{ asset('storage/' . $companyInfo['logo']) }}" 
                             alt="{{ $companyInfo['name'] }}" 
                             height="40" 
                             style="display: block; border: 0;">
                    @else
                        <span style="font-size: 20px; font-weight: 700; color: #0f172a;">
                            {{ $companyInfo['name'] }}
                        </span>
                    @endif

                </a>
            </div>

            <div class="content">
                <h1 class="subject-heading">
                    {{ $subjectText }}
                </h1>

                @if(!empty($actionUrl))
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                        <tr>
                            <td style="padding-bottom: 24px;">
                                <table border="0" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td align="center" bgcolor="#2563eb" style="border-radius: 6px;">
                                            <a href="{{ $actionUrl }}" 
                                            target="_blank" 
                                            style="font-size: 14px; 
                                                    font-family: Helvetica, Arial, sans-serif; 
                                                    color: #ffffff; 
                                                    text-decoration: none; 
                                                    padding: 12px 24px; 
                                                    border: 1px solid #2563eb; 
                                                    display: inline-block; 
                                                    font-weight: 600; 
                                                    border-radius: 6px;">
                                                &nbsp;&nbsp;Lihat Proposal Online &rarr;&nbsp;&nbsp;
                                            </a>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                    
                    {{-- Opsi Cadangan: Tampilkan link text biasa jika tombol gagal load --}}
                    <div style="margin-bottom: 24px; font-size: 11px; color: #64748b;">
                        Link tidak bekerja? Salin url ini: <br>
                        <a href="{{ $actionUrl }}" style="color: #2563eb; text-decoration: underline;">{{ $actionUrl }}</a>
                    </div>
                @endif
                
                <div class="message-body">
                    {!! $messageBody !!}
                </div>

                <!-- <div class="support-note">
                    <p style="margin: 0;">
                        Butuh bantuan? Hubungi tim support kami di <a href="mailto:support@domainanda.com">support@domainanda.com</a>
                    </p>
                </div> -->
            </div>
        </div>

        <div class="footer">
            <p>&copy; {{ date('Y') }} {{ $companyInfo['name'] }}. All rights reserved.</p>
            <p>{{ $companyInfo['address'] }}</p>
        </div>
    </div>

</body>
</html>