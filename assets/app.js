import { requireSupabase, publicPhotoUrl } from "./db.js";
import { t, setLanguage, getLanguage, bilingual, escapeHtml, formatINR } from "./i18n.js";
import { WHATSAPP_PLACEHOLDER } from "../config.js";

const $ = (selector, root=document) => root.querySelector(selector);
const $$ = (selector, root=document) => [...root.querySelectorAll(selector)];
const CART_KEY = "tulika-cart-v1";
const LAST_ORDER_KEY = "tulika-last-order";
const FALLBACK_SETTINGS = {
  boutique_name:"তুলিকা", tagline_bn:"নিজস্বতা, বুনন আর রঙের গল্প।", tagline_en:"Stories in color and weave.",
  about_bn:"কলকাতার হৃদয়ে, তুলিকা তৈরি করে এমন পোশাক যা ঐতিহ্যকে ছুঁয়ে থাকে, অথচ প্রতিদিনের জীবনে সহজ।",
  about_en:"At the heart of Kolkata, Tulika creates pieces that carry a touch of tradition and feel easy in everyday life.",
  address:"১২, গড়িয়াহাট রোড, কলকাতা ৭০০০১৯", phone:"+91 98765 43210",
  whatsapp_number:WHATSAPP_PLACEHOLDER, hours_bn:"সোম–শনি · সকাল ১১টা–রাত ৮টা", hours_en:"Mon–Sat · 11 am–8 pm",
  shipping_charge:80, free_shipping_threshold:2500, hero_bn:"রঙে বুননে|আপনার গল্প", hero_en:"A story|in every thread"
};
let settings = { ...FALLBACK_SETTINGS };
let categoryCache = [];
let currentShopProducts = [];
let currentProduct = null;
let shopOffset = 0;
const pageSize = 12;

function toast(message) {
  const node=$("#toast");
  if(!node)return;
  node.textContent=message;node.hidden=false;
  clearTimeout(toast.timer);toast.timer=setTimeout(()=>node.hidden=true,4000);
}
function setTheme(theme) {
  document.documentElement.dataset.theme=theme;
  try { localStorage.setItem("tulika-theme",theme); } catch(error) { console.warn("Could not save theme preference.",error); }
}
function waUrl(message) {
  const digits=String(settings.whatsapp_number||WHATSAPP_PLACEHOLDER).replace(/\D/g,"");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
function svgPlaceholder(product, index=0) {
  const colors=[["#234D59","#95B9A6"],["#D98670","#F4DCD9"],["#8F3F50","#E3A02B"],["#586B78","#D9D2C5"],["#7C9B72","#F2D18C"],["#7E5147","#D9A774"]];
  const [a,b]=colors[index%colors.length];
  const label=escapeHtml(bilingual(product.name_bn,product.name_en)||"তুলিকা");
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 760"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="640" height="760" fill="url(#g)"/><circle cx="500" cy="140" r="120" fill="#fff" opacity=".14"/><path d="M170 660c28-180 62-260 122-300-20-64-4-137 28-166 34 31 50 102 27 166 62 42 100 122 123 300z" fill="#fff" opacity=".76"/><text x="50%" y="92%" text-anchor="middle" fill="#fff" font-family="sans-serif" font-size="32">${label}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
function imageSrc(image, product, index=0) {
  if(!image||image.storage_path?.startsWith("demo-"))return svgPlaceholder(product,index);
  try { return publicPhotoUrl(image.storage_path); }
  catch { return svgPlaceholder(product,index); }
}
function normalizeProduct(row) {
  return {
    ...row,
    category:row.categories||{},
    images:(row.product_images||[]).sort((a,b)=>a.sort_order-b.sort_order),
    sizes:(row.product_sizes||[]).sort((a,b)=>a.size.localeCompare(b.size))
  };
}
function activePrice(product) { return Number(product.discount_price||product.price); }
function availableStock(product) { return product.sizes.reduce((sum,size)=>sum+Number(size.stock||0),0); }
function displayPrice(product) {
  const current=formatINR(activePrice(product));
  return product.discount_price
    ? `<span class="price">${escapeHtml(current)}</span><del class="old-price">${escapeHtml(formatINR(product.price))}</del>`
    : `<span class="price">${escapeHtml(current)}</span>`;
}
function productCard(product,index=0) {
  const category=bilingual(product.category.name_bn,product.category.name_en);
  const badges=[product.is_new?`<span class="badge">${escapeHtml(t("fresh"))}</span>`:"",product.featured?`<span class="badge">${escapeHtml(t("featured"))}</span>`:"",availableStock(product)===0?`<span class="badge">${escapeHtml(t("soldOut"))}</span>`:""].filter(Boolean).join("");
  return `<article class="product-card">
    <a class="product-photo" href="product.html?slug=${encodeURIComponent(product.slug)}" aria-label="${escapeHtml(t("view"))}: ${escapeHtml(bilingual(product.name_bn,product.name_en))}">
      <img loading="lazy" src="${escapeHtml(imageSrc(product.images[0],product,index))}" alt="${escapeHtml(bilingual(product.images[0]?.alt_bn,product.images[0]?.alt_en)||bilingual(product.name_bn,product.name_en))}">
      <span class="badge-row">${badges}</span>
    </a>
    <div class="product-body"><div class="product-meta"><span>${escapeHtml(category)}</span>${availableStock(product)>0?`<span>${escapeHtml(t("inStock"))}</span>`:`<span>${escapeHtml(t("soldOut"))}</span>`}</div>
      <h3 class="product-title"><a href="product.html?slug=${encodeURIComponent(product.slug)}">${escapeHtml(bilingual(product.name_bn,product.name_en))}</a></h3>
      <p class="product-description">${escapeHtml(bilingual(product.description_bn,product.description_en))}</p>
      <p>${displayPrice(product)}</p>
      <a class="button secondary" href="product.html?slug=${encodeURIComponent(product.slug)}">${escapeHtml(t("view"))}</a>
    </div></article>`;
}
function getCart() {
  try {
    const parsed=JSON.parse(localStorage.getItem(CART_KEY)||"[]");
    if(!Array.isArray(parsed))return [];
    return parsed.filter(item=>item&&typeof item.productId==="string"&&typeof item.size==="string"&&Number.isInteger(item.quantity)&&item.quantity>0);
  } catch { return []; }
}
function saveCart(cart) {
  localStorage.setItem(CART_KEY,JSON.stringify(cart));
  document.dispatchEvent(new CustomEvent("tulika:cart"));
}
async function fetchProducts({ids=null,slug=null,featured=false,category=null,from=0,to=pageSize-1}={}) {
  const client=requireSupabase();
  let query=client.from("products").select("*,categories(name_bn,name_en,slug),product_images(*),product_sizes(*)").eq("visible",true);
  if(ids)query=query.in("id",ids);
  if(slug)query=query.eq("slug",slug);
  if(featured)query=query.eq("featured",true);
  if(category)query=query.eq("category_id",category);
  query=query.order("featured",{ascending:false}).order("created_at",{ascending:false}).range(from,to);
  const {data,error}=await query;
  if(error)throw error;
  return (data||[]).map(normalizeProduct);
}
async function fetchSettings() {
  const client=requireSupabase();
  const {data,error}=await client.from("settings").select("*").eq("id",true).maybeSingle();
  if(error)throw error;
  if(data)settings={...FALLBACK_SETTINGS,...data};
}
async function fetchCategories() {
  const client=requireSupabase();
  const {data,error}=await client.from("categories").select("*").eq("visible",true).order("sort_order");
  if(error)throw error;
  categoryCache=data||[];
  return categoryCache;
}
function showError(container,error) {
  console.error(error);
  if(container)container.innerHTML=`<div class="error" role="alert">${escapeHtml(t("loadError"))}<br><small>${escapeHtml(error.message||"")}</small></div>`;
}
function hydrateShell() {
  const header=$("#app-header"), footer=$("#app-footer");
  if(header)header.innerHTML=`<a class="skip" href="#main">মূল বিষয়বস্তুতে যান</a><header class="topbar"><nav class="nav wrap" aria-label="${escapeHtml(t("mainNav"))}" data-i18n-aria="mainNav">
    <a class="brand" href="index.html"><span class="brand-mark">তু</span><span class="brand-name" data-brand>তুলিকা</span></a>
    <div class="nav-links"><a href="index.html" data-i18n="home">হোম</a><a href="shop.html" data-i18n="shop">সংগ্রহ</a><a href="track.html" data-i18n="track">অর্ডার খুঁজুন</a><a href="index.html#contact" data-i18n="contact">যোগাযোগ</a></div>
    <div class="nav-actions"><button class="theme-button" type="button" data-theme-button aria-label="থিম বদলান">◐</button><button class="lang-button" type="button" data-lang-toggle>EN</button><a class="button secondary" href="cart.html" aria-label="${escapeHtml(t("cart"))}">♧ <span data-cart-count>0</span></a></div>
  </nav><nav class="mobile-links wrap" aria-label="${escapeHtml(t("mainNav"))}"><a href="index.html" data-i18n="home">হোম</a><a href="shop.html" data-i18n="shop">সংগ্রহ</a><a href="track.html" data-i18n="track">অর্ডার খুঁজুন</a><a href="index.html#contact" data-i18n="contact">যোগাযোগ</a></nav></header>`;
  if(footer)footer.innerHTML=`<footer class="site-footer"><div class="footer-row wrap"><span>© ${new Date().getFullYear()} <span data-brand>তুলিকা</span> · <span data-i18n="footerLine">কলকাতার নিজস্ব ফ্যাশন বুটিক</span></span><nav class="footer-links"><a href="shipping.html" data-i18n="shippingPolicy">ডেলিভারি ও ফেরত</a><a href="privacy.html" data-i18n="privacy">গোপনীয়তা</a><a href="terms.html" data-i18n="terms">শর্তাবলি</a><a href="admin.html" data-i18n="owner">মালিকের লগইন</a></nav></div></footer>`;
  $("#floating-wa")?.setAttribute("href",waUrl(t("whatsappQuery")));
  $$("[data-theme-button]").forEach(button=>button.addEventListener("click",()=>setTheme(document.documentElement.dataset.theme==="dark"?"light":"dark")));
  $$("[data-lang-toggle]").forEach(button=>button.addEventListener("click",()=>setLanguage(getLanguage()==="bn"?"en":"bn")));
  updateCartCount();
}
function updateCartCount() {
  const count=getCart().reduce((sum,item)=>sum+item.quantity,0);
  $$("[data-cart-count]").forEach(node=>node.textContent=String(count));
}
function applySettings() {
  $$("[data-brand]").forEach(node=>node.textContent=settings.boutique_name);
  $$("[data-setting=tagline]").forEach(node=>node.textContent=bilingual(settings.tagline_bn,settings.tagline_en));
  $$("[data-setting=about]").forEach(node=>node.textContent=bilingual(settings.about_bn,settings.about_en));
  $$("[data-setting=address]").forEach(node=>node.textContent=settings.address);
  $$("[data-setting=phone]").forEach(node=>{node.textContent=settings.phone;node.href=`tel:${String(settings.phone).replace(/[^\d+]/g,"")}`;});
  $$("[data-setting=hours]").forEach(node=>node.textContent=bilingual(settings.hours_bn,settings.hours_en));
  $$("[data-setting=hero]").forEach(node=>{
    const lines=bilingual(settings.hero_bn,settings.hero_en).split("|");
    node.innerHTML=`${escapeHtml(lines[0]||"")}<br><span>${escapeHtml(lines[1]||"")}</span>`;
  });
  $$("[data-contact-map]").forEach(node=>node.href=`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.address)}`);
  const title=document.body.dataset.title;
  if(title)document.title=`${getLanguage()==="bn"?title:({
    home:"Kolkata's independent fashion boutique",shop:"Collection",product:"Product",
    cart:"Your bag",checkout:"Checkout","order-done":"Order received",track:"Track order",
    "Shipping & returns":"Shipping & returns",Privacy:"Privacy",Terms:"Terms"
  }[document.body.dataset.page]||title)} — ${getLanguage()==="bn"?settings.boutique_name:"Tulika"}`;
  const description=document.querySelector('meta[name="description"]');
  if(description)description.content=bilingual(settings.tagline_bn,settings.tagline_en);
  const ogTitle=document.querySelector('meta[property="og:title"]');
  if(ogTitle)ogTitle.content=document.title;
  const ogDescription=document.querySelector('meta[property="og:description"]');
  if(ogDescription)ogDescription.content=bilingual(settings.tagline_bn,settings.tagline_en);
}
function renderHome() {
  const target=$("#featured-products"), tiles=$("#category-tiles"), reviewTarget=$("#home-reviews");
  Promise.all([fetchCategories(),fetchProducts({featured:true,from:0,to:3}),requireSupabase().from("reviews").select("*").eq("visible",true).order("created_at",{ascending:false}).limit(3)])
    .then(([categories,products,reviewsResult])=>{
      target.innerHTML=products.length?products.map(productCard).join():`<p class="empty">${escapeHtml(t("noProducts"))}</p>`;
      tiles.innerHTML=categories.map(category=>`<a class="category-tile" href="shop.html?category=${encodeURIComponent(category.id)}">${escapeHtml(bilingual(category.name_bn,category.name_en))}</a>`).join("");
      const reviews=reviewsResult.data||[];
      if(reviewsResult.error)throw reviewsResult.error;
      reviewTarget.innerHTML=reviews.map(review=>`<article class="review-card"><p class="stars" aria-label="${review.rating} stars">★★★★★</p><blockquote>“${escapeHtml(bilingual(review.text_bn,review.text_en))}”</blockquote><cite>— ${escapeHtml(review.customer_name)}</cite></article>`).join("");
      applySettings();
    }).catch(error=>showError(target,error));
}
function renderShop() {
  const grid=$("#shop-products"), skeleton=$("#shop-skeleton");
  const categorySelect=$("#shop-category"), search=$("#shop-search"), sort=$("#shop-sort"), stock=$("#shop-stock");
  let reachedEnd=false;
  const urlCategory=new URLSearchParams(location.search).get("category");
  (async()=>{
    const categories=await fetchCategories();
    categorySelect.innerHTML=`<option value="">${escapeHtml(t("all"))}</option>`+categories.map(cat=>`<option value="${escapeHtml(cat.id)}">${escapeHtml(bilingual(cat.name_bn,cat.name_en))}</option>`).join("");
    if(urlCategory)categorySelect.value=urlCategory;
    await loadPage(true);
  })().catch(error=>{skeleton.hidden=true;showError(grid,error);});
  async function loadPage(reset=false) {
    if(reset){shopOffset=0;reachedEnd=false;currentShopProducts=[];grid.innerHTML="";skeleton.hidden=false;}
    const cats=categorySelect.value;
    let rows=await fetchProducts({category:cats||null,from:shopOffset,to:shopOffset+pageSize-1});
    shopOffset+=rows.length;if(rows.length<pageSize)reachedEnd=true;
    currentShopProducts=[...currentShopProducts,...rows];
    skeleton.hidden=true;
    render();
  }
  function render() {
    const q=search.value.trim().toLocaleLowerCase();
    let rows=currentShopProducts.filter(product=>{
      const match=`${product.name_bn} ${product.name_en} ${product.description_bn} ${product.description_en}`.toLocaleLowerCase().includes(q);
      return match&&(!stock.checked||availableStock(product)>0);
    });
    if(sort.value==="low")rows.sort((a,b)=>activePrice(a)-activePrice(b));
    if(sort.value==="high")rows.sort((a,b)=>activePrice(b)-activePrice(a));
    if(sort.value==="popular")rows.sort((a,b)=>Number(b.featured)-Number(a.featured));
    grid.innerHTML=rows.length?rows.map((product,index)=>productCard(product,index)).join():`<p class="empty">${escapeHtml(t("noProducts"))}</p>`;
    $("#shop-more").hidden=reachedEnd;
  }
  categorySelect.addEventListener("change",()=>loadPage(true).catch(error=>showError(grid,error)));
  [search,sort,stock].forEach(input=>input.addEventListener(input===search?"input":"change",render));
  $("#shop-more").addEventListener("click",()=>loadPage().catch(error=>showError(grid,error)));
}
function renderProduct() {
  const target=$("#product-detail"), slug=new URLSearchParams(location.search).get("slug");
  if(!slug){showError(target,new Error("Product slug is missing."));return;}
  fetchProducts({slug,from:0,to:0}).then(([product])=>{
    if(!product){target.innerHTML=`<p class="empty">${escapeHtml(t("noProducts"))}</p>`;return;}
    currentProduct=product;
    const images=product.images.length?product.images:[{storage_path:"demo-placeholder.svg",alt_bn:product.name_bn,alt_en:product.name_en}];
    const sizes=product.sizes;
    target.innerHTML=`<div class="product-layout"><div><div class="gallery-main"><img id="gallery-main" src="${escapeHtml(imageSrc(images[0],product))}" alt="${escapeHtml(bilingual(images[0].alt_bn,images[0].alt_en)||bilingual(product.name_bn,product.name_en))}"></div><div class="gallery-thumbs" aria-label="${escapeHtml(t("gallery"))}">${images.map((image,index)=>`<button type="button" data-image-index="${index}" aria-label="${escapeHtml(bilingual(image.alt_bn,image.alt_en)||`${t("gallery")} ${index+1}`)}"><img src="${escapeHtml(imageSrc(image,product,index))}" alt=""></button>`).join("")}</div></div>
      <div><p class="eyebrow">${escapeHtml(bilingual(product.category.name_bn,product.category.name_en))}</p><h1 class="page-title">${escapeHtml(bilingual(product.name_bn,product.name_en))}</h1>
      <p class="product-description">${escapeHtml(bilingual(product.description_bn,product.description_en))}</p><p>${displayPrice(product)}</p>
      <p id="product-stock">${availableStock(product)>0?escapeHtml(t("inStock")):`<span class="badge">${escapeHtml(t("soldOut"))}</span>`}</p>
      <div class="field"><label for="product-size">${escapeHtml(t("size"))}</label><select id="product-size" ${sizes.length?"":"disabled"}><option value="">${escapeHtml(t("size"))}</option>${sizes.map(size=>`<option value="${escapeHtml(size.size)}" data-stock="${size.stock}" ${size.stock<1?"disabled":""}>${escapeHtml(size.size)}${size.stock<1?` — ${escapeHtml(t("soldOut"))}`:""}</option>`).join("")}</select></div>
      <div class="field"><label for="product-quantity">${escapeHtml(t("quantity"))}</label><input id="product-quantity" type="number" min="1" max="20" value="1"></div>
      <div class="button-row"><button class="button" id="add-to-cart" type="button">${escapeHtml(t("addCart"))}</button><a class="button secondary" target="_blank" rel="noopener" href="${escapeHtml(waUrl(`${t("order")}: ${bilingual(product.name_bn,product.name_en)}`))}">${escapeHtml(t("order"))}</a><a class="button secondary" target="_blank" rel="noopener" href="${escapeHtml(waUrl(`${t("askQuestion")}${bilingual(product.name_bn,product.name_en)}`))}">${escapeHtml(t("ask"))}</a></div>
      <p class="muted">${escapeHtml(t("payPlaceholder"))}</p></div></div>`;
    $$(".gallery-thumbs button",target).forEach(button=>button.addEventListener("click",()=>{
      const image=images[Number(button.dataset.imageIndex)], main=$("#gallery-main");
      main.src=imageSrc(image,product,Number(button.dataset.imageIndex));main.alt=bilingual(image.alt_bn,image.alt_en)||bilingual(product.name_bn,product.name_en);
    }));
    $("#add-to-cart").addEventListener("click",()=>{
      const size=$("#product-size").value, option=$("#product-size").selectedOptions[0], quantity=Number($("#product-quantity").value);
      if(!size||!option||!Number.isInteger(quantity)||quantity<1||quantity>20){toast(t("size"));return;}
      if(quantity>Number(option.dataset.stock)){toast(t("invalidCart"));return;}
      const cart=getCart(), existing=cart.find(item=>item.productId===product.id&&item.size===size);
      if(existing)existing.quantity=Math.min(20,existing.quantity+quantity);else cart.push({productId:product.id,size,quantity});
      saveCart(cart);toast(t("addCart"));
    });
    applySettings();
  }).catch(error=>showError(target,error));
}
async function cartProducts(cart) {
  if(!cart.length)return [];
  const rows=await fetchProducts({ids:[...new Set(cart.map(item=>item.productId))],from:0,to:pageSize*3-1});
  return rows;
}
async function renderCart() {
  const target=$("#cart-items");
  try{
    const cart=getCart(), products=await cartProducts(cart);
    if(!cart.length){target.innerHTML=`<p class="empty">${escapeHtml(t("emptyCart"))}</p>`;$("#cart-summary").classList.add("hidden");return;}
    const lines=cart.map((item,index)=>{
      const product=products.find(row=>row.id===item.productId);
      if(!product)return {item,index,product:null,stock:0,price:0};
      const variant=product.sizes.find(size=>size.size===item.size);
      return {item,index,product,stock:Number(variant?.stock||0),price:activePrice(product)};
    });
    target.innerHTML=lines.map(({item,index,product})=>{
      if(!product)return `<article class="cart-line"><div><strong>${escapeHtml(t("invalidCart"))}</strong><button class="button secondary" data-remove="${index}" type="button">${escapeHtml(t("remove"))}</button></div></article>`;
      return `<article class="cart-line"><img src="${escapeHtml(imageSrc(product.images[0],product,index))}" alt=""><div><h2 class="product-title">${escapeHtml(bilingual(product.name_bn,product.name_en))}</h2><p>${escapeHtml(t("size"))}: ${escapeHtml(item.size)} · ${escapeHtml(formatINR(activePrice(product)))}</p><div class="cart-line-controls"><label>${escapeHtml(t("quantity"))} <input data-quantity="${index}" type="number" min="1" max="20" value="${item.quantity}" style="width:5rem"></label><button class="button secondary" data-remove="${index}" type="button">${escapeHtml(t("remove"))}</button></div></div></article>`;
    }).join("");
    const subtotal=lines.reduce((sum,line)=>sum+(line.product?line.price*line.item.quantity:0),0);
    const shipping=subtotal>=Number(settings.free_shipping_threshold)?0:Number(settings.shipping_charge);
    $("#cart-subtotal").textContent=formatINR(subtotal);$("#cart-shipping").textContent=formatINR(shipping);$("#cart-total").textContent=formatINR(subtotal+shipping);
    $("#cart-summary").classList.remove("hidden");
    $$("[data-remove]",target).forEach(button=>button.addEventListener("click",()=>{const next=getCart();next.splice(Number(button.dataset.remove),1);saveCart(next);renderCart();}));
    $$("[data-quantity]",target).forEach(input=>input.addEventListener("change",()=>{
      const next=getCart(),index=Number(input.dataset.quantity),qty=Number(input.value);
      if(!Number.isInteger(qty)||qty<1||qty>20){toast(t("invalidCart"));renderCart();return;}
      next[index].quantity=qty;saveCart(next);renderCart();
    }));
    $("#cart-checkout").href="checkout.html";
    const invalid=lines.some(line=>!line.product||line.stock<line.item.quantity);
    $("#cart-checkout").classList.toggle("hidden",invalid);
    if(invalid)target.insertAdjacentHTML("afterbegin",`<p class="error" role="alert">${escapeHtml(t("invalidCart"))}</p>`);
  }catch(error){showError(target,error);}
}
async function validateCart(cart) {
  const products=await cartProducts(cart);
  if(products.length!==new Set(cart.map(item=>item.productId)).size)throw new Error(t("invalidCart"));
  const lines=cart.map(item=>{
    const product=products.find(row=>row.id===item.productId);
    const size=product?.sizes.find(row=>row.size===item.size);
    if(!product||!size||size.stock<item.quantity)throw new Error(t("invalidCart"));
    return {item,product,size,unitPrice:activePrice(product)};
  });
  const subtotal=lines.reduce((sum,line)=>sum+line.unitPrice*line.item.quantity,0);
  const shipping=subtotal>=Number(settings.free_shipping_threshold)?0:Number(settings.shipping_charge);
  return {lines,subtotal,shipping,total:subtotal+shipping};
}
async function renderCheckout() {
  const cart=getCart(), target=$("#checkout-lines");
  try{
    const summary=await validateCart(cart);
    target.innerHTML=summary.lines.map(({item,product})=>`<li>${escapeHtml(bilingual(product.name_bn,product.name_en))} (${escapeHtml(item.size)}) × ${item.quantity} — ${escapeHtml(formatINR(activePrice(product)*item.quantity))}</li>`).join("");
    $("#checkout-subtotal").textContent=formatINR(summary.subtotal);$("#checkout-shipping").textContent=formatINR(summary.shipping);$("#checkout-total").textContent=formatINR(summary.total);
    const form=$("#checkout-form");
    if(form.dataset.bound==="true")return;
    form.dataset.bound="true";
    form.addEventListener("submit",async event=>{
      event.preventDefault();
      const fd=new FormData(form), phone=String(fd.get("phone")||"").replace(/\D/g,""), pin=String(fd.get("pin")||"");
      if(fd.get("website")){toast(t("honeypot"));return;}
      if(!String(fd.get("name")||"").trim()){toast(t("nameError"));return;}
      if(!/^[6-9]\d{9}$/.test(phone)){toast(t("phoneError"));return;}
      if(!/^\d{6}$/.test(pin)){toast(t("pinError"));return;}
      const submit=$("#place-order");submit.disabled=true;submit.textContent=t("loading");
      try{
        const freshCart=getCart();await validateCart(freshCart);
        const {data,error}=await requireSupabase().rpc("create_order",{
          p_customer_name:String(fd.get("name")).trim(),p_phone:phone,p_address:String(fd.get("address")).trim(),
          p_city:String(fd.get("city")).trim(),p_pin_code:pin,p_notes:String(fd.get("notes")||"").trim(),
          p_payment_method:fd.get("payment"),p_items:freshCart.map(item=>({product_id:item.productId,size:item.size,quantity:item.quantity})),
          p_honeypot:""
        });
        if(error)throw error;
        const placed={...data,items:summary.lines.map(({item,product})=>({name:bilingual(product.name_bn,product.name_en),size:item.size,quantity:item.quantity,unit_price:activePrice(product)}))};
        sessionStorage.setItem(LAST_ORDER_KEY,JSON.stringify(placed));saveCart([]);
        location.href="order-done.html";
      }catch(error){console.error(error);toast(error.message||t("networkError"));submit.disabled=false;submit.textContent=t("placeOrder");}
    });
    applySettings();
  }catch(error){showError(target,error);$("#place-order").disabled=true;}
}
function renderOrderDone() {
  let order=null;
  try{order=JSON.parse(sessionStorage.getItem(LAST_ORDER_KEY)||"null");}catch{}
  const target=$("#order-result");
  if(!order){target.innerHTML=`<p class="empty">${escapeHtml(t("networkError"))}</p>`;return;}
  const message=`Tulika order ${order.order_number}\n${order.items.map(item=>`${item.name} (${item.size}) × ${item.quantity}`).join("\n")}\nTotal: ${formatINR(order.total)}`;
  target.innerHTML=`<article class="card"><p class="eyebrow">${escapeHtml(t("orderDone"))}</p><h1 class="page-title">${escapeHtml(t("orderNumber"))}: ${escapeHtml(order.order_number)}</h1><p>${escapeHtml(t("total"))}: <strong>${escapeHtml(formatINR(order.total))}</strong></p><ul>${order.items.map(item=>`<li>${escapeHtml(item.name)} · ${escapeHtml(item.size)} × ${item.quantity}</li>`).join("")}</ul><a class="button" target="_blank" rel="noopener" href="${escapeHtml(waUrl(message))}">${escapeHtml(t("sendWhatsApp"))}</a></article>`;
}
function renderTrack() {
  const form=$("#track-form"), result=$("#track-result");
  form.addEventListener("submit",async event=>{
    event.preventDefault();result.replaceChildren();
    const fd=new FormData(form),number=String(fd.get("order")||"").trim(),phone=String(fd.get("phone")||"").replace(/\D/g,"");
    if(!/^[6-9]\d{9}$/.test(phone)){toast(t("phoneError"));return;}
    try{
      const {data,error}=await requireSupabase().rpc("track_order",{p_order_number:number,p_phone:phone});
      if(error)throw error;
      const items=data.items||[];
      result.innerHTML=`<article class="card"><h2>${escapeHtml(t("orderNumber"))}: ${escapeHtml(data.order_number)}</h2><p>${escapeHtml(t(`status_${data.status}`))}</p><p>${escapeHtml(t("total"))}: ${escapeHtml(formatINR(data.total))}</p><ul>${items.map(item=>`<li>${escapeHtml(item.name)} · ${escapeHtml(item.size)} × ${item.quantity}</li>`).join("")}</ul></article>`;
    }catch(error){result.innerHTML=`<p class="error" role="alert">${escapeHtml(t("orderUnknown"))}</p>`;}
  });
}
async function start() {
  const savedTheme=(()=>{try{return localStorage.getItem("tulika-theme")}catch{return null}})();
  setTheme(savedTheme||(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"));
  hydrateShell();setLanguage(getLanguage());
  document.addEventListener("tulika:cart",updateCartCount);
  window.addEventListener("tulika:language",()=>{applySettings();const page=document.body.dataset.page;if(page==="home")renderHome();if(page==="shop")renderShop();if(page==="product")renderProduct();if(page==="cart")renderCart();if(page==="checkout")renderCheckout();if(page==="order-done")renderOrderDone();});
  const errorBox=$("#global-error");
  try { requireSupabase();await fetchSettings();applySettings(); }
  catch(error) { if(errorBox){errorBox.hidden=false;errorBox.textContent=error.message;}console.warn("Store setup needs configuration.",error); }
  const page=document.body.dataset.page;
  if(page==="home")renderHome();
  if(page==="shop")renderShop();
  if(page==="product")renderProduct();
  if(page==="cart")renderCart();
  if(page==="checkout")renderCheckout();
  if(page==="order-done")renderOrderDone();
  if(page==="track")renderTrack();
}
start().catch(error=>{console.error(error);toast(error.message||t("networkError"));});
