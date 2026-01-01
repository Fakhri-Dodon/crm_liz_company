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
        </body>
        </html>
    `;

    return (
        <iframe
            srcDoc={srcDoc}
            className="w-full h-screen border rounded"
            sandbox="allow-same-origin"
            title="Preview"
        />
    );
}