export default function Preview({ html, css }) {
    const srcDoc = `
        <!doctype html>
        <html>
        <head>
            <meta charset="utf-8"/>
            <link
                rel="stylesheet"
                href="/templates/css/plugins/bootstrap.min.css"
            />
            <style>${css}</style>
        </head>
        <body>
            ${html}
            <script src="/templates/js/plugins/jquery.vide.min.js"></script>
            <script src="/templates/js/plugins/jquery1.11.2.min.js"></script>
            <script src="/templates/js/plugins/bootstrap.min.js"></script>
            <script src="/templates/js/plugins/jquery.easing.1.3.min.js"></script>
            <script src="/templates/js/plugins/jquery.countTo.js"></script>
            <script src="/templates/js/plugins/jquery.formchimp.min.js"></script>
            <script src="/templates/js/plugins/jquery.jCounter-0.1.4.js"></script>
            <script src="/templates/js/plugins/jquery.magnific-popup.min.js"></script>
            <script src="/templates/js/plugins/jquery.vide.min.js"></script>
            <script src="/templates/js/plugins/owl.carousel.min.js"></script>
            <script src="/templates/js/plugins/twitterFetcher_min.js"></script>
            <script src="/templates/js/plugins/wow.min.js"></script>
            <script src="/templates/js/custom.js"></script>
        </body>
        </html>
    `;

    return (
        <iframe
            srcDoc={srcDoc}
            className="w-full h-screen border rounded"
            sandbox="allow-same-origin allow-scripts"
            title="Preview"
        />
    );
}