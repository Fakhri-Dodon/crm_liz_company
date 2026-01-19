import{r as u,j as t,H as Q}from"./app-Dyd-VK-i.js";import{_ as Z,t as ee}from"./index-pf_C4K8r.js";const te=["H1","H2","H3","H4","H5","H6","P","SPAN","LI","LABEL","DIV","STRONG","B","EM","I","SMALL"],x={text:["color","font-size","background-color","font-family","font-weight","text-align","line-height","letter-spacing"],linkNav:["font-weight","font-size","text-transform","color"],btnNav:["font-weight","font-size","background-color","color","border-radius"],img:["border-top-left-radius","border-top-right-radius","border-bottom-left-radius","border-bottom-right-radius","border-color","border-style","border-width","width","height"],icon:["color","font-size"]};function le({id:M,template:v}){const f=u.useRef(null),S=u.useRef("elements"),[D,O]=u.useState([]),[q,U]=u.useState("All Blocks"),[H,E]=u.useState(!1),[G,T]=u.useState(!1),[w,_]=u.useState(!1),[se,I]=u.useState(!1),[k,F]=u.useState("elements"),[re,$]=u.useState(!1),[ae,z]=u.useState(""),V=e=>{const r=e.getEl();if(!r)return{title:"Settings",styles:[],traits:[]};const a=e.get("tagName")?.toUpperCase(),o=e.getClasses(),s=r.closest("nav")!==null||r.closest(".navbar")!==null,l=r.closest("footer")!==null,n=o.includes("btn")||o.includes("btn-nav")||a==="BUTTON",i=a==="I"||o.some(c=>c.startsWith("fa")||c.startsWith("icon-"));return a==="IMG"&&s?{title:"NAVIGATION IMAGE",styles:x.img,traits:[{type:"text",name:"src",label:"Image Source"},{type:"text",name:"href",label:"Link URL"},{type:"button",label:"Assets",text:"Change Image",command:c=>c.runCommand("open-assets")}]}:a==="A"&&!n&&s?{title:"NAVIGATION LINK",styles:x.linkNav,traits:[{type:"text",name:"href",label:"Link URL"},{type:"select",name:"target",label:"Target",options:[{value:"",name:"Same Tab"},{value:"_blank",name:"New Tab"}]}]}:(a==="A"||a==="BUTTON")&&n&&s?{title:"NAVIGATION BUTTON",styles:x.btnNav,traits:[{type:"text",name:"href",label:"Link URL"},{type:"text",name:"class",label:"Classes"}]}:te.includes(a)&&!n&&!i&&a!=="IMG"&&!e.find("*").some(p=>p.get("type")==="default"||p.get("tagName")==="DIV")?{title:"TYPOGRAPHY",styles:x.text,traits:[]}:n&&!s?{title:"BUTTON STYLE",styles:x.btnNav,traits:[{type:"text",name:"href",label:"Link URL"},{type:"select",name:"target",label:"Target",options:[{value:"",name:"Same Tab"},{value:"_blank",name:"New Tab"}]}]}:a==="IMG"&&!s?{title:"IMAGE STYLE",styles:x.img,traits:[{type:"text",name:"src",label:"Source"},{type:"text",name:"alt",label:"Alt Text"},{type:"button",label:"Assets",text:"Change Image",command:c=>c.runCommand("open-assets")}]}:i?{title:l?"FOOTER ICON":"ICON STYLE",styles:x.icon,traits:[{type:"text",name:"href",label:"Link URL"},{type:"text",name:"class",label:"Icon Class (fa-*)"}]}:{title:"ELEMENT SETTINGS",styles:["padding","margin","background-color","display"],traits:[{type:"text",name:"id",label:"ID"}]}};u.useEffect(()=>{I(!0);const e=Z.init({container:"#gjs",height:"100%",width:"100%",storageManager:!1,allowScripts:1,avoidInlineStyle:!0,forceClass:!1,selectable:!0,blockManager:{appendTo:"#second-side"},traitManager:{appendTo:"#trait-editor-container"},styleManager:{appendTo:"#style-manager-container",clearProperties:!0,sectors:[{name:"Typography",open:!1,buildProps:["font-family","font-size","font-weight","letter-spacing","color","line-height","text-align","text-decoration","text-transform"]},{name:"Decorations",open:!1,buildProps:["background-color","border-radius","border-top-left-radius","border-top-right-radius","border-bottom-left-radius","border-bottom-right-radius","box-shadow","background-image","opacity"]},{name:"Dimensions",open:!1,buildProps:["width","height","min-height","padding","margin","padding-top","padding-bottom","padding-left","padding-right"]},{name:"Borders",open:!1,buildProps:["border-width","border-style","border-color"]}]},panels:{defaults:[]},canvas:{styles:["/templates/css/style.css","/templates/css/plugins/bootstrap.min.css","/templates/css/font-awesome.min.css"],scripts:[],style:`
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
                `}});e.DomComponents.addType("image",{model:{defaults:{traits:[]}}}),f.current=e,e.on("load",()=>{const a=e.Canvas.getDocument().head,o="mode-content-style";if(!a.querySelector(`#${o}`)){const s=document.createElement("style");s.id=o,s.innerHTML=`
                    .mode-content-active * { pointer-events: none !important; cursor: default !important; }
                    .mode-content-active [contenteditable="true"], .mode-content-active [data-gjs-type="text"] { 
                        pointer-events: auto !important; cursor: text !important; outline: 2px dashed #4cd137 !important; 
                    }
                `,a.appendChild(s)}e.Commands.add("custom-view-code",{run:s=>{const l=s.getSelected();if(l){const n=l.toHTML();s.CodeManager.getCode(l,"css"),z(`${n}`),$(!0)}}}),fetch("/api/proposal/templates").then(s=>s.json()).then(s=>{const l=s.map(i=>i.category||"Templates"),n=["All Blocks",...new Set(l)];O(n),s.forEach((i,c)=>{e.BlockManager.add(`template-${c}`,{category:i.category||"Templates",media:`<img src="${i.preview}" style="width: 100%;" />`,content:{content:`<input type="hidden" data-template-category="${i.category||"Templates"}">${i.html}`,style:i.css}})})}).finally(()=>I(!1)),v&&(v.html_output&&e.setComponents(v.html_output),v.css_output&&e.setStyle(v.css_output)),setTimeout(()=>L("elements"),500)}),e.on("component:selected",a=>{if(!a)return;const o=S.current;if(o==="details"){const s=document.getElementById("style-editor-container"),l=document.getElementById("sidebar-title-text"),n=document.getElementById("trait-header");s&&(s.style.display="flex");const i=V(a);l&&(l.innerText=i.title),a.set("traits",i.traits),n&&(n.style.display=i.traits.length>0?"block":"none"),e.StyleManager.getSectors().forEach(g=>{let y=!1;g.get("properties").forEach(b=>{const m=b.get("property"),C=i.styles.some(d=>!!(d===m||d==="padding"&&m.startsWith("padding")||d==="margin"&&m.startsWith("margin")||d==="border-width"&&m==="border-width"||d==="border-style"&&m==="border-style"||d==="border-color"&&m==="border-color"));b.set("visible",C),C&&(y=!0)}),g.set("visible",y),g.set("open",y)})}else if(o==="content"){const s=a.getView();s?.el&&a.get("editable")&&(s.el.setAttribute("contenteditable","true"),s.el.focus())}r()}),e.on("component:deselected",()=>{r();const a=document.getElementById("style-editor-container");a&&(a.style.display="none")}),e.on("component:add",a=>{r(),setTimeout(()=>A(a,S.current),50)});const r=()=>_(!0);return()=>e.destroy()},[]),u.useEffect(()=>{const e=r=>{w&&(r.preventDefault(),r.returnValue="")};return window.addEventListener("beforeunload",e),()=>window.removeEventListener("beforeunload",e)},[w]);const W=async()=>{if(!f.current)return;const e=f.current,r=e.getHtml(),o=new DOMParser().parseFromString(r,"text/html"),s=[...new Set([...o.querySelectorAll("[data-template-category]")].map(h=>h.dataset.templateCategory))],l=e.getConfig().canvas,n=async h=>{try{const R=await(await fetch(h)).text();return h.includes("font-awesome")?R:j(R,o)}catch{return console.error("Gagal mengambil CSS:",h),""}},i=l.styles.map(h=>n(h)),c=await Promise.all(i),p=j(e.getCss(),o),g=c.join(`
`)+`
`+p,b=e.Canvas.getFrameEl().contentDocument.body,m=await ee(b,{backgroundColor:"#ffffff",pixelRatio:2}),C=await new Promise(h=>{const N=new FileReader;N.onloadend=()=>h(N.result),N.readAsDataURL(m)}),d=new FormData;d.append("id",M),d.append("html",r),d.append("css",g),d.append("image",C),s.forEach(h=>d.append("categories[]",h));const B=await(await fetch("/proposal",{method:"POST",headers:{Accept:"application/json","X-CSRF-TOKEN":document.querySelector('meta[name="csrf-token"]').content},body:d})).json();B.success&&(alert("Simpan Berhasil!"),window.location.href=B.redirect)},A=(e,r)=>{if(!e||typeof e.get!="function")return;const a=e.get("type"),o=a==="wrapper",s=e.parent(),l=s&&s.get("type")==="wrapper"||!s&&!o,n=e.getView();n?.el&&typeof n.el.removeAttribute=="function"&&n.el.removeAttribute("contenteditable");let i={};r==="elements"?o?i={selectable:!1,draggable:!1,droppable:!0,hoverable:!1}:l?i={draggable:!0,droppable:!0,selectable:!0,removable:!0,hoverable:!0,highlightable:!0,editable:!1,badgable:!0,toolbar:[{attributes:{class:"fa fa-arrows",title:"Drag Element"},command:"tlb-move"},{attributes:{class:"fa fa-code",title:"View Source"},command:"custom-view-code"},{attributes:{class:"fa fa-undo",title:"Reset"},command:p=>p.runCommand("core:undo")},{attributes:{class:"fa fa-trash",title:"Remove"},command:"tlb-delete"}]}:i={draggable:!1,droppable:!1,selectable:!0,removable:!1,hoverable:!0,editable:!1,toolbar:[]}:r==="content"?(n?.el&&typeof n.el.setAttribute=="function"&&(e.is("text")||a==="text")&&n.el.setAttribute("contenteditable","true"),i={draggable:!1,droppable:!1,removable:!1,copyable:!1,selectable:!0,hoverable:!0,editable:!0,toolbar:[]},a==="image"&&(i.editable=!0)):r==="details"&&(i={draggable:!1,droppable:!1,removable:!1,copyable:!1,selectable:!0,hoverable:!0,editable:!1,highlightable:!0,toolbar:[],stylable:!0}),e.set(i)},L=e=>{F(e),S.current=e;const r=f.current;if(!r)return;r.select(null);const a=document.getElementById("style-editor-container");a&&(a.style.display="none");const o=r.getWrapper();if(o){e==="content"||e==="details"?o.set({selectable:!1,hoverable:!1,droppable:!1,draggable:!1}):o.set({droppable:!0,selectable:!1,draggable:!1});const s=n=>{A(n,e);const i=n.get("components");i&&i.forEach(c=>s(c))},l=o.get("components");l&&l.forEach(n=>s(n))}if(e==="elements")try{r.runCommand("core:component-outline")}catch{}else try{r.stopCommand("core:component-outline")}catch{}r.refresh()},Y=e=>{T(!0),U(e),setTimeout(()=>{if(!f.current)return;const r=f.current.BlockManager,a=r.getAll();e==="All Blocks"?r.render(a.models):r.render(a.filter(o=>{const s=o.get("category");return(s.id||s)===e}))},50)};function j(e,r){if(!e)return"";const a=new CSSStyleSheet;try{a.replaceSync(e)}catch{return e}let o="";const s=a.cssRules;for(let l=0;l<s.length;l++){const n=s[l];if(n instanceof CSSMediaRule){let i="";for(let c=0;c<n.cssRules.length;c++){const p=n.cssRules[c];P(p.selectorText,r)&&(i+=p.cssText+`
`)}i&&(o+=`@media ${n.conditionText} {
${i}}
`)}else n.selectorText?P(n.selectorText,r)&&(o+=n.cssText+`
`):o+=n.cssText+`
`}return o}function P(e,r){if(!e)return!1;const a=e.split(":")[0].split(",")[0].trim();if(!a)return!0;try{return r.querySelector(a)!==null}catch{return!0}}const K=async()=>{if(!f.current)return;const e=f.current,r=e.getHtml(),o=new DOMParser().parseFromString(r,"text/html"),s=e.getConfig().canvas,l=async m=>{try{const d=await(await fetch(m)).text();return m.includes("font-awesome")?d:j(d,o)}catch{return""}},n=await Promise.all(s.styles.map(m=>l(m))),i=j(e.getCss(),o),p=`
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
                <style>${n.join(`
`)+`
`+i}</style>
            </head>
            <body>
                ${r}
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
        `.trim(),g=new Blob([p],{type:"text/html;charset=utf-8"}),y=URL.createObjectURL(g),b=document.createElement("a");b.href=y,b.download="proposal.html",b.click(),URL.revokeObjectURL(y)},X=async()=>{if(!f.current)return;const e=f.current,r=e.getHtml(),o=new DOMParser().parseFromString(r,"text/html"),s=e.getConfig().canvas,l=async g=>{try{const b=await(await fetch(g)).text();return g.includes("font-awesome")?b:j(b,o)}catch{return""}},n=await Promise.all(s.styles.map(g=>l(g))),i=j(e.getCss(),o),c=n.join(`
`)+`
`+i,p=window.open("","_blank");p.document.write(`
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
                ${r}
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
        `),p.document.close()},J=()=>{if(!f.current||!confirm("Are you sure you want to clear the page?"))return;const e=f.current;e.DomComponents.clear(),e.CssComposer.clear(),e.select(null)};return t.jsxs("div",{className:`builder-body ${H?"sidebar-expanded":"sidebar-collapsed"}`,children:[t.jsxs("div",{className:"menu-left",onMouseEnter:()=>E(!0),onMouseLeave:()=>{E(!1),T(!1)},style:{zIndex:1e3},children:[t.jsx("div",{className:"icon-trigger-area",children:t.jsx("i",{className:"fa fa-th-large fa-lg"})}),t.jsxs("div",{className:"main-nav",children:[t.jsxs("h3",{children:[t.jsx("i",{className:"fa fa-th-large"})," BLOCKS"]}),t.jsx("ul",{className:"elements-list",children:D.map(e=>t.jsx("li",{className:q===e?"active":"",children:t.jsx("a",{href:"#",onClick:r=>{r.preventDefault(),Y(e)},children:e})},e))})]}),t.jsx("div",{className:`second-side ${G?"show":""}`,id:"second-side",children:t.jsxs("div",{className:"second-side-header",onClick:()=>T(!1),children:[t.jsx("i",{className:"fa fa-chevron-left"})," HIDE"]})})]}),t.jsxs("div",{className:"container-main",children:[t.jsxs("header",{className:"builder-header",children:[t.jsx(Q,{title:"Create Proposal"}),t.jsxs("div",{className:"modes",children:[t.jsx("span",{className:"mode-label",children:"BUILDING MODE:"}),["elements","content","details"].map(e=>t.jsxs("label",{children:[t.jsx("input",{type:"radio",checked:k===e,onChange:()=>L(e),style:{marginRight:"2px",marginBottom:"2px"}}),e]}))]}),t.jsxs("div",{className:"flex items-center gap-2",children:[t.jsxs("button",{onClick:W,disabled:!w,className:`
                                inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium
                                transition
                                ${w?"bg-emerald-600 text-white hover:bg-emerald-700":"cursor-not-allowed bg-emerald-200 text-emerald-700"}
                            `,children:["✓ ",w?"Save Page":"Nothing new to save"]}),t.jsx("button",{onClick:K,className:"inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 transition",children:"Export"}),t.jsx("button",{onClick:X,className:"inline-flex items-center rounded-md bg-zinc-800 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-900 transition",children:"Preview"}),t.jsx("button",{onClick:J,className:"inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 transition",children:"Empty Page"})]})]}),t.jsxs("div",{id:"style-editor-container",className:`style-sidebar-left ${k==="details"?"open":""}`,children:[t.jsxs("div",{className:"sidebar-header-custom",children:[t.jsx("span",{id:"sidebar-title-text",children:t.jsx("h3",{children:"SETTINGS"})}),t.jsx("button",{onClick:()=>document.getElementById("style-editor-container").classList.remove("open"),children:t.jsx("i",{className:"fa fa-times"})})]}),t.jsx("div",{id:"trait-editor-container",className:"sidebar-section"}),t.jsx("div",{id:"style-manager-container",className:"sidebar-section"})]}),t.jsx("div",{className:"screen-area",children:t.jsxs("div",{className:"screen",id:"screen",children:[t.jsxs("div",{className:"toolbar",children:[t.jsxs("div",{className:"buttons clearfix",children:[t.jsx("span",{className:"left red"}),t.jsx("span",{className:"left yellow"}),t.jsx("span",{className:"left green"})]}),t.jsx("div",{className:"title",children:t.jsxs("span",{children:[name,".html"]})})]}),t.jsxs("div",{id:"frameWrapper",className:"frameWrapper empty",children:[t.jsx("div",{id:"gjs",style:{position:"relative",zIndex:10}}),t.jsx("div",{className:"start",id:"start",children:t.jsx("span",{children:"Build your page by dragging elements onto the canvas"})})]})]})})]})]})}export{le as default};
