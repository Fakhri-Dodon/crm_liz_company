import React, { useEffect, useRef } from "react";
import grapesjs from "grapesjs";
import "grapesjs/dist/css/grapes.min.css";
import presetWebpage from "grapesjs-preset-webpage";

export default function Create({name, id}) {
	const editorRef = useRef(null);
    const templatesDataRef = useRef([]);
	const API_BASE_URL = import.meta.env.APP_URL;

    useEffect(() => {
        const editor = grapesjs.init({
        	container: "#gjs",
            height: "100vh",
            fromElement: false,
            storageManager: false,
            allowScripts: 1,
            blockManager: {
                expandState: false,
            },
            canvas: {
			    styles: [
			    	'/templates/css/icons/iconfont.css',
			    	'/templates/css/plugins/bootstrap.min.css',
			      	'http://maxcdn.bootstrapcdn.com/font-awesome/4.3.0/css/font-awesome.min.css',
			      	'http://fonts.googleapis.com/css?family=Lato:300,400,700,900,300italic,400italic,700italic,900italic',
			    	'/templates/css/plugins/magnific-popup.css',
			    	'/templates/css/plugins/owl.carousel.css',
			    	'/templates/css/plugins/loaders.css',
			    	'/templates/css/plugins/animate.css',
			    	'/templates/css/style.css',
			    	'/templates/css/responsive.css',
			    ],
    			scripts: [
			    	'/templates/js/plugins/jquery1.11.2.min.js',
			    	'/templates/js/plugins/bootstrap.min.js',
			    	'/templates/js/plugins/jquery.easing.1.3.min.js',
			    	'/templates/js/plugins/jquery.countTo.js',
			    	'/templates/js/plugins/jquery.formchimp.min.js',
			    	'/templates/js/plugins/jquery.jCounter-0.1.4.js',
			    	'/templates/js/plugins/jquery.magnific-popup.min.js',
			    	'/templates/js/plugins/jquery.vide.min.js',
			    	'/templates/js/plugins/owl.carousel.min.js',
			    	'/templates/js/plugins/twitterFetcher_min.js',
			    	'/templates/js/plugins/wow.min.js',
			    	'/templates/js/custom.js',
    			]
			}
        });

        // Contoh button save
        editor.Panels.addButton("options", {
            id: "save-page",
            className: "fa fa-save",
            command: () => savePage(editor),
            attributes: { title: "Save Page" },
        });

        editor.on('load', () => {
            const openBlocksBtn = editor.Panels.getButton('views', 'open-blocks');
            if (openBlocksBtn) openBlocksBtn.set('active', true);

            const categories = editor.BlockManager.getCategories();
            categories.each(category => {
                category.set('open', false);
            });
        });

		fetch(`/api/proposal/templates`)
            .then(res => res.json())
            .then(templates => {
                templatesDataRef.current = templates;
                templates.forEach((tpl, index) => {
                    editor.BlockManager.add(`template-${index}`, {
                        category: tpl.category || 'Templates',
                        media: `<img src="${tpl.preview}" style="width: 100%; height: auto; display: block;" />`,
                        content: `<input type="hidden" data-template-category="${tpl.category || 'Templates'}">${tpl.html}<style>${tpl.css}</style>`,
                        attributes: { class: 'gjs-block-section' }
                    });
                });
            });

       editorRef.current = editor;

    }, []);

    const savePage = async (editor) => {

        const html = editor.getHtml();

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const categoriesUsed = [
            ...new Set(
                [...doc.querySelectorAll('[data-template-category]')]
                    .map(el => el.dataset.templateCategory)
            )
        ];

        const canvasConfig = editor.getConfig().canvas;
        
        const getFilteredCss = async (url) => {
            try {
                const response = await fetch(url);
                const text = await response.text();
                return filterCssRules(text, doc);
            } catch (err) {
                console.error("Gagal mengambil CSS:", url);
                return "";
            }
        };

        const externalPromises = canvasConfig.styles.map(url => getFilteredCss(url));
        const externalResults = await Promise.all(externalPromises);
        
        const internalCss = filterCssRules(editor.getCss(), doc);

        const finalUsedCss = externalResults.join('\n') + '\n' + internalCss;

        await fetch("/proposal/store", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]').getAttribute("content"),
            },
            body: JSON.stringify({
                id: id,
                name: name,
                html: html,
                css: finalUsedCss,
                categories: categoriesUsed,
            }),
        });

        alert("Simpan Berhasil! Hanya CSS yang digunakan yang disimpan.");
    };

    /**
     * Fungsi untuk menyaring string CSS berdasarkan dokumen HTML
     */
    function filterCssRules(cssText, doc) {
        if (!cssText) return "";
        
        const styleSheet = new CSSStyleSheet();
        // Gunakan try-catch karena CSS mentah mungkin punya karakter yang tidak valid bagi parser browser
        try {
            // Catatan: replace ini untuk menangani karakter escape atau baris baru jika perlu
            styleSheet.replaceSync(cssText);
        } catch (e) {
            return cssText; // Jika gagal parsing, kembalikan apa adanya agar aman
        }

        let filtered = "";
        const rules = styleSheet.cssRules;

        for (let i = 0; i < rules.length; i++) {
            const rule = rules[i];

            // Jika aturan adalah Media Query (@media)
            if (rule instanceof CSSMediaRule) {
                let innerFiltered = "";
                for (let j = 0; j < rule.cssRules.length; j++) {
                    const subRule = rule.cssRules[j];
                    if (isSelectorUsed(subRule.selectorText, doc)) {
                        innerFiltered += subRule.cssText + "\n";
                    }
                }
                if (innerFiltered) {
                    filtered += `@media ${rule.conditionText} {\n${innerFiltered}}\n`;
                }
            } 
            // Jika aturan CSS biasa
            else if (rule.selectorText) {
                if (isSelectorUsed(rule.selectorText, doc)) {
                    filtered += rule.cssText + "\n";
                }
            }
            // Tetap masukkan @font-face dan @keyframes agar desain tidak rusak
            else {
                filtered += rule.cssText + "\n";
            }
        }
        return filtered;
    }

    /**
     * Cek apakah selector ada di dalam dokumen
     */
    function isSelectorUsed(selector, doc) {
        if (!selector) return false;
        
        // Hapus pseudo-classes seperti :hover, :after agar querySelector tidak error
        const cleanSelector = selector.split(':')[0]
                                      .split(',')[0] // Ambil bagian pertama jika multiple selector
                                      .trim();
        
        if (!cleanSelector) return true; // Biarkan selector kosong/universal lolos

        try {
            return doc.querySelector(cleanSelector) !== null;
        } catch (e) {
            // Jika selector kompleks (misal :nth-child), anggap saja digunakan agar aman
            return true;
        }
    }

    return <div id="gjs"></div>;
}
