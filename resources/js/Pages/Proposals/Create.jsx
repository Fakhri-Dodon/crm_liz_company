import { useEffect, useRef, useState } from "react";
import grapesjs from "grapesjs";
import { router } from "@inertiajs/react";
import "grapesjs/dist/css/grapes.min.css";
import "@/assets/css/grapes-custom.css";

export default function Create({ id, template }) {
    const [loading, setLoading] = useState(false);
    const editorRef = useRef(null);
    const activeModeRef = useRef("elements");
    const [categories, setCategories] = useState([]);
    const [activeCat, setActiveCat] = useState("All Blocks");
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isCatSelected, setIsCatSelected] = useState(false);
    const [activeMode, setActiveMode] = useState("elements");

    useEffect(() => {
        setLoading(true);
        const editor = grapesjs.init({
            container: "#gjs",
            height: "100%",
            width: "100%",
            storageManager: false,
            allowScripts: 1,
            // PENTING: Mencegah inline style GrapesJS yang merusak Bootstrap
            avoidInlineStyle: true,
            // PENTING: Pastikan komponen tidak dibungkus div tambahan yang aneh
            forceClass: false,
            draggableComponents: true,
            blockManager: { appendTo: "#second-side" },
            styleManager: { appendTo: "#style-editor-container" },
            traitManager: { appendTo: "#style-editor-container" },
            panels: { defaults: [] },
            canvas: {
                styles: [
                    "/templates/css/plugins/bootstrap.min.css",
                    "/templates/css/style.css",
                ],
            },
        });

        editor.DomComponents.addType("image", {
            model: {
                defaults: {
                    traits: [
                        {
                            type: "text",
                            label: "Alt Text",
                            name: "alt",
                        },
                        {
                            type: "file",
                            label: "Image",
                            name: "src",
                            accept: "image/*",
                        },
                    ],
                },
            },
        });


        editorRef.current = editor;

        editor.on("load", () => {
            fetch(`/api/proposal/templates`)
                .then((res) => res.json())
                .then((templates) => {
                    const cats = ["All Blocks", ...new Set(templates.map((t) => t.category))];
                    setCategories(cats);
                    templates.forEach((tpl, index) => {
                        editor.BlockManager.add(`template-${index}`, {
                            category: tpl.category || "Templates",
                            media: `<img src="${tpl.preview}" style="width: 100%;" />`,
                            // Gunakan format konten yang bersih tanpa wrapper tambahan
                            content: `${tpl.html}<style>${tpl.css}</style>`,
                        });
                    });
                })
                .finally(() => setLoading(false));

            if (template) {
                if (template.html_output) editor.setComponents(template.html_output);
                if (template.css_output) editor.setStyle(template.css_output);
            }

            // REFRESH SETIAP KALI SELESAI DROP UNTUK FIX LAYOUT
            editor.on('block:drag:stop', (model) => {
                if (!model) return;
                
                // Pastikan elemen utama block memiliki display block agar tidak tumpuk ke samping
                model.addStyle({ 
                    display: 'block', 
                    width: '100%',
                    position: 'relative'
                });
                
                // Jika elemen mengandung row Bootstrap, pastikan display flex tetap aktif
                if (model.getAttributes().class?.includes('row')) {
                    model.addStyle({ display: 'flex' });
                }
            });

            editor.on("component:drag:end", () => {
                editor.refresh();
            });

            editor.on("component:selected", (comp) => {
                if (activeModeRef.current === "details" && comp.get("tagName") === "IMG") {
                    comp.set({ draggable: false });
                }
            });


            setTimeout(() => changeMode("elements"), 100);
        });

        const handleCanvasUpdate = () => {
            const wrapper = document.getElementById("frameWrapper");
            const hasContent = editor.getComponents().length > 0;
            wrapper?.classList.toggle("not-empty", hasContent);
        };

        editor.on("component:add", (component) => {
            applyComponentSettings(component, activeModeRef.current);
            handleCanvasUpdate();
        });

        editor.on("component:remove", handleCanvasUpdate);

        return () => editor.destroy();
    }, []);

    const applyComponentSettings = (comp, mode) => {
        const type = comp.get("type");
        const tagName = comp.get("tagName")?.toUpperCase();

        const isText =
            type === "text" ||
            type === "textnode" ||
            ["P", "H1", "H2", "H3", "H4", "H5", "H6", "SPAN", "A", "LI"].includes(tagName);

        if (mode === "elements") {
            const isLayout =
                ["SECTION", "HEADER", "FOOTER", "MAIN", "DIV", "NAV"].includes(tagName);

            comp.set({
                draggable: true,
                droppable: isLayout, // 🔥 INI KUNCI
                selectable: true,
                hoverable: true,
                editable: false,
                removable: true,
                copyable: true,
                badgable: true,
            });
        }

        if (mode === "content") {
            comp.set({
                draggable: false,
                droppable: false,
                selectable: isText,
                hoverable: isText,
                editable: isText,
                removable: false,
                copyable: false,
                badgable: false,
            });
        }

        if (mode === "details") {
            const isImage = tagName === "IMG";

            comp.set({
                draggable: false,
                droppable: false,
                selectable: true,
                hoverable: true,
                editable: false,
                removable: false,
                copyable: false,
                badgable: true,

                // 🔥 INI KUNCI
                traits: isImage ? comp.get("traits") : [],
            });
        }
    };


    const changeMode = (mode) => {
        setActiveMode(mode);
        activeModeRef.current = mode;
        const editor = editorRef.current;
        if (!editor) return;

        const wrapper = editor.getWrapper();
        const isElem = mode === "elements";

        wrapper.set({ draggable: false });
        isElem ? editor.runCommand("core:component-outline") : editor.stopCommand("core:component-outline");

        wrapper.find("*").forEach((comp) => applyComponentSettings(comp, mode));
        editor.runCommand("core:canvas-clear-selection");
        editor.refresh();
    };

    const filterCategory = (cat) => {
        setIsCatSelected(true);
        setActiveCat(cat);
        setTimeout(() => {
            const bm = editorRef.current.BlockManager;
            const blocks = cat === "All Blocks" 
                ? bm.getAll().models 
                : bm.getAll().filter(b => (typeof b.get("category") === "object" ? b.get("category").id : b.get("category")) === cat);
            bm.render(blocks);
        }, 50);
    };

    return (
        <div className={`builder-body ${isSidebarOpen ? "sidebar-expanded" : "sidebar-collapsed"}`}>
            <div 
                className="menu-left" 
                onMouseEnter={() => setIsSidebarOpen(true)} 
                onMouseLeave={() => { setIsSidebarOpen(false); setIsCatSelected(false); }}
                style={{ zIndex: 1000 }} // Pastikan sidebar di atas canvas
            >
                {/* ICON GEAR UNTUK MEMBUKA SIDEBAR */}
                <div className="icon-trigger-area">
                    <i className="fa fa-cog fa-lg"></i>
                </div>

                <div className="main-nav">
                    <h3><i className="fa fa-th-large"></i> BLOCKS</h3>
                    <ul className="elements-list">
                        {categories.map((cat) => (
                            <li key={cat} className={activeCat === cat ? "active" : ""}>
                                <a href="#" onClick={(e) => { e.preventDefault(); filterCategory(cat); }}>{cat}</a>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className={`second-side ${isCatSelected ? "show" : ""}`} id="second-side">
                    <div className="second-side-header" onClick={() => setIsCatSelected(false)}>
                        <i className="fa fa-chevron-left"></i> HIDE
                    </div>
                </div>
            </div>

            <div className="container-main">
                <header className="builder-header">
                    <div className="modes">
                        <span className="mode-label">BUILDING MODE:</span>
                        {["elements", "content", "details"].map((m) => (
                            <button key={m} className={`mode-btn ${activeMode === m ? "active" : ""}`} onClick={() => changeMode(m)}>
                                <i className={activeMode === m ? "far fa-dot-circle" : "far fa-circle"}></i> {m.charAt(0).toUpperCase() + m.slice(1)}
                            </button>
                        ))}
                    </div>
                </header>

                <div className="screen-area">
                    <div className="screen" id="screen">
                        <div className="toolbar">
                            <div className="buttons clearfix"><span className="left red"></span><span className="left yellow"></span><span className="left green"></span></div>
                            <div className="title"><span>index.html</span></div>
                        </div>
                        <div id="frameWrapper" className="frameWrapper empty">
                            <div id="style-editor-container" style={{
                                display: activeMode === "details" ? "block" : "none",
                                position: "fixed", right: 0, top: "70px", width: "280px", height: "calc(100vh - 70px)",
                                backgroundColor: "#2f4154", zIndex: 100, overflowY: "auto", padding: "15px", color: "white"
                            }}>
                                <h4 style={{ fontSize: "12px", marginBottom: "15px", borderBottom: "1px solid #444" }}>STYLE SETTINGS</h4>
                            </div>
                            <div id="gjs" style={{ position: "relative", zIndex: 10 }}></div>
                            <div className="start" id="start"><span>Build your page by dragging elements onto the canvas</span></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}