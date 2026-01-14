import { useEffect, useRef, useState } from "react";
import grapesjs from "grapesjs";
import "grapesjs/dist/css/grapes.min.css";
import "@/assets/css/grapes-custom.css";

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

export default function Create({ id, template }) {
    const [loading, setLoading] = useState(false);
    const editorRef = useRef(null);
    const activeModeRef = useRef("elements");
    const [categories, setCategories] = useState([]);
    const [activeCat, setActiveCat] = useState("All Blocks");
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isCatSelected, setIsCatSelected] = useState(false);
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
                    "/templates/css/plugins/bootstrap.min.css",
                    "/templates/css/style.css",
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
                `;
                canvasHead.appendChild(styleEl);
            }

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
                            content: { content: tpl.html, style: tpl.css },
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
            setTimeout(
                () => applyComponentSettings(component, activeModeRef.current),
                10
            );
        });

        return () => editor.destroy();
    }, []);

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
            props = {
                draggable: !isWrapper,
                droppable: true,
                selectable: true,
                hoverable: true,
                editable: true,
                highlightable: true,
                toolbar: undefined,
            };
        } else if (mode === "content") {
            props = {
                draggable: false,
                droppable: false,
                removable: false,
                copyable: false,
                selectable: isText,
                hoverable: isText,
                editable: isText,
                highlightable: isText,
                toolbar: [],
            };
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
        editor.refresh();
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
                    <div className="modes">
                        <span className="mode-label">BUILDING MODE:</span>
                        {["elements", "content", "details"].map((m) => (
                            <button
                                key={m}
                                className={`mode-btn ${
                                    activeMode === m ? "active" : ""
                                }`}
                                onClick={() => changeMode(m)}
                            >
                                <i
                                    className={
                                        activeMode === m
                                            ? "far fa-dot-circle"
                                            : "far fa-circle"
                                    }
                                ></i>{" "}
                                {m.charAt(0).toUpperCase() + m.slice(1)}
                            </button>
                        ))}
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
                                <span>index.html</span>
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
