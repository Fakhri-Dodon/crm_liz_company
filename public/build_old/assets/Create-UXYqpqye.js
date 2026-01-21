import{r as u,j as r,H as ne}from"./app-D-CXuYp-.js";import{_ as re,t as ae}from"./index-GD9ZTHuP.js";const ie=["H1","H2","H3","H4","H5","H6","P","SPAN","LI","LABEL","DIV","STRONG","B","EM","I","SMALL"],j={text:["color","font-size","background-color","font-family","font-weight","text-align","line-height","letter-spacing"],linkNav:["font-weight","font-size","text-transform","color"],btnNav:["font-weight","font-size","background-color","color","border-radius"],img:["border-top-left-radius","border-top-right-radius","border-bottom-left-radius","border-bottom-right-radius","border-color","border-style","border-width","width","height"],icon:["color","font-size"]};function ue({id:B,template:N}){const d=u.useRef(null),C=u.useRef("elements"),[D,O]=u.useState([]),[_,H]=u.useState("All Blocks"),[q,I]=u.useState(!1),[G,T]=u.useState(!1),[v,U]=u.useState(!1),[oe,E]=u.useState(!1),[A,F]=u.useState("elements"),[le,$]=u.useState(!1),[ce,z]=u.useState(""),W=e=>{const n=e.getEl();if(!n)return{title:"Settings",styles:[],traits:[]};const t=e.get("tagName")?.toUpperCase(),s=e.getClasses(),a=n.closest("nav")!==null||n.closest(".navbar")!==null,o=n.closest("footer")!==null,i=s.includes("btn")||s.includes("btn-nav")||t==="BUTTON",l=t==="I"||s.some(c=>c.startsWith("fa")||c.startsWith("icon-"));return t==="IMG"&&a?{title:"NAVIGATION IMAGE",styles:j.img,traits:[{type:"text",name:"src",label:"Image Source"},{type:"text",name:"href",label:"Link URL"},{type:"button",label:"Assets",text:"Change Image",command:c=>c.runCommand("open-assets")}]}:t==="A"&&!i&&a?{title:"NAVIGATION LINK",styles:j.linkNav,traits:[{type:"text",name:"href",label:"Link URL"},{type:"select",name:"target",label:"Target",options:[{value:"",name:"Same Tab"},{value:"_blank",name:"New Tab"}]}]}:(t==="A"||t==="BUTTON")&&i&&a?{title:"NAVIGATION BUTTON",styles:j.btnNav,traits:[{type:"text",name:"href",label:"Link URL"},{type:"text",name:"class",label:"Classes"}]}:ie.includes(t)&&!i&&!l&&t!=="IMG"&&!e.find("*").some(m=>m.get("type")==="default"||m.get("tagName")==="DIV")?{title:"TYPOGRAPHY",styles:j.text,traits:[]}:i&&!a?{title:"BUTTON STYLE",styles:j.btnNav,traits:[{type:"text",name:"href",label:"Link URL"},{type:"select",name:"target",label:"Target",options:[{value:"",name:"Same Tab"},{value:"_blank",name:"New Tab"}]}]}:t==="IMG"&&!a?{title:"IMAGE STYLE",styles:j.img,traits:[{type:"text",name:"src",label:"Source"},{type:"text",name:"alt",label:"Alt Text"},{type:"button",label:"Assets",text:"Change Image",command:c=>c.runCommand("open-assets")}]}:l?{title:o?"FOOTER ICON":"ICON STYLE",styles:j.icon,traits:[{type:"text",name:"href",label:"Link URL"},{type:"text",name:"class",label:"Icon Class (fa-*)"}]}:{title:"ELEMENT SETTINGS",styles:["padding","margin","background-color","display"],traits:[{type:"text",name:"id",label:"ID"}]}},V=(e,n)=>{const t=e?.el;t instanceof HTMLElement&&n(t)};u.useEffect(()=>{E(!0);const e=re.init({container:"#gjs",height:"100%",width:"100%",storageManager:!1,allowScripts:1,assetManager:{autoAdd:!0,openAssetsOnDrop:!0},avoidInlineStyle:!0,forceClass:!1,selectable:!0,blockManager:{appendTo:"#second-side"},traitManager:{appendTo:"#trait-editor-container"},styleManager:{appendTo:"#style-manager-container",clearProperties:!0,sectors:[{name:"Typography",open:!1,buildProps:["font-family","font-size","font-weight","letter-spacing","color","line-height","text-align","text-decoration","text-transform"]},{name:"Decorations",open:!1,buildProps:["background-color","border-radius","border-top-left-radius","border-top-right-radius","border-bottom-left-radius","border-bottom-right-radius","box-shadow","background-image","opacity"]},{name:"Dimensions",open:!1,buildProps:["width","height","min-height","padding","margin","padding-top","padding-bottom","padding-left","padding-right"]},{name:"Borders",open:!1,buildProps:["border-width","border-style","border-color"]}]},panels:{defaults:[]},canvas:{styles:["/templates/css/style.css","/templates/css/plugins/bootstrap.min.css","/templates/css/font-awesome.min.css"],scripts:[],style:`
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
                `}});d.current=e,e.on("load",()=>{const t=e.Canvas.getDocument().head,s="mode-content-style";if(!t.querySelector(`#${s}`)){const a=document.createElement("style");a.id=s,a.innerHTML=`
                    .mode-content-active * { pointer-events: none !important; cursor: default !important; }
                    .mode-content-active [contenteditable="true"], .mode-content-active [data-gjs-type="text"] { 
                        pointer-events: auto !important; cursor: text !important; outline: 2px dashed #4cd137 !important; 
                    }
                `,t.appendChild(a)}fetch("/api/proposal/templates").then(a=>a.json()).then(a=>{const o=["All Blocks",...new Set(a.map(i=>i.category))];O(o),a.forEach((i,l)=>{e.BlockManager.add(`template-${l}`,{category:i.category||"Templates",media:`<img src="${i.preview}" style="width: 100%;" />`,content:{content:i.html,attributes:{"data-template-category":i.category,"data-gjs-section":"true"}}})})}),Promise.resolve().then(()=>{N?.html_output&&e.setComponents(N.html_output),N?.css_output&&e.setStyle(N.css_output)}).finally(()=>{E(!1),setTimeout(()=>L("elements"),300)})}),e.on("component:select:before",(t,s)=>{if(C.current!=="elements"||k(t))return;const a=K(t);a?(s.abort=!0,e.select(a)):s.abort=!0}),e.on("component:selected",t=>{if(!t)return;const s=C.current;if(s==="details"){const a=document.getElementById("style-editor-container"),o=document.getElementById("sidebar-title-text"),i=document.getElementById("trait-header");a&&(a.style.display="flex");const l=W(t);o&&(o.innerText=l.title),t.set("traits",l.traits||[]),i&&(i.style.display=l.traits.length?"block":"none"),e.StyleManager.getSectors().forEach(m=>{let f=!1;m.get("properties").forEach(y=>{const p=y.get("property"),h=l.styles.some(x=>x===p||x==="padding"&&p.startsWith("padding")||x==="margin"&&p.startsWith("margin")||x==="border"&&p.startsWith("border"));y.set("visible",h),h&&(f=!0)}),m.set({visible:f,open:f})})}if(s==="content"){if(V(t.getView(),o=>{t.get("editable")&&(o.setAttribute("contenteditable","true"),o.focus({preventScroll:!0}))}),!(t.is("image")||t.get("type")==="image"||t.get("tagName")==="IMG"))return;e.runCommand("core:open-assets",{target:t,select:!0})}}),e.on("component:deselected",()=>{const t=document.getElementById("style-editor-container");t&&(t.style.display="none")}),e.on("component:add",t=>{(t.getAttributes?.()||{})["data-template-category"]&&!t.get("initialContent")&&t.set({initialContent:t.toHTML(),initialStyle:e.getCss({component:t})})}),e.on("rte:enable",()=>{C.current==="details"&&e.stopCommand("rte:enable")}),e.on("component:dblclick",t=>{(t.is("image")||t.get("type")==="image"||t.get("tagName")==="IMG")&&e.runCommand("core:open-assets",{target:t,select:!0})}),e.Commands.add("custom-view-code",{run:t=>{const s=t.getSelected();if(s){const a=s.toHTML();t.CodeManager.getCode(s,"css"),z(`${a}`),$(!0)}}}),e.Commands.add("reset-section",{run(t){if(C.current!=="elements")return;const s=t.getSelected();if(!s)return;const a=s.get("initialContent"),o=s.get("initialStyle");if(!a){alert("Reset tidak tersedia untuk elemen ini");return}s.components(a),o&&t.CssComposer.add(o)}}),e.DomComponents.addType("image",{model:{defaults:{selectable:!0,hoverable:!0,draggable:!1,removable:!1,traits:["src"]}}});const n=()=>U(!0);return e.on("component:add",n),e.on("component:remove",n),e.on("component:update",n),e.on("style:property:update",n),()=>{d.current&&(d.current.destroy(),d.current=null)}},[]),u.useEffect(()=>{const e=n=>{v&&(n.preventDefault(),n.returnValue="")};return window.addEventListener("beforeunload",e),()=>window.removeEventListener("beforeunload",e)},[v]);const Y=(e,n)=>{if(!e||typeof e.get!="function"||e.__appliedMode===n)return;e.__appliedMode=n;let t={};if(n==="elements"){const s=k(e);t={selectable:s,draggable:s,removable:s,copyable:s,hoverable:s,editable:!1,highlightable:s,toolbar:s?[{attributes:{class:"fa fa-arrows",title:"Move"},command:"tlb-move"},{attributes:{class:"fa fa-code",title:"View Code"},command:"custom-view-code"},{attributes:{class:"fa fa-refresh",title:"Reset"},command:"reset-section"},{attributes:{class:"fa fa-trash",title:"Remove"},command:"tlb-delete"}]:[]}}n==="content"&&(t={draggable:!1,droppable:!1,removable:!1,copyable:!1,selectable:!0,hoverable:!0,editable:!0,toolbar:[]}),n==="details"&&(t={draggable:!1,droppable:!1,removable:!1,copyable:!1,selectable:!0,hoverable:!0,editable:!1,highlightable:!0,stylable:!0,toolbar:[]}),e.set(t)},L=e=>{F(e),C.current=e;const n=d.current;if(!n)return;X(d.current,e),n.select(null);const t=document.getElementById("style-editor-container");t&&(t.style.display="none");const s=n.getWrapper();if(s){e==="content"||e==="details"?s.set({selectable:!1,hoverable:!1,droppable:!1,draggable:!1}):s.set({droppable:!0,selectable:!1,draggable:!1});const a=i=>{Y(i,e);const l=i.get("components");l&&l.forEach(c=>a(c))},o=s.get("components");o&&o.forEach(i=>a(i))}if(e==="elements")try{n.runCommand("core:component-outline")}catch{}else try{n.stopCommand("core:component-outline")}catch{}n.refresh()},k=e=>!!(e.getAttributes?.()||{})["data-template-category"],K=e=>{let n=e;for(;n&&!k(n);)n=n.parent();return n},X=(e,n)=>{e.DomComponents.getWrapper().find("*").forEach(s=>{s.set({editable:!1,selectable:n!=="content",hoverable:!0},{silent:!0}),delete s.__appliedMode})},J=e=>{T(!0),H(e),setTimeout(()=>{if(!d.current)return;const n=d.current.BlockManager,t=n.getAll();e==="All Blocks"?n.render(t.models):n.render(t.filter(s=>{const a=s.get("category");return(a.id||a)===e}))},50)};function w(e,n){if(!e)return"";const t=new CSSStyleSheet;try{t.replaceSync(e)}catch{return e}let s="";const a=t.cssRules;for(let o=0;o<a.length;o++){const i=a[o];if(i instanceof CSSMediaRule){let l="";for(let c=0;c<i.cssRules.length;c++){const m=i.cssRules[c];M(m.selectorText,n)&&(l+=m.cssText+`
`)}l&&(s+=`@media ${i.conditionText} {
${l}}
`)}else i.selectorText?M(i.selectorText,n)&&(s+=i.cssText+`
`):s+=i.cssText+`
`}return s}function M(e,n){if(!e)return!1;const t=e.split(":")[0].split(",")[0].trim();if(!t)return!0;try{return n.querySelector(t)!==null}catch{return!0}}const Q=async()=>{if(!d.current)return;const e=d.current,n=e.getHtml(),s=new DOMParser().parseFromString(n,"text/html"),a=[...new Set([...s.querySelectorAll("[data-template-category]")].map(g=>g.dataset.templateCategory))],o=e.getConfig().canvas,i=async g=>{try{const P=await(await fetch(g)).text();return g.includes("font-awesome")?P:w(P,s)}catch{return console.error("Gagal mengambil CSS:",g),""}},l=o.styles.map(g=>i(g)),c=await Promise.all(l),m=w(e.getCss(),s),f=c.join(`
`)+`
`+m,p=e.Canvas.getFrameEl().contentDocument.body,h=await ae(p,{backgroundColor:"#ffffff",pixelRatio:2}),x=await new Promise(g=>{const S=new FileReader;S.onloadend=()=>g(S.result),S.readAsDataURL(h)}),b=new FormData;b.append("id",B),b.append("html",n),b.append("css",f),b.append("image",x),a.forEach(g=>b.append("categories[]",g));const R=await(await fetch("/proposal",{method:"POST",headers:{Accept:"application/json","X-CSRF-TOKEN":document.querySelector('meta[name="csrf-token"]').content},body:b})).json();R.success&&(alert("Simpan Berhasil!"),window.location.href=R.redirect)},Z=async()=>{if(!d.current)return;const e=d.current,n=e.getHtml(),s=new DOMParser().parseFromString(n,"text/html"),a=e.getConfig().canvas,o=async h=>{try{const b=await(await fetch(h)).text();return h.includes("font-awesome")?b:w(b,s)}catch{return""}},i=await Promise.all(a.styles.map(h=>o(h))),l=w(e.getCss(),s),m=`
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
                <style>${i.join(`
`)+`
`+l}</style>
            </head>
            <body>
                ${n}
                <script src="/templates/js/plugins/jquery.vide.min.js"><\/script>
                <script src="/templates/js/plugins/jquery1.11.2.min.js"><\/script>
                <script src="/templates/js/plugins/bootstrap.min.js"><\/script>
                <script src="/templates/js/plugins/jquery.easing.1.3.min.js"><\/script>
                <script src="/templates/js/plugins/jquery.countTo.js"><\/script>
                <script src="/templates/js/plugins/jquery.formchimp.min.js"><\/script>
                <script src="/templates/js/plugins/jquery.jCounter-0.1.4.js"><\/script>
                <script src="/templates/js/plugins/jquery.magnific-popup.min.js"><\/script>
                <script src="/templates/js/plugins/jquery.vide.min.js"><\/script>
                <script src="/templates/js/plugins/owl.carousel.min.js"><\/script>
                <script src="/templates/js/plugins/twitterFetcher_min.js"><\/script>
                <script src="/templates/js/plugins/wow.min.js"><\/script>
                <script src="/templates/js/custom.js"><\/script>
            </body>
            </html>
        `.trim(),f=new Blob([m],{type:"text/html;charset=utf-8"}),y=URL.createObjectURL(f),p=document.createElement("a");p.href=y,p.download="proposal.html",p.click(),URL.revokeObjectURL(y)},ee=async()=>{if(!d.current)return;const e=d.current,n=e.getHtml(),s=new DOMParser().parseFromString(n,"text/html"),a=e.getConfig().canvas,o=async f=>{try{const p=await(await fetch(f)).text();return f.includes("font-awesome")?p:w(p,s)}catch{return""}},i=await Promise.all(a.styles.map(f=>o(f))),l=w(e.getCss(),s),c=i.join(`
`)+`
`+l,m=window.open("","_blank");m.document.write(`
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
                <style>${c}</style>
            </head>
            <body>
                ${n}
                <script src="/templates/js/plugins/jquery.vide.min.js"><\/script>
                <script src="/templates/js/plugins/jquery1.11.2.min.js"><\/script>
                <script src="/templates/js/plugins/bootstrap.min.js"><\/script>
                <script src="/templates/js/plugins/jquery.easing.1.3.min.js"><\/script>
                <script src="/templates/js/plugins/jquery.countTo.js"><\/script>
                <script src="/templates/js/plugins/jquery.formchimp.min.js"><\/script>
                <script src="/templates/js/plugins/jquery.jCounter-0.1.4.js"><\/script>
                <script src="/templates/js/plugins/jquery.magnific-popup.min.js"><\/script>
                <script src="/templates/js/plugins/jquery.vide.min.js"><\/script>
                <script src="/templates/js/plugins/owl.carousel.min.js"><\/script>
                <script src="/templates/js/plugins/twitterFetcher_min.js"><\/script>
                <script src="/templates/js/plugins/wow.min.js"><\/script>
                <script src="/templates/js/custom.js"><\/script>
            </body>
            </html>
        `),m.document.close()},te=()=>{if(!d.current||!confirm("Are you sure you want to clear the page?"))return;const e=d.current;e.DomComponents.clear(),e.CssComposer.clear(),e.select(null)},se=()=>{v&&!window.confirm(`Perubahan belum disimpan.
Apakah Anda yakin ingin kembali?`)||window.history.back()};return r.jsxs("div",{className:`builder-body ${q?"sidebar-expanded":"sidebar-collapsed"}`,children:[r.jsxs("div",{className:"menu-left",onMouseEnter:()=>I(!0),onMouseLeave:()=>{I(!1),T(!1)},style:{zIndex:1e3},children:[r.jsx("div",{className:"icon-trigger-area",children:r.jsx("i",{className:"fa fa-th-large fa-lg"})}),r.jsxs("div",{className:"main-nav",children:[r.jsxs("h3",{children:[r.jsx("i",{className:"fa fa-th-large"})," BLOCKS"]}),r.jsx("ul",{className:"elements-list",children:D.map(e=>r.jsx("li",{className:_===e?"active":"",children:r.jsx("a",{href:"#",onClick:n=>{n.preventDefault(),J(e)},children:e})},e))})]}),r.jsx("div",{className:`second-side ${G?"show":""}`,id:"second-side",children:r.jsxs("div",{className:"second-side-header",onClick:()=>T(!1),children:[r.jsx("i",{className:"fa fa-chevron-left"})," HIDE"]})})]}),r.jsxs("div",{className:"container-main",children:[r.jsxs("header",{className:"builder-header",children:[r.jsx(ne,{title:"Create Proposal"}),r.jsxs("div",{className:"modes",children:[r.jsx("span",{className:"mode-label",children:"BUILDING MODE:"}),["elements","content","details"].map(e=>r.jsxs("label",{children:[r.jsx("input",{type:"radio",checked:A===e,onChange:()=>L(e),style:{marginRight:"2px",marginBottom:"2px"}}),e]}))]}),r.jsxs("div",{className:"flex items-center gap-2",children:[r.jsx("button",{onClick:se,className:`
                                inline-flex items-center gap-2
                                rounded-md bg-zinc-200 px-3 py-2
                                text-sm font-medium text-zinc-800
                                hover:bg-zinc-300 transition
                            `,children:"Back"}),r.jsx("button",{onClick:Q,disabled:!v,className:`
                                inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium
                                transition
                                ${v?"bg-emerald-600 text-white hover:bg-emerald-700":"cursor-not-allowed bg-emerald-200 text-emerald-700"}
                            `,children:v?"Save":"Nothing new to save"}),r.jsx("button",{onClick:Z,className:"inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 transition",children:"Export"}),r.jsx("button",{onClick:ee,className:"inline-flex items-center rounded-md bg-zinc-800 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-900 transition",children:"Preview"}),r.jsx("button",{onClick:te,className:"inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 transition",children:"Empty Page"})]})]}),r.jsxs("div",{id:"style-editor-container",className:`style-sidebar-left ${A==="details"?"open":""}`,children:[r.jsxs("div",{className:"sidebar-header-custom",children:[r.jsx("span",{id:"sidebar-title-text",children:r.jsx("h3",{children:"SETTINGS"})}),r.jsx("button",{onClick:()=>document.getElementById("style-editor-container").classList.remove("open"),children:r.jsx("i",{className:"fa fa-times"})})]}),r.jsx("div",{id:"trait-editor-container",className:"sidebar-section"}),r.jsx("div",{id:"style-manager-container",className:"sidebar-section"})]}),r.jsx("div",{className:"screen-area",children:r.jsxs("div",{className:"screen",id:"screen",children:[r.jsxs("div",{className:"toolbar",children:[r.jsxs("div",{className:"buttons clearfix",children:[r.jsx("span",{className:"left red"}),r.jsx("span",{className:"left yellow"}),r.jsx("span",{className:"left green"})]}),r.jsx("div",{className:"title",children:r.jsxs("span",{children:[name,".html"]})})]}),r.jsxs("div",{id:"frameWrapper",className:"frameWrapper empty",children:[r.jsx("div",{id:"gjs",style:{position:"relative",zIndex:10}}),r.jsx("div",{className:"start",id:"start",children:r.jsx("span",{children:"Build your page by dragging elements onto the canvas"})})]})]})})]})]})}export{ue as default};
