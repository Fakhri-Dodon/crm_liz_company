import { useEffect, useRef, useState } from "react";
import { Head, usePage, router, useForm } from "@inertiajs/react";
import grapesjs from "grapesjs";
import "grapesjs/dist/css/grapes.min.css";
import "@/assets/css/grapes-custom.css";
import * as htmlToImage from "html-to-image";

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
    // Teks Biasa: Warna, Font, Background
    text: [
        "color",
        "font-size",
        "background-color",
        "font-family",
        "font-weight",
        "text-align",
        "line-height",
        "letter-spacing",
    ],

    // Link Navigasi: Font, Warna, Transform
    linkNav: ["font-weight", "font-size", "text-transform", "color"],

    // Tombol Navigasi: Font, Background, Radius
    btnNav: [
        "font-weight",
        "font-size",
        "background-color",
        "color",
        "border-radius",
    ],

    // Gambar (General): Border & Radius
    img: [
        "border-top-left-radius",
        "border-top-right-radius",
        "border-bottom-left-radius",
        "border-bottom-right-radius",
        "border-color",
        "border-style",
        "border-width",
        "width",
        "height",
    ],

    // Icon: Warna & Ukuran
    icon: ["color", "font-size"],
};

export default function Create({ id, template }) {
    const editorRef = useRef(null);
    const activeModeRef = useRef("elements");

    const [categories, setCategories] = useState([]);
    const [activeCat, setActiveCat] = useState("All Blocks");
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isCatSelected, setIsCatSelected] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [loading, setLoading] = useState(false);
    const [activeMode, setActiveMode] = useState("elements");
    const [showCode, setShowCode] = useState(false);
    const [sourceCode, setSourceCode] = useState("");

    // =========================================================
    // BAGIAN 1: LOGIKA SKENARIO (Insert sebelum useEffect)
    // =========================================================
    const getConfigForElement = (comp) => {
        const el = comp.getEl();
        if (!el) return { title: "Settings", styles: [], traits: [] };

        const tagName = comp.get("tagName")?.toUpperCase();
        const classes = comp.getClasses();

        // Deteksi Lokasi & Tipe
        const isNav =
            el.closest("nav") !== null || el.closest(".navbar") !== null;
        const isFooter = el.closest("footer") !== null;
        const isBtn =
            classes.includes("btn") ||
            classes.includes("btn-nav") ||
            tagName === "BUTTON";
        const isIcon =
            tagName === "I" ||
            classes.some((c) => c.startsWith("fa") || c.startsWith("icon-"));

        // ------------------------------------------------
        // SKENARIO 1: IMAGE DI DALAM NAV
        // ------------------------------------------------
        if (tagName === "IMG" && isNav) {
            return {
                title: "NAVIGATION IMAGE",
                styles: STYLE_GROUPS.img, // Bisa edit border
                traits: [
                    { type: "text", name: "src", label: "Image Source" },
                    { type: "text", name: "href", label: "Link URL" }, // Bisa tambah link
                    {
                        type: "button",
                        label: "Assets",
                        text: "Change Image",
                        command: (e) => e.runCommand("open-assets"),
                    },
                ],
            };
        }

        // ------------------------------------------------
        // SKENARIO 2: LINK TEKS DI NAV (Bukan Tombol)
        // ------------------------------------------------
        if (tagName === "A" && !isBtn && isNav) {
            return {
                title: "NAVIGATION LINK",
                styles: STYLE_GROUPS.linkNav, // Font, Weight, Transform
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

        // ------------------------------------------------
        // SKENARIO 3: TOMBOL DI NAV (Class .btn / .btn-nav)
        // ------------------------------------------------
        if ((tagName === "A" || tagName === "BUTTON") && isBtn && isNav) {
            return {
                title: "NAVIGATION BUTTON",
                styles: STYLE_GROUPS.btnNav, // Font, Bg, Radius
                traits: [
                    { type: "text", name: "href", label: "Link URL" },
                    { type: "text", name: "class", label: "Classes" },
                ],
            };
        }

        // ------------------------------------------------
        // SKENARIO 4: TEKS BIASA (Content)
        // ------------------------------------------------
        // Cek apakah ini teks murni (tidak punya anak elemen layout)
        if (
            TEXT_CANDIDATES.includes(tagName) &&
            !isBtn &&
            !isIcon &&
            tagName !== "IMG"
        ) {
            const hasBlockChildren = comp
                .find("*")
                .some(
                    (c) =>
                        c.get("type") === "default" ||
                        c.get("tagName") === "DIV"
                );
            if (!hasBlockChildren) {
                return {
                    title: "TYPOGRAPHY",
                    styles: STYLE_GROUPS.text,
                    traits: [], // TIDAK ADA TRAITS (Tidak bisa tambah link/img)
                };
            }
        }

        // ------------------------------------------------
        // SKENARIO 5: TOMBOL BIASA (Di luar Nav)
        // ------------------------------------------------
        if (isBtn && !isNav) {
            return {
                title: "BUTTON STYLE",
                styles: STYLE_GROUPS.btnNav,
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

        // ------------------------------------------------
        // SKENARIO 6: IMAGE BIASA (Di luar Nav)
        // ------------------------------------------------
        if (tagName === "IMG" && !isNav) {
            return {
                title: "IMAGE STYLE",
                styles: STYLE_GROUPS.img,
                traits: [
                    { type: "text", name: "src", label: "Source" },
                    { type: "text", name: "alt", label: "Alt Text" },
                    {
                        type: "button",
                        label: "Assets",
                        text: "Change Image",
                        command: (e) => e.runCommand("open-assets"),
                    },
                    // TIDAK ADA HREF (Sesuai request: tidak bisa tambah link)
                ],
            };
        }

        // ------------------------------------------------
        // SKENARIO 7 & 8: ICON
        // ------------------------------------------------
        if (isIcon) {
            return {
                title: isFooter ? "FOOTER ICON" : "ICON STYLE",
                styles: STYLE_GROUPS.icon,
                traits: [
                    { type: "text", name: "href", label: "Link URL" },
                    { type: "text", name: "class", label: "Icon Class (fa-*)" },
                ],
            };
        }

        // Fallback default
        return {
            title: "ELEMENT SETTINGS",
            styles: ["padding", "margin", "background-color", "display"],
            traits: [{ type: "text", name: "id", label: "ID" }],
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
                            "letter-spacing",
                            "color",
                            "line-height",
                            "text-align",
                            "text-decoration",
                            "text-transform",
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
                            "opacity",
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
                    "/templates/css/font-awesome.min.css",
                ],
                scripts: [],
                style: `
                    /* Container Toolbar */
                    .gjs-toolbar {
                        background-color: #2c3e50 !important;
                        border: 1px solid #fff !important;
                        border-radius: 4px !important;
                        box-shadow: 0 4px 10px rgba(0,0,0,0.3) !important;
                        top: -35px !important; /* Geser ke atas elemen */
                        left: 0 !important;
                        z-index: 99999 !important; /* PASTI DI PALING ATAS */
                        opacity: 1 !important;
                        display: flex !important;
                        visibility: visible !important;
                    }
                    
                    /* Item/Ikon Toolbar */
                    .gjs-toolbar-item {
                        color: #ffffff !important;
                        width: 35px !important;
                        height: 35px !important;
                        cursor: pointer !important;
                    }

                    /* Hover Effect */
                    .gjs-toolbar-item:hover {
                        background-color: #1abc9c !important; 
                    }

                    /* Garis Seleksi Biru */
                    .gjs-cv-canvas .gjs-highlighter,
                    .gjs-cv-canvas .gjs-comp-selected {
                        border: 2px solid #3498db !important;
                    }
                `,
            },
        });

        // Override Default Image
        editor.DomComponents.addType("image", {
            model: { defaults: { traits: [] } },
        });

        editorRef.current = editor;

        editor.on("load", () => {
            // ... (Kode CSS Injection untuk content mode tetap sama) ...
            const canvasHead = editor.Canvas.getDocument().head;
            const styleId = "mode-content-style";
            if (!canvasHead.querySelector(`#${styleId}`)) {
                const styleEl = document.createElement("style");
                styleEl.id = styleId;
                styleEl.innerHTML = `
                    .mode-content-active * { pointer-events: none !important; cursor: default !important; }
                    .mode-content-active [contenteditable="true"], .mode-content-active [data-gjs-type="text"] { 
                        pointer-events: auto !important; cursor: text !important; outline: 2px dashed #4cd137 !important; 
                    }
                `;
                canvasHead.appendChild(styleEl);
            }

            // Command untuk Lihat Source Code per Element
            editor.Commands.add("custom-view-code", {
                run: (editor) => {
                    const selected = editor.getSelected();
                    if (selected) {
                        const html = selected.toHTML();
                        const css = editor.CodeManager.getCode(selected, "css"); // Ambil CSS terkait (opsional)
                        setSourceCode(`${html}`); // Tampilkan HTML elemen itu saja
                        setShowCode(true);
                    }
                },
            });

            // Load Templates
            fetch(`/api/proposal/templates`)
                .then((res) => res.json())
                .then((templates) => {
                    const rawCats = templates.map(
                        (t) => t.category || "Templates"
                    );
                    const cats = ["All Blocks", ...new Set(rawCats)];

                    setCategories(cats);
                    templates.forEach((tpl, index) => {
                        editor.BlockManager.add(`template-${index}`, {
                            category: tpl.category || "Templates",
                            media: `<img src="${tpl.preview}" style="width: 100%;" />`,
                            content: {
                                content: `<input type="hidden" data-template-category="${
                                    tpl.category || "Templates"
                                }">${tpl.html}`,
                                style: tpl.css,
                            },
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

        // ===============================================
        // PERBAIKAN UTAMA DISINI (EVENT LISTENER)
        // ===============================================

        // 1. SAAT ELEMEN DIPILIH
        editor.on("component:selected", (comp) => {
            if (!comp) return;
            const mode = activeModeRef.current;

            if (mode === "details") {
                const sidebar = document.getElementById(
                    "style-editor-container"
                );
                const sidebarTitle =
                    document.getElementById("sidebar-title-text");
                const traitHeader = document.getElementById("trait-header");

                // A. Tampilkan Sidebar
                if (sidebar) sidebar.style.display = "flex";

                // B. Ambil Config & Update Judul
                const config = getConfigForElement(comp);
                if (sidebarTitle) sidebarTitle.innerText = config.title;

                // C. Update Traits (Settings)
                comp.set("traits", config.traits);
                // Sembunyikan header "ATTRIBUTES" jika traits kosong
                if (traitHeader) {
                    traitHeader.style.display =
                        config.traits.length > 0 ? "block" : "none";
                }

                // D. Filter Style CSS
                const sm = editor.StyleManager;
                const sectors = sm.getSectors();
                sectors.forEach((sector) => {
                    let hasVisibleProps = false;
                    sector.get("properties").forEach((prop) => {
                        const propName = prop.get("property");
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
                            if (
                                allowed === "border-width" &&
                                propName === "border-width"
                            )
                                return true;
                            if (
                                allowed === "border-style" &&
                                propName === "border-style"
                            )
                                return true;
                            if (
                                allowed === "border-color" &&
                                propName === "border-color"
                            )
                                return true;
                            return false;
                        });
                        prop.set("visible", isAllowed);
                        if (isAllowed) hasVisibleProps = true;
                    });
                    sector.set("visible", hasVisibleProps);
                    sector.set("open", hasVisibleProps);
                });
            } else if (mode === "content") {
                // Logic content mode (biarkan seperti sebelumnya)
                const view = comp.getView();
                if (view?.el && comp.get("editable")) {
                    view.el.setAttribute("contenteditable", "true");
                    view.el.focus();
                }
            }
            markDirty();
        });

        // 2. SAAT KLIK RUANG KOSONG (DESELECT) -> TUTUP SIDEBAR
        editor.on("component:deselected", () => {
            markDirty();
            const sidebar = document.getElementById("style-editor-container");
            if (sidebar) sidebar.style.display = "none";
        });

        editor.on("component:add", (component) => {
            markDirty();
            setTimeout(
                () => applyComponentSettings(component, activeModeRef.current),
                50
            );
        });

        const markDirty = () => setIsDirty(true);

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
        const doc = parser.parseFromString(html, "text/html");

        const categoriesUsed = [
            ...new Set(
                [...doc.querySelectorAll("[data-template-category]")].map(
                    (el) => el.dataset.templateCategory
                )
            ),
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

        const externalPromises = canvasConfig.styles.map((url) =>
            getFilteredCss(url)
        );
        const externalResults = await Promise.all(externalPromises);

        const internalCss = filterCssRules(editor.getCss(), doc);

        const finalUsedCss = externalResults.join("\n") + "\n" + internalCss;

        const iframe = editor.Canvas.getFrameEl();
        const iframeBody = iframe.contentDocument.body;

        const imageBlob = await htmlToImage.toBlob(iframeBody, {
            backgroundColor: "#ffffff",
            pixelRatio: 2, // HD thumbnail
        });

        // Convert ke Base64 (untuk dikirim)
        const imageBase64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(imageBlob);
        });

        const form = new FormData();
        form.append("id", id);
        form.append("html", html);
        form.append("css", finalUsedCss);
        form.append("image", imageBase64);
        categoriesUsed.forEach((c) => form.append("categories[]", c));

        const res = await fetch("/proposal", {
            method: "POST",
            headers: {
                Accept: "application/json",
                "X-CSRF-TOKEN": document.querySelector(
                    'meta[name="csrf-token"]'
                ).content,
            },
            body: form,
        });

        const savePage = await res.json();

        if (savePage.success) {
            alert("Simpan Berhasil!");
            window.location.href = savePage.redirect;
        }
    };

    const handleViewCode = () => {
        const editor = editorRef.current;
        if (!editor) return;

        const html = editor.getHtml();
        const css = editor.getCss();

        const fullCode = `\n${html}\n\n/* CSS */\n<style>\n${css}\n</style>`;

        setSourceCode(fullCode);
        setShowCode(true);
    };

    // =========================================================
    // BAGIAN 3: UPDATE COMPONENT SETTINGS
    // =========================================================
    const applyComponentSettings = (comp, mode) => {
        if (!comp || typeof comp.get !== "function") return;

        // const tagName = comp.get("tagName")?.toUpperCase();
        const type = comp.get("type");
        const isWrapper = type === "wrapper";

        const parent = comp.parent();
        const isRootBlock =
            (parent && parent.get("type") === "wrapper") ||
            (!parent && !isWrapper);

        const view = comp.getView();
        if (view?.el && typeof view.el.removeAttribute === "function") {
            view.el.removeAttribute("contenteditable");
        }

        let props = {};

        if (mode === "elements") {
            const customToolbar = [
                {
                    attributes: {
                        class: "fa fa-arrows",
                        title: "Drag Element",
                    },
                    command: "tlb-move",
                },
                {
                    attributes: { class: "fa fa-code", title: "View Source" },
                    command: "custom-view-code",
                },
                {
                    attributes: { class: "fa fa-undo", title: "Reset" },
                    command: (e) => e.runCommand("core:undo"),
                },
                {
                    attributes: { class: "fa fa-trash", title: "Remove" },
                    command: "tlb-delete",
                },
            ];

            if (isWrapper) {
                // Wrapper (Kanvas Putih)
                props = {
                    selectable: false, // Jangan seleksi kanvasnya
                    draggable: false, // Kanvas tidak bisa digeser
                    droppable: true, // TAPI harus bisa menerima drop elemen
                    hoverable: false,
                };
            } else if (isRootBlock) {
                // ELEMEN UTAMA (Contoh: Section, Container besar)
                props = {
                    draggable: true, // BISA DIGESER (Penting!)
                    droppable: true, // Bisa terima elemen lain (opsional)
                    selectable: true, // Bisa diklik untuk muncul toolbar
                    removable: true, // Bisa dihapus
                    hoverable: true,
                    highlightable: true,
                    editable: false, // Teks tidak bisa diedit
                    badgable: true, // Muncul label nama elemen
                    toolbar: customToolbar, // Toolbar muncul DI SINI
                };
            } else {
                // ANAK ELEMEN (Teks, Tombol kecil di dalam box)
                props = {
                    draggable: false, // TIDAK BISA DIGESER keluar induknya
                    droppable: false,
                    selectable: true, // Masih bisa diklik (agar user sadar ini bagian dari grup)
                    removable: false, // Tidak bisa dihapus satuan
                    hoverable: true,
                    editable: false,
                    toolbar: [], // Toolbar KOSONG (User harus klik induknya jika mau hapus/geser)
                };
            }
        } else if (mode === "content") {
            if (
                view?.el &&
                typeof view.el.setAttribute === "function" &&
                (comp.is("text") || type === "text")
            ) {
                view.el.setAttribute("contenteditable", "true");
            }

            props = {
                // KUNCI STRUKTUR:
                draggable: false,
                droppable: false,
                removable: false,
                copyable: false,

                // IZINKAN EDIT KONTEN
                selectable: true,
                hoverable: true,
                editable: true, // Boleh edit teks

                // Toolbar Hilang (Agar user fokus konten)
                toolbar: [],
            };

            // Khusus Gambar: Izinkan upload saat didouble-click
            if (type === "image") {
                props.editable = true; // Double click memicu Asset Manager
            }
        } else if (mode === "details") {
            props = {
                draggable: false,
                droppable: false,
                removable: false,
                copyable: false,
                selectable: true, // Wajib TRUE agar event 'selected' jalan
                hoverable: true,
                editable: false, // Matikan edit teks (biar gak tabrakan sama klik)
                highlightable: true,
                toolbar: [],
                stylable: true, // Wajib TRUE agar CSS bisa diedit
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
                editor.Modal.setTitle("Source Code")
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
            if (activeModeRef.current === "elements" && isSectionRoot(comp)) {
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
        // 1. Update State React
        setActiveMode(mode);
        activeModeRef.current = mode;

        const editor = editorRef.current;
        if (!editor) return;

        // 2. Reset Seleksi & Sidebar UI
        editor.select(null);
        const sidebar = document.getElementById("style-editor-container");
        if (sidebar) sidebar.style.display = "none";

        // 3. Terapkan Aturan ke Wrapper (Canvas Utama)
        const wrapper = editor.getWrapper();
        if (wrapper) {
            // Tentukan aturan Wrapper berdasarkan mode
            if (mode === "content" || mode === "details") {
                // Di mode Content/Details, Canvas tidak boleh terima drop elemen baru
                wrapper.set({
                    selectable: false,
                    hoverable: false,
                    droppable: false,
                    draggable: false,
                });
            } else {
                // Di mode Elements, Canvas boleh terima drop
                wrapper.set({
                    droppable: true,
                    selectable: false,
                    draggable: false,
                });
            }

            // 4. Update Anak Elemen secara Rekursif
            // Fungsi helper untuk loop ke dalam
            const updateRecursively = (component) => {
                applyComponentSettings(component, mode); // Terapkan logic (editable/draggable)

                // Cek apakah punya anak
                const children = component.get("components");
                if (children) {
                    children.forEach((child) => updateRecursively(child));
                }
            };

            // Jalankan loop mulai dari komponen di dalam wrapper
            const components = wrapper.get("components");
            if (components) {
                components.forEach((child) => updateRecursively(child));
            }
        }

        // 5. Visual Helper (Garis Putus-putus)
        if (mode === "elements") {
            try {
                editor.runCommand("core:component-outline");
            } catch (e) {}
        } else {
            try {
                editor.stopCommand("core:component-outline");
            } catch (e) {}
        }

        // 6. Refresh Canvas
        editor.refresh();
    };

    const isStructural = (comp) => {
        const cls = comp.getClasses();
        return (
            cls.includes("container") ||
            cls.includes("row") ||
            cls.some((c) => c.startsWith("col-"))
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
        const cleanSelector = selector
            .split(":")[0]
            .split(",")[0] // Ambil bagian pertama jika multiple selector
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
            canvasConfig.styles.map((url) => getFilteredCss(url))
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
            canvasConfig.styles.map((url) => getFilteredCss(url))
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
                    <Head title="Create Proposal" />
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
                                ${
                                    isDirty
                                        ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                        : "cursor-not-allowed bg-emerald-200 text-emerald-700"
                                }
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
                <div
                    id="style-editor-container"
                    className={`style-sidebar-left ${
                        activeMode === "details" ? "open" : ""
                    }`}
                >
                    {/* Header Custom */}
                    <div className="sidebar-header-custom">
                        <span id="sidebar-title-text">
                            <h3>SETTINGS</h3>
                        </span>
                        <button
                            onClick={() =>
                                document
                                    .getElementById("style-editor-container")
                                    .classList.remove("open")
                            }
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
