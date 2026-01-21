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
 
export default function Create({ proposal, template }) {
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

        if (tagName === "FIGURE") {
            return {
                title: "IMAGE CONTAINER",
                // Tambahkan background-image ke daftar styles yang boleh diedit
                styles: STYLE_GROUPS.img.concat([
                    "background-image", 
                    "background-size", 
                    "background-position", 
                    "background-repeat"
                ]),
                traits: [
                    {
                        type: "button",
                        label: "Background",
                        text: "Change Background",
                        command: (e) => e.runCommand("open-assets"),
                    },
                ],
            };
        }
 
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
                    {
                        type: "button",
                        label: "Icon",
                        text: "Select Icon",
                        full: true,
                        command: "open-icon-picker"
                    }
                ],
            }; 
        }

        if (tagName === "FIGURE" || classes.includes('bg-img') || classes.includes('img-wrap')) {
            return {
                title: "IMAGE CONTAINER",
                styles: STYLE_GROUPS.img.concat([
                    "background-image", 
                    "background-size", 
                    "background-position", 
                    "background-repeat"
                ]),
                traits: [
                    {
                        type: "button",
                        label: "Background",
                        text: "Change Background",
                        command: (e) => e.runCommand("open-assets"),
                    },
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
 
    const withHTMLElement = (view, cb) => { 
        const el = view?.el; 
        if (el instanceof HTMLElement) cb(el); 
    }; 

    const normalizeFaIcon = (model) => {
        const attrs = model.getAttributes() || {};
        if (attrs['data-fa-icon']) return; // sudah ada

        const classes = model.getClasses() || [];
        const faIcon = classes.find(c => c.startsWith('fa-'));

        if (faIcon) {
            model.addAttributes({ 'data-fa-icon': faIcon });
        }
    };
 
    useEffect(() => { 
        setLoading(true); 
 
        const editor = grapesjs.init({ 
            container: "#gjs", 
            height: "100%", 
            width: "100%", 
            storageManager: false, 
            allowScripts: 1, 
            assetManager: { 
                autoAdd: true, 
                openAssetsOnDrop: true, 
            }, 
            avoidInlineStyle: false, 
            forceClass: false, 
            selectable: true, 
            blockManager: { appendTo: "#second-side" }, 
            traitManager: { appendTo: "#trait-editor-container" }, 
            styleManager: {  
                appendTo: "#style-manager-container", 
                clearProperties: false, 
                sectors: [ 
                    { name: 'Typography', open: false, buildProps: ['font-family', 'font-size', 'font-weight', 'letter-spacing', 'color', 'line-height', 'text-align', 'text-decoration', 'text-transform'] }, 
                    { name: 'Decorations', open: false, buildProps: ['background-color', 'border-radius', 'border-top-left-radius', 'border-top-right-radius', 'border-bottom-left-radius', 'border-bottom-right-radius', 'box-shadow', 'background-image', 'opacity'] }, 
                    { name: 'Dimensions', open: false, buildProps: ['width', 'height', 'min-height', 'padding', 'margin', 'padding-top', 'padding-bottom', 'padding-left', 'padding-right'] }, 
                    { name: 'Borders', open: false, buildProps: ['border-width', 'border-style', 'border-color'] } 
                ] 
            }, 
            panels: { defaults: [] }, 
            canvas: {  
                styles: [ 
                    "/templates/css/style.css", 
                    "/templates/css/plugins/bootstrap.min.css", 
                    '/templates/css/font-awesome.min.css', 
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

                    .gjs-selected { 
                        background-repeat: no-repeat !important;
                        background-position: center !important;
                        background-size: cover !important; 
                    }
                `, 
            }, 
        }); 
 
        editorRef.current = editor; 
        
        let syncingBg = false;
        editor.on('component:styleUpdate', (model, payload) => {
            if (syncingBg) return;

            const style = payload?.style || payload;
            const val = style?.['background-image'];
            if (!val) return;

            syncingBg = true;

            model.addStyle({
                'background-image': `${val} !important`,
                'background-size': 'cover !important',
                'background-position': 'center !important',
            });

            syncingBg = false;
        });

        editor.on('asset:select', (asset) => {
            const selected = editor.getSelected();
            if (selected) {
                const url = asset.getSrc();
                const fullUrl = `url("${url}")`;

                // 1. Paksa masuk ke model CSS GrapesJS
                selected.addStyle({
                    'background-image': `${fullUrl} !important`,
                    'background-size': 'cover !important',
                    'background-position': 'center !important'
                });

                // 2. Manipulasi DOM secara langsung untuk memastikan visual update
                const el = selected.getEl();
                if (el) {
                    el.style.setProperty('background-image', fullUrl, 'important');
                    el.style.setProperty('background-size', 'cover', 'important');
                    el.style.setProperty('background-position', 'center', 'important');
                }
                
                editor.AssetManager.close();
            }
        });

        fetch('/api/proposal/icon')
            .then(res => res.json())
            .then(data => {
                editorRef.current.faIcons = data;
            });
 
        editor.on("load", () => { 
            // ... (Kode CSS Injection untuk content mode tetap sama) ... 
            const canvasHead = editor.Canvas.getDocument().head; 
            const styleId = 'mode-content-style'; 
            if (!canvasHead.querySelector(`#${styleId}`)) { 
                const styleEl = document.createElement('style'); 
                styleEl.id = styleId; 
                styleEl.innerHTML = ` 
                    .mode-content-active * { pointer-events: none !important; cursor: default !important; } 
                    .mode-content-active [contenteditable="true"], .mode-content-active [data-gjs-type="text"] {  
                        pointer-events: auto !important; cursor: text !important; outline: 2px dashed #4cd137 !important;  
                    } 
                `; 
                canvasHead.appendChild(styleEl); 
            } 
 
            // Load Templates 
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
                                components: tpl.html, 
                                attributes: {
                                    "data-template-category": tpl.category,
                                    "data-gjs-section": "true"
                                },
                                active: true
                            } 
                        }); 
                    }); 
                }); 
 
            Promise.resolve() 
                .then(() => { 
                    if (template?.html_output) editor.setComponents(template.html_output); 
                    if (template?.css_output) editor.setStyle(template.css_output); 
                }) 
                .finally(() => { 
                    setLoading(false); 
                    setTimeout(() => changeMode("elements"), 300); 
                }); 

            editor.Config.avoidInlineStyle = false;

        }); 
 
        editor.on("component:select:before", (component, options) => { 
            if (activeModeRef.current === "details" || activeModeRef.current === "content") {
                return; 
            }

            if (activeModeRef.current !== "elements") return; 
 
            // ROOT boleh dipilih 
            if (isSectionRoot(component)) return; 
 
            // Selain ROOT → naikkan ke parent ROOT 
            const parentRoot = findSectionRoot(component); 
 
            if (parentRoot) { 
                options.abort = true; 
                editor.select(parentRoot); 
            } else { 
                // elemen liar tanpa root → tidak bisa select 
                options.abort = true; 
            } 
        }); 
         
        // 1. SAAT ELEMEN DIPILIH 
        editor.on("component:selected", (comp) => { 
            if (!comp) return; 
            const mode = activeModeRef.current; 
 
            if (mode === "details") { 
                const sidebar = document.getElementById("style-editor-container"); 
                const sidebarTitle = document.getElementById("sidebar-title-text"); 
                const traitHeader = document.getElementById("trait-header"); 
 
                if (sidebar) sidebar.style.display = "flex"; 
 
                const config = getConfigForElement(comp); 
                if (sidebarTitle) {

                    sidebarTitle.innerHTML = "";

                    const icon = document.createElement("i");
                    icon.className = "fa fa-pencil-square-o";

                    const text = document.createElement("span");
                    text.textContent = config.title;

                    sidebarTitle.append(icon, " ", text);

                }
 
                comp.set("traits", config.traits || []); 
                if (traitHeader) { 
                    traitHeader.style.display = config.traits.length ? "block" : "none"; 
                } 
 
                const sm = editor.StyleManager; 
                sm.getSectors().forEach((sector) => { 
                    let visible = false; 
                    sector.get("properties").forEach((prop) => { 
                        const name = prop.get("property"); 
                        const allowed = config.styles.some((a) => 
                            a === name || 
                            (a === "padding" && name.startsWith("padding")) || 
                            (a === "margin" && name.startsWith("margin")) || 
                            (a === "border" && name.startsWith("border")) 
                        ); 
                        prop.set("visible", allowed); 
                        if (allowed) visible = true; 
                    }); 
                    sector.set({ visible, open: visible }); 
                }); 
            } 
 
            if (mode === "content") { 
                withHTMLElement(comp.getView(), (el) => { 
                    if (comp.get("editable")) { 
                        el.setAttribute("contenteditable", "true"); 
                        el.focus({ preventScroll: true }); 
                    } 
                }); 
 
                const isImage = 
                    comp.is('image') || 
                    comp.get('type') === 'image' || 
                    comp.get('tagName') === 'IMG'; 
 
                if (!isImage) return; 
 
                editor.runCommand('core:open-assets', { 
                    target: comp, 
                    select: true, 
                }); 
            }
        }); 
 
        editor.on("component:deselected", () => { 
            const sidebar = document.getElementById("style-editor-container"); 
            if (sidebar) sidebar.style.display = "none"; 
        }); 
 
        editor.on("component:add", (component) => { 
            applyComponentSettings(component, activeModeRef.current);
            const attrs = component.getAttributes?.() || {}; 
 
            if (attrs["data-template-category"] && !component.get("initialContent")) { 
                component.set({ 
                    initialContent: component.toHTML(), 
                    initialStyle: editor.getCss({ component }), 
                }); 
            } 
        }); 
 
        editor.on("rte:enable", () => { 
            if (activeModeRef.current === "details") { 
                editor.stopCommand("rte:enable"); 
            } 
        }); 
 
        editor.on('component:dblclick', (comp) => { 
            const isImage = 
                comp.is('image') || 
                comp.get('type') === 'image' || 
                comp.get('tagName') === 'IMG'; 
 
            if (!isImage) return; 
 
            editor.runCommand('core:open-assets', { 
                target: comp, 
                select: true, 
            }); 
        });

        editor.Commands.add('open-icon-picker', {
            run(editor) {
                const modal = editor.Modal;
                const selected = editor.getSelected();
                if (!selected) return;

                modal.setTitle('Select Icon');
                modal.setContent(`
                    <input id="icon-search" placeholder="Search icon..."/>
                    <div id="icon-list"></div>
                `);

                modal.open();

                const list = document.getElementById('icon-list');
                const search = document.getElementById('icon-search');

                const icons = editor.faIcons || [];

                const render = items => {
                    list.innerHTML = items.map(i => `
                        <div data-icon="${i.value}" title="${i.label}"
                            style="cursor:pointer;text-align:center">
                            <i class="fa ${i.value}"></i>
                        </div>
                    `).join('');
                };

                render(icons);

                search.oninput = e => {
                    const q = e.target.value.toLowerCase();
                    render(
                        icons.filter(i =>
                            i.label.toLowerCase().includes(q)
                        )
                    );
                };

                list.onclick = e => {
                    const icon = e.target.closest('[data-icon]');
                    if (!icon) return;

                    normalizeFaIcon(selected);

                    const newIcon = icon.dataset.icon;
                    const oldIcon = selected.getAttributes()?.['data-fa-icon'];

                    if (oldIcon) {
                        selected.removeClass(oldIcon);
                    }

                    selected.addClass('fa');
                    selected.addClass(newIcon);

                    selected.addAttributes({ 'data-fa-icon': newIcon });
                    modal.close();
                };
            }
        });
 
        editor.Commands.add('custom-view-code', { 
            run(editor) { 
                const selected = editor.getSelected(); 
                if (selected) { 
                    const html = selected.toHTML(); 
                    const css = editor.CodeManager.getCode(selected, 'css'); // Ambil CSS terkait (opsional) 
                    setSourceCode(`${html}`); // Tampilkan HTML elemen itu saja 
                    setShowCode(true); 
                } 
            } 
        }); 
 
        editor.Commands.add("reset-section", { 
            run(editor) { 
                if (activeModeRef.current !== "elements") return; 
 
                const selected = editor.getSelected(); 
                if (!selected) return; 
 
                const html = selected.get("initialContent"); 
                const css = selected.get("initialStyle"); 
 
                if (!html) { 
                    alert("Reset tidak tersedia untuk elemen ini"); 
                    return; 
                } 
 
                selected.components(html); 
 
                if (css) { 
                    editor.CssComposer.add(css); 
                } 
            }, 
        }); 

        editor.DomComponents.addType('social-icon', {
            model: {
                defaults: {
                    traits: [
                        {
                            type: 'button',
                            label: 'Icon',
                            text: 'Select Icon',
                            full: true,
                            command: 'open-icon-picker'
                        }
                    ]
                }
            }
        });
 
        editor.DomComponents.addType('image', { 
            model: { 
                defaults: { 
                    selectable: true, 
                    hoverable: true, 
                    draggable: false, 
                    removable: false, 
                    traits: ['src'], 
                } 
            } 
        }); 

        const markDirty = () => setIsDirty(true); 
 
        editor.on("component:add", markDirty); 
        editor.on("component:remove", markDirty); 
        editor.on("component:update", markDirty); 
        editor.on("style:property:update", markDirty); 
 
        return () => { 
            if (editorRef.current) { 
                editorRef.current.destroy(); 
                editorRef.current = null; 
            } 
        }; 
 
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
 
    const applyComponentSettings = (comp, mode) => { 
        if (!comp || typeof comp.get !== "function") return; 
 
        if (comp.__appliedMode === mode) return; 
        comp.__appliedMode = mode; 
 
        let props = {}; 
 
        if (mode === 'elements') { 
            const isRoot = isSectionRoot(comp); 
 
            props = { 
                selectable: isRoot, 
                draggable: isRoot, 
                droppable: isRoot, 
                removable: isRoot, 
                copyable: isRoot, 
                hoverable: isRoot, 
                editable: false, 
                highlightable: isRoot, 
                toolbar: isRoot 
                    ? [ 
                        { attributes: { class: 'fa fa-arrows', title: 'Move' }, command: 'tlb-move' }, 
                        { attributes: { class: 'fa fa-code', title: 'View Code' }, command: 'custom-view-code' }, 
                        { attributes: { class: 'fa fa-refresh', title: 'Reset' }, command: 'reset-section' }, 
                        { attributes: { class: 'fa fa-trash', title: 'Remove' }, command: 'tlb-delete' }, 
                    ] 
                    : [], 
            }; 
        } 
 
        if (mode === 'content') { 
            props = { 
                draggable: false, 
                droppable: true, 
                removable: false, 
                copyable: false, 
 
                selectable: true, 
                hoverable: true, 
                editable: true, // ⬅️ BIARKAN GRAPESJS HANDLE 
                toolbar: [], 
            }; 
        } 
 
        if (mode === 'details') { 
            props = { 
                draggable: false, 
                droppable: true, 
                removable: false, 
                copyable: false, 
 
                selectable: true, 
                hoverable: true, 
                editable: false, 
                highlightable: true, 
                stylable: true, 
                toolbar: [], 
            }; 
        } 
        comp.set(props); 
    }; 
 
    const changeMode = (mode) => { 
        // 1. Update State React 
        setActiveMode(mode); 
        activeModeRef.current = mode; 
         
        const editor = editorRef.current; 
        if (!editor) return; 
 
        resetAllComponentsForMode(editorRef.current, mode); 
 
        // 2. Reset Seleksi & Sidebar UI 
        editor.select(null);  
        const sidebar = document.getElementById("style-editor-container"); 
        if (sidebar) sidebar.style.display = 'none'; 
 
        // 3. Terapkan Aturan ke Wrapper (Canvas Utama) 
        const wrapper = editor.getWrapper(); 
        if (wrapper) { 
            // Tentukan aturan Wrapper berdasarkan mode 
            if (mode === "content" || mode === "details") { 
                // Di mode Content/Details, Canvas tidak boleh terima drop elemen baru 
                wrapper.set({  
                    selectable: true,  
                    hoverable: false,  
                    droppable: true, 
                    draggable: false 
                }); 
            } else { 
                // Di mode Elements, Canvas boleh terima drop 
                wrapper.set({  
                    droppable: true, 
                    selectable: false, 
                    draggable: false 
                });  
            } 
             
            // 4. Update Anak Elemen secara Rekursif 
            // Fungsi helper untuk loop ke dalam 
            const updateRecursively = (component) => { 
                applyComponentSettings(component, mode); // Terapkan logic (editable/draggable) 
                 
                // Cek apakah punya anak 
                const children = component.get("components"); 
                if (children) { 
                    children.forEach(child => updateRecursively(child)); 
                } 
            }; 
             
            // Jalankan loop mulai dari komponen di dalam wrapper 
            const components = wrapper.get("components"); 
            if(components) { 
                components.forEach(child => updateRecursively(child)); 
            } 
        } 
         
        // 5. Visual Helper (Garis Putus-putus) 
        if (mode === "elements") { 
            try { editor.runCommand("core:component-outline"); } catch(e){} 
        } else { 
            try { editor.stopCommand("core:component-outline"); } catch(e){} 
        } 
 
        // 6. Refresh Canvas 
        editor.refresh(); 
    }; 
 
    const isSectionRoot = (comp) => { 
        const attrs = comp.getAttributes?.() || {}; 
        return !!attrs['data-template-category']; 
    }; 
 
    const findSectionRoot = (comp) => { 
        let current = comp; 
        while (current && !isSectionRoot(current)) { 
            current = current.parent(); 
        } 
        return current; 
    }; 
 
    const isStructural = (comp) => { 
        const cls = comp.getClasses(); 
        return ( 
            cls.includes("container") || 
            cls.includes("row") || 
            cls.some((c) => c.startsWith("col-")) 
        ); 
    }; 
 
    const resetAllComponentsForMode = (editor, mode) => { 
        const all = editor.DomComponents.getWrapper().find('*'); 
 
        all.forEach(comp => { 
            // HENTIKAN EDIT TEXT TOTAL 
            comp.set({ 
                editable: false, 
                hoverable: true, 
            }, { silent: true }); 
 
            // HAPUS MODE FLAG 
            delete comp.__appliedMode; 
        }); 
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
 
    const savePage = async () => { 
         if (!editorRef.current) return; 
 
        const editor = editorRef.current; 
 
        const html = editor.getHtml(); 
 
        const parser = new DOMParser(); 
        const doc = parser.parseFromString(html, "text/html"); 
 
        const categoriesUsed = [ 
            ...new Set( 
                [...doc.querySelectorAll("[data-template-category]")]                    
                .map((el) => el.dataset.templateCategory)
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
 
        const externalPromises = canvasConfig.styles.map((url) => getFilteredCss(url)); 
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
        form.append("id", proposal.id); 
        form.append("html", html); 
        form.append("css", finalUsedCss); 
        form.append("image", imageBase64); 
        categoriesUsed.forEach(c => form.append("categories[]", c)); 
 
        const res = await fetch("/proposal", { 
            method: "POST", 
            headers: { 
                "Accept": "application/json", 
                "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]').content, 
            }, 
            body: form, 
        }); 
 
        const savePage = await res.json(); 

        if (savePage.success) {
            alert("Simpan Berhasil!"); 
            window.location.href = savePage.redirect; 
        } 
     }; 
 
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
 
    const goBack = () => { 
        if (isDirty) { 
            const confirmLeave = window.confirm( 
                "Perubahan belum disimpan.\nApakah Anda yakin ingin kembali?" 
            ); 
 
            if (!confirmLeave) return; 
        } 
 
        window.history.back(); 
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
                        <button 
                            onClick={goBack} 
                            className=" 
                                inline-flex items-center gap-2 
                                rounded-md bg-zinc-200 px-3 py-2 
                                text-sm font-medium text-zinc-800 
                                hover:bg-zinc-300 transition 
                            " 
                        > 
                            Back 
                        </button> 
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
                            {isDirty ? "Save" : "Nothing new to save"} 
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
                                    .getElementById( 
                                        "style-editor-container" 
                                    ) 
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
                                <span>{proposal?.title}.html</span> 
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
