import{r as b,j as t,H as Z}from"./app-Dyd-VK-i.js";import{_ as ee,t as te}from"./index-pf_C4K8r.js";const D=["H1","H2","H3","H4","H5","H6","P","SPAN","LI","LABEL","DIV","STRONG","B","EM","I","SMALL"],x={text:["color","font-size","background-color","font-family","font-weight"],btn:["font-weight","font-size","background-color","color"],link:["font-weight","font-size","text-transform","color","text-decoration"],img:["border-top-left-radius","border-top-right-radius","border-bottom-left-radius","border-bottom-right-radius","border-color","border-style","border-width"],icon:["color","font-size"]};function re({id:H,name:k,template:j}){const f=b.useRef(null),T=b.useRef("elements"),[U,q]=b.useState([]),[_,O]=b.useState("All Blocks"),[F,I]=b.useState(!1),[$,N]=b.useState(!1),[w,z]=b.useState(!1),[se,L]=b.useState(!1),[B,G]=b.useState("elements"),V=e=>{const a=e.getEl();if(!a)return{styles:[],traits:[]};const r=e.get("tagName")?.toUpperCase(),s=e.getClasses();e.get("type");const o=a.closest("nav")!==null||a.closest(".navbar")!==null,c=a.closest("footer")!==null,n=s.includes("btn")||s.includes("btn-nav"),i=r==="I"||s.some(d=>d.startsWith("fa-")||d==="fa");return r==="IMG"&&o?{title:"Image Navigation",styles:x.img,traits:[{type:"text",name:"src",label:"Image Source"},{type:"text",name:"href",label:"Link URL"},{type:"select",name:"target",label:"Target",options:[{value:"",name:"Same Tab"},{value:"_blank",name:"New Tab"}]}]}:r==="A"&&!n&&o?{title:"Nav Link",styles:x.link,traits:[{type:"text",name:"href",label:"Link URL"},{type:"text",name:"content",label:"Text"}]}:r==="A"&&n&&o?{title:"Nav Button",styles:x.btn,traits:[{type:"text",name:"href",label:"Link URL"},{type:"text",name:"class",label:"Classes"}]}:["H1","H2","H3","H4","H5","H6","P","SPAN","STRONG","B","EM","SMALL","DIV","LI"].includes(r)&&!n&&!i&&!e.find("*").some(p=>p.get("type")==="default"||p.get("tagName")==="DIV")?{title:"Typography",styles:x.text,traits:[]}:n&&!o?{title:"Button Component",styles:x.btn,traits:[{type:"text",name:"href",label:"Link URL"},{type:"select",name:"target",label:"Target",options:[{value:"",name:"Same Tab"},{value:"_blank",name:"New Tab"}]}]}:r==="IMG"&&!o?{title:"Image Component",styles:x.img,traits:[{type:"text",name:"src",label:"Image Source"},{type:"text",name:"alt",label:"Alt Text"}]}:i?{title:c?"Footer Icon":"Icon Component",styles:x.icon,traits:[{type:"text",name:"href",label:"Link URL"},{type:"text",name:"class",label:"Icon Class (fa fa-xxx)"}]}:{title:"Element Settings",styles:["padding","margin","background-color","height"],traits:[]}};b.useEffect(()=>{L(!0);const e=ee.init({container:"#gjs",height:"100%",width:"100%",storageManager:!1,allowScripts:1,avoidInlineStyle:!0,forceClass:!1,selectable:!0,blockManager:{appendTo:"#second-side"},traitManager:{appendTo:"#trait-editor-container"},styleManager:{appendTo:"#style-manager-container",clearProperties:!0,sectors:[{name:"Typography",open:!1,buildProps:["font-family","font-size","font-weight","color","text-align","text-transform","line-height","letter-spacing"]},{name:"Decorations",open:!1,buildProps:["background-color","border-radius","border-top-left-radius","border-top-right-radius","border-bottom-left-radius","border-bottom-right-radius","box-shadow","background-image"]},{name:"Dimensions",open:!1,buildProps:["width","height","min-height","padding","margin","padding-top","padding-bottom","padding-left","padding-right"]},{name:"Borders",open:!1,buildProps:["border-width","border-style","border-color"]}]},panels:{defaults:[]},canvas:{styles:["/templates/css/style.css","/templates/css/plugins/bootstrap.min.css","/templates/css/font-awesome.min.css"]}});e.DomComponents.getType("default").model,e.DomComponents.addType("image",{model:{defaults:{traits:[]}}}),f.current=e,e.on("load",()=>{const s=e.Canvas.getBody();if(!s.querySelector(".el-toolbar")){const n=document.createElement("div");n.className="el-toolbar",n.style.display="none",n.innerHTML=`
                    <button class="el-btn source"><i class="fa fa-code"></i></button>
                    <button class="el-btn reset"><i class="fa fa-refresh"></i></button>
                    <button class="el-btn remove"><i class="fa fa-trash"></i></button>
                `,s.appendChild(n)}const o=e.Canvas.getDocument().head,c="mode-content-style";if(!o.querySelector(`#${c}`)){const n=document.createElement("style");n.id=c,n.innerHTML=`
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
                `,o.appendChild(n)}e.addStyle(`
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
            `),fetch("/api/proposal/templates").then(n=>n.json()).then(n=>{const i=["All Blocks",...new Set(n.map(l=>l.category))];q(i),n.forEach((l,d)=>{e.BlockManager.add(`template-${d}`,{category:l.category||"Templates",media:`<img src="${l.preview}" style="width: 100%;" />`,content:{content:`<input type="hidden" data-template-category="${l.category||"Templates"}">${l.html}`,attributes:{"data-gjs-section":"true","data-section-type":l.category}}})})}).finally(()=>L(!1)),j&&(j.html_output&&e.setComponents(j.html_output),j.css_output&&e.setStyle(j.css_output)),setTimeout(()=>R("elements"),500)}),e.on("component:dblclick",s=>{if(T.current!=="content")return;const o=s.get("tagName")?.toUpperCase();(D.includes(o)||s.get("type")==="text")&&(e.Modal.setTitle("Edit Content"),e.Modal.setContent(`
                <textarea id="content-editor"
                    style="width:100%;height:200px;">
                    ${s.view.el.innerText}
                </textarea>
                <button id="save-content">Save</button>
            `),e.Modal.open(),setTimeout(()=>{document.getElementById("save-content").onclick=()=>{const n=document.getElementById("content-editor").value;s.components(n),e.Modal.close()}},0))}),e.on("component:selected",s=>{if(!s)return;if(T.current==="details"){const c=document.getElementById("style-editor-container"),n=document.getElementById("sidebar-title-text");c&&c.classList.add("open");const i=V(s);n&&(n.innerText=i.title),s.set("traits",i.traits),e.StyleManager.getSectors().forEach(p=>{let y=!1;p.get("properties").forEach(g=>{const h=g.get("property"),C=i.styles.some(u=>!!(u===h||u==="padding"&&h.startsWith("padding")||u==="margin"&&h.startsWith("margin")));g.set("visible",C),C&&(y=!0)}),p.set("visible",y),p.set("open",y)})}}),e.on("component:deselected",()=>{const s=document.getElementById("style-editor-container");s&&s.classList.remove("open"),r()}),e.on("component:add",s=>{setTimeout(()=>P(s,T.current),50),r()});const r=()=>z(!0);return e.on("component:remove",r),e.on("component:update",r),e.on("style:property:update",r),e.on("component:styleUpdate",r),e.on("trait:value:update",r),()=>e.destroy()},[]),b.useEffect(()=>{const e=a=>{w&&(a.preventDefault(),a.returnValue="")};return window.addEventListener("beforeunload",e),()=>window.removeEventListener("beforeunload",e)},[w]);const W=async()=>{if(!f.current)return;const e=f.current,a=e.getHtml(),s=new DOMParser().parseFromString(a,"text/html"),o=[...new Set([...s.querySelectorAll("[data-template-category]")].map(m=>m.dataset.templateCategory))],c=e.getConfig().canvas,n=async m=>{try{const A=await(await fetch(m)).text();return m.includes("font-awesome")?A:v(A,s)}catch{return console.error("Gagal mengambil CSS:",m),""}},i=c.styles.map(m=>n(m)),l=await Promise.all(i),d=v(e.getCss(),s),p=l.join(`
`)+`
`+d,g=e.Canvas.getFrameEl().contentDocument.body,h=await te(g,{backgroundColor:"#ffffff",pixelRatio:2}),C=await new Promise(m=>{const S=new FileReader;S.onloadend=()=>m(S.result),S.readAsDataURL(h)}),u=new FormData;u.append("name",k),u.append("html",a),u.append("css",p),u.append("image",C),u.append("_method","PUT"),o.forEach(m=>u.append("categories[]",m));const E=await fetch(`/setting/proposal-element/${H}`,{method:"POST",headers:{Accept:"application/json","X-CSRF-TOKEN":document.querySelector('meta[name="csrf-token"]')?.content},body:u});if(E.ok){const m=await E.json();alert("Simpan Berhasil!"),window.location.href=m.redirect}else{const m=await E.json();console.error("Gagal menyimpan:",m)}},P=(e,a)=>{if(!e||typeof e.get!="function")return;const r=e.get("tagName")?.toUpperCase(),s=e.get("type"),o=D.includes(r)||s==="text"||s==="textnode",c=(()=>{if(typeof e.find!="function")return!1;try{return e.find("*").some(d=>{const p=d.get("tagName")?.toUpperCase();return d.get("type")==="default"||p==="DIV"||p==="SECTION"})}catch{return!1}})(),n=o&&!c;let i={};const l=e.getView();l?.el&&typeof l.el.removeAttribute=="function"&&l.el.removeAttribute("contenteditable"),a==="elements"?X(e)?i={selectable:!0,hoverable:!0,draggable:!0,droppable:!1,removable:!0,highlightable:!0,editable:!1}:i={selectable:!1,hoverable:!1,draggable:!1,droppable:!1,removable:!1,highlightable:!1,editable:!1}:a==="content"?n||r==="IMG"||r==="A"?i={selectable:!0,hoverable:!0,editable:!0,draggable:!1,droppable:!1}:i={selectable:!1,hoverable:!1,editable:!1,draggable:!1,droppable:!1}:a==="details"&&(i={draggable:!1,droppable:!1,removable:!1,copyable:!1,selectable:!0,hoverable:!0,editable:!1,highlightable:!0,toolbar:[],stylable:!0}),e.set(i)},X=e=>e.getAttributes()?.["data-gjs-section"]==="true"||["HEADER","SECTION","FOOTER"].includes(e.get("tagName")?.toUpperCase()),R=e=>{G(e),T.current=e;const a=f.current;if(!a)return;const r=document.getElementById("style-editor-container");r&&r.classList.remove("open"),a.select(null);const s=a.Canvas.getBody();s&&(e==="content"?(s.classList.add("mode-content-active"),a.stopCommand("core:component-outline")):(s.classList.remove("mode-content-active"),e==="elements"&&a.runCommand("core:component-outline")));const o=a.getWrapper();if(o){e==="content"||e==="details"?o.set({selectable:!1,hoverable:!1,droppable:!1,draggable:!1}):o.set({droppable:!0,selectable:!1,draggable:!1});const c=i=>{P(i,e);const l=i.get("components");l&&l.forEach(d=>c(d))},n=o.get("components");n&&n.forEach(i=>c(i))}e==="details"&&(a.runCommand("core:component-select"),a.runCommand("core:component-hover")),a.refresh()},Y=e=>{N(!0),O(e),setTimeout(()=>{if(!f.current)return;const a=f.current.BlockManager,r=a.getAll();e==="All Blocks"?a.render(r.models):a.render(r.filter(s=>{const o=s.get("category");return(o.id||o)===e}))},50)};function v(e,a){if(!e)return"";const r=new CSSStyleSheet;try{r.replaceSync(e)}catch{return e}let s="";const o=r.cssRules;for(let c=0;c<o.length;c++){const n=o[c];if(n instanceof CSSMediaRule){let i="";for(let l=0;l<n.cssRules.length;l++){const d=n.cssRules[l];M(d.selectorText,a)&&(i+=d.cssText+`
`)}i&&(s+=`@media ${n.conditionText} {
${i}}
`)}else n.selectorText?M(n.selectorText,a)&&(s+=n.cssText+`
`):s+=n.cssText+`
`}return s}function M(e,a){if(!e)return!1;const r=e.split(":")[0].split(",")[0].trim();if(!r)return!0;try{return a.querySelector(r)!==null}catch{return!0}}const K=async()=>{if(!f.current)return;const e=f.current,a=e.getHtml(),s=new DOMParser().parseFromString(a,"text/html"),o=e.getConfig().canvas,c=async h=>{try{const u=await(await fetch(h)).text();return h.includes("font-awesome")?u:v(u,s)}catch{return""}},n=await Promise.all(o.styles.map(h=>c(h))),i=v(e.getCss(),s),d=`
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
                ${a}
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
        `.trim(),p=new Blob([d],{type:"text/html;charset=utf-8"}),y=URL.createObjectURL(p),g=document.createElement("a");g.href=y,g.download="proposal.html",g.click(),URL.revokeObjectURL(y)},J=async()=>{if(!f.current)return;const e=f.current,a=e.getHtml(),s=new DOMParser().parseFromString(a,"text/html"),o=e.getConfig().canvas,c=async p=>{try{const g=await(await fetch(p)).text();return p.includes("font-awesome")?g:v(g,s)}catch{return""}},n=await Promise.all(o.styles.map(p=>c(p))),i=v(e.getCss(),s),l=n.join(`
`)+`
`+i,d=window.open("","_blank");d.document.write(`
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
                <style>${l}</style>
            </head>
            <body>
                ${a}
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
        `),d.document.close()},Q=()=>{if(!f.current||!confirm("Are you sure you want to clear the page?"))return;const e=f.current;e.DomComponents.clear(),e.CssComposer.clear(),e.select(null)};return t.jsxs("div",{className:`builder-body ${F?"sidebar-expanded":"sidebar-collapsed"}`,children:[t.jsxs("div",{className:"menu-left",onMouseEnter:()=>I(!0),onMouseLeave:()=>{I(!1),N(!1)},style:{zIndex:1e3},children:[t.jsx("div",{className:"icon-trigger-area",children:t.jsx("i",{className:"fa fa-th-large fa-lg"})}),t.jsxs("div",{className:"main-nav",children:[t.jsxs("h3",{children:[t.jsx("i",{className:"fa fa-th-large"})," BLOCKS"]}),t.jsx("ul",{className:"elements-list",children:U.map(e=>t.jsx("li",{className:_===e?"active":"",children:t.jsx("a",{href:"#",onClick:a=>{a.preventDefault(),Y(e)},children:e})},e))})]}),t.jsx("div",{className:`second-side ${$?"show":""}`,id:"second-side",children:t.jsxs("div",{className:"second-side-header",onClick:()=>N(!1),children:[t.jsx("i",{className:"fa fa-chevron-left"})," HIDE"]})})]}),t.jsxs("div",{className:"container-main",children:[t.jsxs("header",{className:"builder-header",children:[t.jsx(Z,{title:"Edit Template"}),t.jsxs("div",{className:"modes",children:[t.jsx("span",{className:"mode-label",children:"BUILDING MODE:"}),["elements","content","details"].map(e=>t.jsxs("label",{children:[t.jsx("input",{type:"radio",checked:B===e,onChange:()=>R(e),style:{marginRight:"2px",marginBottom:"2px"}}),e]}))]}),t.jsxs("div",{className:"flex items-center gap-2",children:[t.jsxs("button",{onClick:W,disabled:!w,className:`
                                inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium
                                transition
                                ${w?"bg-emerald-600 text-white hover:bg-emerald-700":"cursor-not-allowed bg-emerald-200 text-emerald-700"}
                            `,children:["✓ ",w?"Save Page":"Nothing new to save"]}),t.jsx("button",{onClick:K,className:"inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 transition",children:"Export"}),t.jsx("button",{onClick:J,className:"inline-flex items-center rounded-md bg-zinc-800 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-900 transition",children:"Preview"}),t.jsx("button",{onClick:Q,className:"inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 transition",children:"Empty Page"})]})]}),t.jsxs("div",{id:"style-editor-container",className:`style-sidebar-left ${B==="details"?"open":""}`,children:[t.jsxs("div",{className:"sidebar-header-custom",children:[t.jsx("span",{id:"sidebar-title-text",children:t.jsx("h3",{children:"SETTINGS"})}),t.jsx("button",{onClick:()=>document.getElementById("style-editor-container").classList.remove("open"),children:t.jsx("i",{className:"fa fa-times"})})]}),t.jsx("div",{id:"trait-editor-container",className:"sidebar-section"}),t.jsx("div",{id:"style-manager-container",className:"sidebar-section"})]}),t.jsx("div",{className:"screen-area",children:t.jsxs("div",{className:"screen",id:"screen",children:[t.jsxs("div",{className:"toolbar",children:[t.jsxs("div",{className:"buttons clearfix",children:[t.jsx("span",{className:"left red"}),t.jsx("span",{className:"left yellow"}),t.jsx("span",{className:"left green"})]}),t.jsx("div",{className:"title",children:t.jsxs("span",{children:[k,".html"]})})]}),t.jsxs("div",{id:"frameWrapper",className:"frameWrapper empty",children:[t.jsx("div",{id:"gjs",style:{position:"relative",zIndex:10}}),t.jsx("div",{className:"start",id:"start",children:t.jsx("span",{children:"Build your page by dragging elements onto the canvas"})})]})]})})]})]})}export{re as default};
