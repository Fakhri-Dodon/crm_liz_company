import { useEffect, useRef, useState } from "react";
import { Head, usePage, router, useForm } from '@inertiajs/react';
import grapesjs from "grapesjs";
import "grapesjs/dist/css/grapes.min.css";
import "@/assets/css/grapes-custom.css";
import * as htmlToImage from 'html-to-image';

const TEXT_CANDIDATES = [
    "H1",
    "H2",
    "H3",
    "H4",
    "H5",
    "H6",
    "P",
    "SPAN",
    "LI",
    "LABEL",
    "DIV",
    "STRONG",
    "B",
    "EM",
    "I",
    "SMALL",
];

const STYLE_GROUPS = {
    text: [
        "color",
        "font-size",
        "background-color",
        "font-family",
        "font-weight",
    ],
    btn: ["font-weight", "font-size", "background-color", "color"], // Button biasanya butuh color text juga
    link: [
        "font-weight",
        "font-size",
        "text-transform",
        "color",
        "text-decoration",
    ],
    img: [
        "border-top-left-radius",
        "border-top-right-radius",
        "border-bottom-left-radius",
        "border-bottom-right-radius",
        "border-color",
        "border-style",
        "border-width",
    ],
    icon: ["color", "font-size"],
};

export default function EditProposals({ id, name, template }) {
    const editorRef = useRef(null);
    const activeModeRef = useRef("elements");
    
    const [categories, setCategories] = useState([]);
    const [activeCat, setActiveCat] = useState("All Blocks");
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isCatSelected, setIsCatSelected] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [loading, setLoading] = useState(false);
    const [activeMode, setActiveMode] = useState("elements");

    // =========================================================
    // 1. LOGIKA UNTUK MENENTUKAN CSS & SETTINGS (TRAITS)
    // =========================================================
    const getConfigForElement = (comp) => {
        const el = comp.getEl();
        if (!el) return { styles: [], traits: [] };

        const tagName = comp.get("tagName")?.toUpperCase();
        const classes = comp.getClasses();
        const type = comp.get("type");

        // Helper Checks
        const isNav =
            el.closest("nav") !== null || el.closest(".navbar") !== null;
        const isFooter = el.closest("footer") !== null;
        const isBtn = classes.includes("btn") || classes.includes("btn-nav");
        const isIcon =
            tagName === "I" ||
            classes.some((c) => c.startsWith("fa-") || c === "fa");

        // -----------------------------------------------------
        // SKENARIO 1: IMAGE di dalam NAV
        // -----------------------------------------------------
        if (tagName === "IMG" && isNav) {
            return {
                title: "Image Navigation",
                styles: STYLE_GROUPS.img,
                traits: [
                    { type: "text", name: "src", label: "Image Source" }, // Ganti Gambar
                    { type: "text", name: "href", label: "Link URL" }, // Tambah Link
                    {
                        type: "select",
                        name: "target",
                        label: "Target",
                        options: [
                            { value: "", name: "Same Tab" },
                            { value: "_blank", name: "New Tab" },
                        ],
                    },
                ],
            };
        }

        // -----------------------------------------------------
        // SKENARIO 2: TAG A (Bukan Button) di dalam NAV
        // -----------------------------------------------------
        if (tagName === "A" && !isBtn && isNav) {
            return {
                title: "Nav Link",
                styles: STYLE_GROUPS.link,
                traits: [
                    { type: "text", name: "href", label: "Link URL" }, // Ganti Link
                    { type: "text", name: "content", label: "Text" }, // Ganti Teks Link (opsional, via trait)
                ],
            };
        }

        // -----------------------------------------------------
        // SKENARIO 3: TAG A.BTN (Button) di dalam NAV
        // -----------------------------------------------------
        if (tagName === "A" && isBtn && isNav) {
            return {
                title: "Nav Button",
                styles: STYLE_GROUPS.btn,
                traits: [
                    { type: "text", name: "href", label: "Link URL" }, // Ganti Link
                    { type: "text", name: "class", label: "Classes" }, // Opsional: edit class
                ],
            };
        }

        // -----------------------------------------------------
        // SKENARIO 4: TEXT (H1-H6, P, SPAN, dll)
        // -----------------------------------------------------
        const TEXT_TAGS = [
            "H1",
            "H2",
            "H3",
            "H4",
            "H5",
            "H6",
            "P",
            "SPAN",
            "STRONG",
            "B",
            "EM",
            "SMALL",
            "DIV",
            "LI",
        ];
        // Cek apakah ini text node murni atau elemen pembungkus teks
        // Kita anggap text jika dia masuk list di atas DAN bukan button DAN bukan icon
        if (TEXT_TAGS.includes(tagName) && !isBtn && !isIcon) {
            // Pastikan tidak punya anak elemen blok (agar tidak menyeleksi wrapper besar)
            const hasBlockChildren = comp
                .find("*")
                .some(
                    (c) =>
                        c.get("type") === "default" ||
                        c.get("tagName") === "DIV"
                );

            if (!hasBlockChildren) {
                return {
                    title: "Typography",
                    styles: STYLE_GROUPS.text,
                    traits: [], // User TIDAK BISA tambah image/link (Traits kosong)
                };
            }
        }

        // -----------------------------------------------------
        // SKENARIO 5: BUTTON (Bukan di Nav)
        // -----------------------------------------------------
        if (isBtn && !isNav) {
            return {
                title: "Button Component",
                styles: STYLE_GROUPS.btn,
                traits: [
                    { type: "text", name: "href", label: "Link URL" },
                    {
                        type: "select",
                        name: "target",
                        label: "Target",
                        options: [
                            { value: "", name: "Same Tab" },
                            { value: "_blank", name: "New Tab" },
                        ],
                    },
                ],
            };
        }

        // -----------------------------------------------------
        // SKENARIO 6: IMAGE (Bukan di Nav)
        // -----------------------------------------------------
        if (tagName === "IMG" && !isNav) {
            return {
                title: "Image Component",
                styles: STYLE_GROUPS.img,
                traits: [
                    { type: "text", name: "src", label: "Image Source" },
                    { type: "text", name: "alt", label: "Alt Text" },
                ],
            };
        }

        // Logicnya: Bisa ganti warna, size, link, dan icon class
        if (isIcon) {
            return {
                title: isFooter ? "Footer Icon" : "Icon Component",
                styles: STYLE_GROUPS.icon,
                traits: [
                    { type: "text", name: "href", label: "Link URL" }, 
                    {
                        type: "text",
                        name: "class",
                        label: "Icon Class (fa fa-xxx)",
                    }, 
                ],
            };
        }

        return {
            title: "Element Settings",
            styles: ["padding", "margin", "background-color", "height"],
            traits: [],
        };
    };

    useEffect(() => {
        setLoading(true);

        const editor = grapesjs.init({
            container: "#gjs",
            height: "100%",
            width: "100%",
            storageManager: false,
            allowScripts: 1,
            avoidInlineStyle: true,
            forceClass: false,
            selectable: true,
            blockManager: { appendTo: "#second-side" },

            traitManager: { appendTo: "#trait-editor-container" },
            styleManager: {
                appendTo: "#style-manager-container",
                clearProperties: true,
                sectors: [
                    {
                        name: "Typography",
                        open: false,
                        buildProps: [
                            "font-family",
                            "font-size",
                            "font-weight",
                            "color",
                            "text-align",
                            "text-transform",
                            "line-height",
                            "letter-spacing",
                        ],
                    },
                    {
                        name: "Decorations",
                        open: false,
                        buildProps: [
                            "background-color",
                            "border-radius",
                            "border-top-left-radius",
                            "border-top-right-radius",
                            "border-bottom-left-radius",
                            "border-bottom-right-radius",
                            "box-shadow",
                            "background-image",
                        ],
                    },
                    {
                        name: "Dimensions",
                        open: false,
                        buildProps: [
                            "width",
                            "height",
                            "min-height",
                            "padding",
                            "margin",
                            "padding-top",
                            "padding-bottom",
                            "padding-left",
                            "padding-right",
                        ],
                    },
                    {
                        name: "Borders",
                        open: false,
                        buildProps: [
                            "border-width",
                            "border-style",
                            "border-color",
                        ],
                    },
                ],
            },
            panels: { defaults: [] },
            canvas: {
                styles: [
                    "/templates/css/style.css",
                    "/templates/css/plugins/bootstrap.min.css",
                    '/templates/css/font-awesome.min.css',
                ],
            },
        });

        const defaultType = editor.DomComponents.getType("default");
        const defaultModel = defaultType.model;

        // override image agar traits-nya dinamis nanti
        editor.DomComponents.addType("image", {
            model: {
                defaults: {
                    traits: [],
                },
            },
        });

        editorRef.current = editor;

        editor.on("load", () => {
            const body = editor.Canvas.getBody();

            if (!body.querySelector(".el-toolbar")) {
                const toolbar = document.createElement("div");
                toolbar.className = "el-toolbar";
                toolbar.style.display = "none";

                toolbar.innerHTML = `
                    <button class="el-btn source"><i class="fa fa-code"></i></button>
                    <button class="el-btn reset"><i class="fa fa-refresh"></i></button>
                    <button class="el-btn remove"><i class="fa fa-trash"></i></button>
                `;

                body.appendChild(toolbar);
            }
            // CSS Injection (Pointer Events Locking)
            const canvasHead = editor.Canvas.getDocument().head;
            const styleId = "mode-content-style";
            if (!canvasHead.querySelector(`#${styleId}`)) {
                const styleEl = document.createElement("style");
                styleEl.id = styleId;
                styleEl.innerHTML = `
                    .mode-content-active * { pointer-events: none !important; cursor: default !important; }
                    .mode-content-active [contenteditable="true"], 
                    .mode-content-active [data-gjs-type="text"],
                    .mode-content-active h1, .mode-content-active h2, .mode-content-active h3, 
                    .mode-content-active h4, .mode-content-active h5, .mode-content-active h6, 
                    .mode-content-active p, .mode-content-active span, .mode-content-active a, 
                    .mode-content-active li, .mode-content-active b, .mode-content-active strong, 
                    .mode-content-active i, .mode-content-active small { 
                        pointer-events: auto !important; cursor: text !important; outline: 2px dashed #4cd137 !important; 
                    }
                    .gjs-rte-toolbar, .gjs-rte-toolbar * { pointer-events: auto !important; }
                    
                    .fa,
                    .fa:before {
                        font-family: FontAwesome !important;
                    }
                `;
                canvasHead.appendChild(styleEl);
            }

            editor.addStyle(`
                .el-toolbar {
                    position: absolute !important;
                    top: -18px !important;
                    right: 10px !important;
                    display: inline-flex !important;
                    border-radius: 6px !important;
                    overflow: hidden !important;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.15) !important;
                    z-index: 9999 !important;
                    font-family: Arial, sans-serif;
                }

                .el-toolbar .el-btn {
                    border: none !important;
                    padding: 6px 12px !important;
                    font-size: 12px !important;
                    color: #fff !important;
                    cursor: pointer !important;
                    display: flex !important;
                    align-items: center !important;
                    gap: 6px !important;
                    background: #333 !important;
                }

                .el-toolbar .el-btn.source {
                    background: #2c3e50 !important;
                }

                .el-toolbar .el-btn.reset {
                    background: #f39c12 !important;
                }

                .el-toolbar .el-btn.remove {
                    background: #e74c3c !important;
                }

                .el-toolbar .el-btn:hover {
                    filter: brightness(1.1) !important;
                }

                .el-toolbar i {
                    font-size: 12px !important;
                }

                section, header, footer {
                    overflow: visible !important;
                }
            `);

            fetch(`/api/proposal/templates`)
                .then((res) => res.json())
                .then((templates) => {
                    const cats = [
                        "All Blocks",
                        ...new Set(templates.map((t) => t.category)),
                    ];
                    setCategories(cats);
                    templates.forEach((tpl, index) => {
                        editor.BlockManager.add(`template-${index}`, {
                            category: tpl.category || "Templates",
                            media: `<img src="${tpl.preview}" style="width: 100%;" />`,
                            content: {
                                content: `<input type="hidden" data-template-category="${tpl.category || 'Templates'}">${tpl.html}`,
                                attributes: {
                                    "data-gjs-section": "true",
                                    "data-section-type": tpl.category
                                }
                            }
                        });
                    });
                })
                .finally(() => setLoading(false));

            if (template) {
                if (template.html_output)
                    editor.setComponents(template.html_output);
                if (template.css_output) editor.setStyle(template.css_output);
            }

            setTimeout(() => changeMode("elements"), 500);
        });

        editor.on("component:dblclick", (comp) => {
            if (activeModeRef.current !== "content") return;

            const tag = comp.get("tagName")?.toUpperCase();
            const isText =
                TEXT_CANDIDATES.includes(tag) || comp.get("type") === "text";

            if (!isText) return;

            editor.Modal.setTitle("Edit Content");
            editor.Modal.setContent(`
                <textarea id="content-editor"
                    style="width:100%;height:200px;">
                    ${comp.view.el.innerText}
                </textarea>
                <button id="save-content">Save</button>
            `);
            editor.Modal.open();

            setTimeout(() => {
                document.getElementById("save-content").onclick = () => {
                    const val =
                        document.getElementById("content-editor").value;
                    comp.components(val);
                    editor.Modal.close();
                };
            }, 0);
        });

        // =========================================================
        // LOGIC UTAMA: SAAT ELEMEN DIKLIK
        // =========================================================
        editor.on("component:selected", (comp) => {
            if (!comp) return;
            const mode = activeModeRef.current;

            if (mode === "details") {
                const sidebar = document.getElementById(
                    "style-editor-container"
                );
                const sidebarTitle =
                    document.getElementById("sidebar-title-text");

                // 1. Buka Sidebar Kiri
                if (sidebar) sidebar.classList.add("open");

                // 2. Ambil Config
                const config = getConfigForElement(comp);

                // Update Judul Sidebar
                if (sidebarTitle) sidebarTitle.innerText = config.title;

                // 3. Set Traits (Settings)
                comp.set("traits", config.traits);

                // 4. Set Styles (CSS)
                const sm = editor.StyleManager;
                const sectors = sm.getSectors();

                sectors.forEach((sector) => {
                    let hasVisibleProps = false;
                    sector.get("properties").forEach((prop) => {
                        const propName = prop.get("property");

                        // Logic pencocokan style yang lebih longgar untuk properti compound
                        const isAllowed = config.styles.some((allowed) => {
                            if (allowed === propName) return true;
                            if (
                                allowed === "padding" &&
                                propName.startsWith("padding")
                            )
                                return true;
                            if (
                                allowed === "margin" &&
                                propName.startsWith("margin")
                            )
                                return true;
                            return false;
                        });

                        prop.set("visible", isAllowed);
                        if (isAllowed) hasVisibleProps = true;
                    });

                    sector.set("visible", hasVisibleProps);
                    sector.set("open", hasVisibleProps); // Buka sector jika ada isinya
                });
            }
        });

        // Tutup sidebar jika deselect
        editor.on("component:deselected", () => {
            const sidebar = document.getElementById("style-editor-container");
            if (sidebar) sidebar.classList.remove("open");
        });

        editor.on("component:add", (component) => {
            component.set("initialContent", component.toHTML());
            setTimeout(
                () => applyComponentSettings(component, activeModeRef.current),
                10
            );
        });

        const markDirty = () => setIsDirty(true);

        editor.on("component:add", markDirty);
        editor.on("component:remove", markDirty);
        editor.on("component:update", markDirty);
        editor.on("style:property:update", markDirty);
        editor.on("component:styleUpdate", markDirty);
        editor.on("trait:value:update", markDirty);

        return () => editor.destroy();
    }, []);

    useEffect(() => {
        const handler = (e) => {
            if (!isDirty) return;
            e.preventDefault();
            e.returnValue = "";
        };

        window.addEventListener("beforeunload", handler);
        return () => window.removeEventListener("beforeunload", handler);
    }, [isDirty]);

    const savePage = async () => {

        if (!editorRef.current) return;

        const editor = editorRef.current;

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

                // JANGAN FILTER FONT AWESOME
                if (url.includes("font-awesome")) {
                    return text;
                }

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

        const iframe = editor.Canvas.getFrameEl();
        const iframeBody = iframe.contentDocument.body;

        const imageBlob = await htmlToImage.toBlob(iframeBody, {
            backgroundColor: '#ffffff',
            pixelRatio: 2, // HD thumbnail
        });

        // Convert ke Base64 (untuk dikirim)
        const imageBase64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(imageBlob);
        });

        const res = await fetch(`/setting/proposal-element/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]').getAttribute("content"),
            },
            body: JSON.stringify({
                name: name,
                html: html,
                css: finalUsedCss,
                categories: categoriesUsed,
                image: imageBase64,
            }),
        });

        const savePage = await res.json();

        if (savePage.success) {
            alert("Simpan Berhasil!");
            window.location.href = savePage.redirect;
        }

    };

    const applyComponentSettings = (comp, mode) => {
        if (!comp || typeof comp.get !== "function") return;
        const tagName = comp.get("tagName")?.toUpperCase();
        const type = comp.get("type");
        const isWrapper = type === "wrapper";
        const isCandidate =
            TEXT_CANDIDATES.includes(tagName) ||
            type === "text" ||
            type === "textnode";
        const hasBlockChildren = comp
            .find("*")
            .some(
                (c) => c.get("type") === "default" || c.get("tagName") === "DIV"
            );
        const isText = isCandidate && !hasBlockChildren;

        let props = {};
        const view = comp.getView();
        if (view?.el) view.el.removeAttribute("contenteditable");

        if (mode === "elements") {
            if (isSectionRoot(comp)) {
                props = {
                    selectable: true,
                    hoverable: true,
                    draggable: true,
                    droppable: false,
                    removable: true,
                    highlightable: true,
                    editable: false,
                };
            } else {
                props = {
                    selectable: false,
                    hoverable: false,
                    draggable: false,
                    droppable: false,
                    removable: false,
                    highlightable: false,
                    editable: false,
                };
            }
        } else if (mode === "content") {
            if (isText || comp.get("tagName") === "IMG" || comp.get("tagName") === "A") {
                props = {
                    selectable: true,
                    hoverable: true,
                    editable: true,
                    draggable: false,
                    droppable: false,
                };
            } else {
                props = {
                    selectable: false,
                    hoverable: false,
                    editable: false,
                    draggable: false,
                    droppable: false,
                };
            }
        } else if (mode === "details") {
            props = {
                draggable: false,
                droppable: false,
                removable: false,
                copyable: false,
                selectable: true,
                hoverable: true,
                editable: false,
                highlightable: true,
                toolbar: [],
                stylable: true,
            };
        }
        comp.set(props);
    };

    const injectElementToolbar = (editor, comp) => {
        const view = comp.getView();
        if (!view || !view.el) return;

        const el = view.el;
        if (el.querySelector(".el-toolbar")) return;

        const bar = document.createElement("div");
        bar.className = "el-toolbar";
        bar.innerHTML = `
            <button data-act="source">⧉</button>
            <button data-act="reset">↺</button>
            <button data-act="remove">✕</button>
        `;

        el.style.position = "relative";
        el.appendChild(bar);

        bar.onclick = (e) => {
            e.stopPropagation();
            const act = e.target.dataset.act;

            if (act === "source") {
                editor.Modal
                    .setTitle("Source Code")
                    .setContent(`<pre>${comp.toHTML()}</pre>`)
                    .open();
            }

            if (act === "reset") {
                const original = comp.get("initialContent");
                if (original) comp.components(original);
            }

            if (act === "remove") comp.remove();
        };
        el.addEventListener("mouseenter", () => {
            if (
                activeModeRef.current === "elements" &&
                isSectionRoot(comp)
            ) {
                injectElementToolbar(editor, comp);
            }
        });
    };

    const removeElementToolbar = (comp) => {
        const el = comp.getView()?.el;
        el?.querySelector(".el-toolbar")?.remove();
    };

    const isSectionRoot = (comp) => {
        return (
            comp.getAttributes()?.["data-gjs-section"] === "true" ||
            ["HEADER", "SECTION", "FOOTER"].includes(
                comp.get("tagName")?.toUpperCase()
            )
        );
    };

    const hideElementToolbar = (editor) => {
        const toolbar = editor.Canvas.getBody().querySelector(".el-toolbar");
        if (toolbar) toolbar.style.display = "none";
    };

    const changeMode = (mode) => {
        setActiveMode(mode);
        activeModeRef.current = mode;
        const editor = editorRef.current;
        if (!editor) return;

        // Tutup Sidebar & Deselect
        const sidebar = document.getElementById("style-editor-container");
        if (sidebar) sidebar.classList.remove("open");
        editor.select(null);

        const canvasBody = editor.Canvas.getBody();
        if (canvasBody) {
            if (mode === "content") {
                canvasBody.classList.add("mode-content-active");
                editor.stopCommand("core:component-outline");
            } else {
                canvasBody.classList.remove("mode-content-active");
                if (mode === "elements")
                    editor.runCommand("core:component-outline");
            }
        }

        const wrapper = editor.getWrapper();
        if (wrapper) {
            const updateRecursively = (component) => {
                applyComponentSettings(component, mode);
                const children = component.get("components");
                if (children)
                    children.forEach((child) => updateRecursively(child));
            };
            if (mode === "content")
                wrapper.set({
                    selectable: false,
                    hoverable: false,
                    droppable: false,
                });
            else wrapper.set({ droppable: true });

            wrapper
                .get("components")
                .forEach((child) => updateRecursively(child));
        }

        if (mode === "details") {
            editor.runCommand("core:component-select");
            editor.runCommand("core:component-hover");
        }

        editor.refresh();
    };

    const isStructural = (comp) => {
        const cls = comp.getClasses();
        return (
            cls.includes("container") ||
            cls.includes("row") ||
            cls.some(c => c.startsWith("col-"))
        );
    };

    const filterCategory = (cat) => {
        setIsCatSelected(true);
        setActiveCat(cat);
        setTimeout(() => {
            if (!editorRef.current) return;
            const bm = editorRef.current.BlockManager;
            const allBlocks = bm.getAll();
            if (cat === "All Blocks") bm.render(allBlocks.models);
            else
                bm.render(
                    allBlocks.filter((b) => {
                        const c = b.get("category");
                        return (c.id || c) === cat;
                    })
                );
        }, 50);
    };

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

    const exportPage = async () => {
        if (!editorRef.current) return;

        const editor = editorRef.current;
        const html = editor.getHtml();

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");

        const canvasConfig = editor.getConfig().canvas;

        const getFilteredCss = async (url) => {
            try {
                const res = await fetch(url);
                const text = await res.text();

                // JANGAN FILTER FONT AWESOME
                if (url.includes("font-awesome")) {
                    return text;
                }
                
                return filterCssRules(text, doc);
            } catch {
                return "";
            }
        };

        const externalCss = await Promise.all(
            canvasConfig.styles.map(url => getFilteredCss(url))
        );

        const internalCss = filterCssRules(editor.getCss(), doc);
        const finalCss = externalCss.join("\n") + "\n" + internalCss;

        const fullHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8" />
                <link
                    rel="stylesheet"
                    href="/templates/css/plugins/bootstrap.min.css"
                />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <title>Exported Page</title>
                <style>${finalCss}</style>
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
        `.trim();

        const blob = new Blob([fullHtml], { type: "text/html;charset=utf-8" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "proposal.html";
        a.click();

        URL.revokeObjectURL(url);
    };

    const togglePreview = async () => {
        if (!editorRef.current) return;

        const editor = editorRef.current;
        const html = editor.getHtml();

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");

        const canvasConfig = editor.getConfig().canvas;

        const getFilteredCss = async (url) => {
            try {
                const res = await fetch(url);
                const text = await res.text();

                // JANGAN FILTER FONT AWESOME
                if (url.includes("font-awesome")) {
                    return text;
                }
                
                return filterCssRules(text, doc);
            } catch {
                return "";
            }
        };

        const externalCss = await Promise.all(
            canvasConfig.styles.map(url => getFilteredCss(url))
        );

        const internalCss = filterCssRules(editor.getCss(), doc);
        const finalCss = externalCss.join("\n") + "\n" + internalCss;

        const previewWindow = window.open("", "_blank");

        previewWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8" />
                <link
                    rel="stylesheet"
                    href="/templates/css/plugins/bootstrap.min.css"
                />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <title>Preview Page</title>
                <style>${finalCss}</style>
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
        `);

        previewWindow.document.close();
    };

    const emptyPage = () => {
        if (!editorRef.current) return;

        if (!confirm("Are you sure you want to clear the page?")) return;

        const editor = editorRef.current;

        editor.DomComponents.clear();
        editor.CssComposer.clear();
        editor.select(null);
    };

    return (
        <div
            className={`builder-body ${
                isSidebarOpen ? "sidebar-expanded" : "sidebar-collapsed"
            }`}
        >
            <div
                className="menu-left"
                onMouseEnter={() => setIsSidebarOpen(true)}
                onMouseLeave={() => {
                    setIsSidebarOpen(false);
                    setIsCatSelected(false);
                }}
                style={{ zIndex: 1000 }}
            >
                <div className="icon-trigger-area">
                    <i className="fa fa-th-large fa-lg"></i>
                </div>
                <div className="main-nav">
                    <h3>
                        <i className="fa fa-th-large"></i> BLOCKS
                    </h3>
                    <ul className="elements-list">
                        {categories.map((cat) => (
                            <li
                                key={cat}
                                className={activeCat === cat ? "active" : ""}
                            >
                                <a
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        filterCategory(cat);
                                    }}
                                >
                                    {cat}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
                <div
                    className={`second-side ${isCatSelected ? "show" : ""}`}
                    id="second-side"
                >
                    <div
                        className="second-side-header"
                        onClick={() => setIsCatSelected(false)}
                    >
                        <i className="fa fa-chevron-left"></i> HIDE
                    </div>
                </div>
            </div>

            <div className="container-main">
                <header className="builder-header">
                    <Head title="Edit Proposal" />
                    <div className="modes">
                        <span className="mode-label">BUILDING MODE:</span>
                        {["elements", "content", "details"].map((m) => (
                            <label>
                                <input
                                    type="radio"
                                    checked={activeMode === m}
                                    onChange={() => changeMode(m)}
                                    style={{
                                        marginRight: "2px",
                                        marginBottom: "2px",
                                    }}
                                />
                                {m}
                            </label>
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                    {/* SAVE */}
                    <button
                        onClick={savePage}
                        disabled={!isDirty}
                        className={`
                            inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium
                            transition
                            ${isDirty
                                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                : "cursor-not-allowed bg-emerald-200 text-emerald-700"}
                        `}
                    >
                        ✓ {isDirty ? "Save Page" : "Nothing new to save"}
                    </button>

                    {/* EXPORT */}
                    <button
                        onClick={exportPage}
                        className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 transition"
                    >
                        Export
                    </button>

                    {/* PREVIEW */}
                    <button
                        onClick={togglePreview}
                        className="inline-flex items-center rounded-md bg-zinc-800 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-900 transition"
                    >
                        Preview
                    </button>

                    {/* EMPTY */}
                    <button
                        onClick={emptyPage}
                        className="inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 transition"
                    >
                        Empty Page
                    </button>
                </div>
                </header>

                <div className="screen-area">
                    <div className="screen" id="screen">
                        <div className="toolbar">
                            <div className="buttons clearfix">
                                <span className="left red"></span>
                                <span className="left yellow"></span>
                                <span className="left green"></span>
                            </div>
                            <div className="title">
                                <span>{name}.html</span>
                            </div>
                        </div>
                        <div id="frameWrapper" className="frameWrapper empty">
                            {/* === SIDEBAR (DETAILS MODE) === */}
                            <div
                                id="style-editor-container"
                                className="style-sidebar-left"
                            >
                                {/* Header Custom */}
                                <div className="sidebar-header-custom">
                                    <span id="sidebar-title-text">
                                        SETTINGS
                                    </span>
                                    <button
                                        onClick={() =>
                                            document
                                                .getElementById(
                                                    "style-editor-container"
                                                )
                                                .classList.remove("open")
                                        }
                                        style={{
                                            background: "none",
                                            border: "none",
                                            color: "white",
                                        }}
                                    >
                                        <i className="fa fa-times"></i>
                                    </button>
                                </div>

                                <div
                                    id="trait-editor-container"
                                    className="sidebar-section"
                                ></div>
                                <div
                                    id="style-manager-container"
                                    className="sidebar-section"
                                ></div>
                            </div>

                            <div
                                id="gjs"
                                style={{ position: "relative", zIndex: 10 }}
                            ></div>
                            <div className="start" id="start">
                                <span>
                                    Build your page by dragging elements onto
                                    the canvas
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
