import './style.css';

const app = document.querySelector('#app');

const fallbackCatalog = {
  categories: [
    { id: 'tech', name: 'Tecnologia', icon: '▣', color: '#dcecff' },
    { id: 'home', name: 'Casa e decoração', icon: '⌂', color: '#fff0ce' },
    { id: 'fashion', name: 'Moda', icon: '✦', color: '#f9ddec' },
    { id: 'beauty', name: 'Beleza', icon: '✺', color: '#e7ddff' },
    { id: 'sports', name: 'Esportes', icon: '◉', color: '#d9f2df' },
    { id: 'auto', name: 'Autopeças', icon: '◌', color: '#e5e5e5' },
  ],
  products: [
    { id: 'iphone-15-128gb', title: 'Apple iPhone 15 128 GB', categoryId: 'tech', price: 3899.90, oldPrice: 4299.90, installments: '12x R$ 324,99 sem juros', shipping: 'Frete grátis', badge: 'OFERTA DO DIA', rating: 4.9, reviews: 1820, stock: 18, image: 'https://images.unsplash.com/photo-1696446701796-da61225697cc?auto=format&fit=crop&w=700&q=85', tone: '#e8eef7' },
    { id: 'notebook-acer-aspire', title: 'Notebook Acer Aspire 5, Intel Core i5', categoryId: 'tech', price: 2799, oldPrice: 3299, installments: '10x R$ 279,90 sem juros', shipping: 'Frete grátis', badge: 'MAIS VENDIDO', rating: 4.8, reviews: 634, stock: 12, image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=700&q=85', tone: '#e7ebf0' },
    { id: 'fone-jbl-tune', title: 'Fone de ouvido Bluetooth JBL Tune 520BT', categoryId: 'tech', price: 199.90, oldPrice: 249.90, installments: '6x R$ 33,32 sem juros', shipping: 'Frete grátis', badge: 'OFERTA', rating: 4.7, reviews: 2470, stock: 34, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=700&q=85', tone: '#eee9f7' },
    { id: 'smart-tv-lg-50', title: 'Smart TV LG 50 polegadas 4K UHD', categoryId: 'tech', price: 2399, oldPrice: 2799, installments: '12x R$ 199,92 sem juros', shipping: 'Frete grátis', badge: 'OFERTA DO DIA', rating: 4.8, reviews: 891, stock: 9, image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=700&q=85', tone: '#e1edf5' },
    { id: 'cadeira-escritorio', title: 'Cadeira de escritório ergonômica com apoio', categoryId: 'home', price: 649.90, oldPrice: 899.90, installments: '10x R$ 64,99 sem juros', shipping: 'Frete grátis', badge: 'MAIS VENDIDO', rating: 4.6, reviews: 451, stock: 21, image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=700&q=85', tone: '#ede8df' },
    { id: 'tenis-adidas-run', title: 'Tênis Adidas Runfalcon 3.0 masculino', categoryId: 'fashion', price: 299.90, oldPrice: 399.90, installments: '8x R$ 37,49 sem juros', shipping: 'Frete grátis', badge: 'OFERTA', rating: 4.8, reviews: 718, stock: 28, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=700&q=85', tone: '#f8e3d8' },
    { id: 'cafeteira-nespresso', title: 'Cafeteira Espresso automática 3 Corações', categoryId: 'home', price: 449.90, oldPrice: 599.90, installments: '10x R$ 44,99 sem juros', shipping: 'Frete grátis', badge: 'OFERTA DO DIA', rating: 4.9, reviews: 124, stock: 15, image: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=700&q=85', tone: '#f0e6dc' },
    { id: 'kit-skincare', title: 'Kit skincare facial vitamina C e ácido hialurônico', categoryId: 'beauty', price: 89.90, oldPrice: 129.90, installments: '3x R$ 29,97 sem juros', shipping: 'Frete grátis', badge: 'MAIS VENDIDO', rating: 4.7, reviews: 306, stock: 42, image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=700&q=85', tone: '#f4e4e2' },
  ],
};

const state = {
  catalog: { ...fallbackCatalog },
  cart: { items: [], count: 0, subtotal: 0 },
  query: '',
  category: '',
  sort: 'recommended',
  minPrice: '',
  maxPrice: '',
  favorites: new Set(JSON.parse(localStorage.getItem('ml-favorites') || '[]')),
};

const money = (value) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const categoryName = (id) => state.catalog.categories.find((item) => item.id === id)?.name || 'Produtos';

function icon(name, extra = '') {
  const paths = {
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    cart: '<circle cx="9" cy="19" r="1.5"/><circle cx="18" cy="19" r="1.5"/><path d="M2.5 3h2l2.2 11h11l2-8H5.5"/>',
    user: '<circle cx="12" cy="8" r="3.5"/><path d="M5 21c.8-3.5 3-5 7-5s6.2 1.5 7 5"/>',
    pin: '<path d="M19 10c0 5-7 10-7 10S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2"/>',
    heart: '<path d="M20.8 8.8c0 5-8.8 10.3-8.8 10.3S3.2 13.8 3.2 8.8A4.7 4.7 0 0 1 12 6.1a4.7 4.7 0 0 1 8.8 2.7Z"/>',
    chevron: '<path d="m7 9 5 5 5-5"/>',
    arrow: '<path d="M5 12h13m-5-5 5 5-5 5"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
  };
  return `<svg class="icon ${extra}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || ''}</svg>`;
}

function shell() {
  app.innerHTML = `
    <header class="site-header">
      <div class="top-header">
        <a class="ml-logo" href="/" aria-label="Mercado Livre, página inicial">
          <span class="logo-mark">M</span><span>mercado<br><strong>livre</strong></span>
        </a>
        <form class="search-form" role="search">
          <label class="sr-only" for="search">O que você está buscando?</label>
          <input id="search" type="search" placeholder="Buscar produtos, marcas e muito mais..." autocomplete="off" />
          <button type="submit" aria-label="Buscar">${icon('search')}</button>
        </form>
        <div class="header-actions">
          <button class="location-button" type="button">${icon('pin')}<span><small>Enviar para</small><strong>Seu endereço</strong></span></button>
          <button class="account-button" type="button">${icon('user')}<span><small>Olá!<br><strong>Entre ou crie sua conta</strong></small></span>${icon('chevron', 'tiny')}</button>
          <a class="orders-link" href="#pedidos">Compras</a>
          <button class="cart-button" type="button" aria-label="Abrir carrinho">${icon('cart')}<span class="cart-count">0</span></button>
        </div>
      </div>
      <nav class="main-nav" aria-label="Navegação de categorias">
        <button class="categories-button" type="button">Categorias ${icon('chevron', 'tiny')}</button>
        <a href="#ofertas">Ofertas do dia</a><a href="#mais-vendidos">Mais vendidos</a><a href="#lojas">Lojas oficiais</a><a href="#vender">Vender</a><a href="#ajuda">Ajuda</a>
        <span class="nav-spacer"></span><a href="#beneficios">Mercado Pontos</a><a href="#assinatura">Assinaturas</a>
      </nav>
    </header>
    <main>
      <section class="hero-banner" aria-label="Ofertas em destaque">
        <div class="hero-copy">
          <span class="hero-kicker">OFERTAS EXCLUSIVAS</span>
          <h1>Seu próximo achado<br><strong>está aqui.</strong></h1>
          <p>Preços incríveis, entrega rápida e tudo o que você precisa em um só lugar.</p>
          <a class="hero-cta" href="#ofertas">Ver ofertas ${icon('arrow')}</a>
        </div>
        <div class="hero-products" aria-hidden="true">
          <div class="hero-circle hero-circle-back"></div>
          <div class="hero-product hero-product-one"><img src="${state.catalog.products[0].image}" alt="" /></div>
          <div class="hero-product hero-product-two"><img src="${state.catalog.products[2].image}" alt="" /></div>
          <div class="hero-product hero-product-three"><img src="${state.catalog.products[7].image}" alt="" /></div>
          <span class="hero-sparkle sparkle-one">✦</span><span class="hero-sparkle sparkle-two">✦</span>
        </div>
      </section>
      <section class="benefit-bar" id="beneficios">
        <div class="benefit">${icon('cart')}<span><strong>Compra segura</strong><small>Você protegido do começo ao fim</small></span></div>
        <div class="benefit">${icon('pin')}<span><strong>Frete grátis</strong><small>Em milhões de produtos</small></span></div>
        <div class="benefit">${icon('heart')}<span><strong>Devolução grátis</strong><small>Se você não gostar, devolvemos</small></span></div>
        <div class="benefit">${icon('user')}<span><strong>Ajuda 24 horas</strong><small>Estamos aqui para ajudar</small></span></div>
      </section>
      <section class="section-block category-section">
        <div class="section-title"><div><span class="section-eyebrow">EXPLORE POR CATEGORIA</span><h2>Encontre tudo o que procura</h2></div><a href="#catalogo">Ver todas ${icon('arrow')}</a></div>
        <div class="category-list">${state.catalog.categories.map((category) => `<button class="category-card ${state.category === category.id ? 'selected' : ''}" data-category="${category.id}" type="button"><span class="category-icon" style="background:${category.color}">${category.icon}</span><strong>${category.name}</strong></button>`).join('')}</div>
      </section>
      <section class="section-block catalog-section" id="ofertas">
        <div class="section-title catalog-heading"><div><span class="section-eyebrow">SELEÇÃO PARA VOCÊ</span><h2>Ofertas do dia</h2></div><div class="catalog-controls"><span class="result-count">${visibleProducts().length} produtos</span><select id="sort" aria-label="Ordenar produtos"><option value="recommended">Mais relevantes</option><option value="price-asc">Menor preço</option><option value="price-desc">Maior preço</option><option value="rating">Melhor avaliação</option></select></div></div>
        <div class="catalog-layout"><aside class="filters"><strong>Filtre por</strong><button class="filter-clear" type="button">Limpar filtros</button><hr /><span class="filter-label">Localização</span><label class="check-row"><input type="checkbox" /> Envio para todo o Brasil</label><label class="check-row"><input type="checkbox" /> Frete grátis</label><hr /><span class="filter-label">Condição</span><label class="check-row"><input type="checkbox" /> Novo</label><label class="check-row"><input type="checkbox" /> Usado</label><hr /><span class="filter-label">Preço</span><div class="price-inputs"><input placeholder="mínimo" aria-label="Preço mínimo" /><span>–</span><input placeholder="máximo" aria-label="Preço máximo" /></div><button class="apply-filter" type="button">Aplicar</button></aside><div class="product-grid" id="product-grid"></div></div>
      </section>
    </main>
    <footer class="site-footer"><div><a class="ml-logo footer-logo" href="/"><span class="logo-mark">M</span><span>mercado<br><strong>livre</strong></span></a><p>A maior comunidade de compra e venda da América Latina.</p></div><div><strong>Sobre o Mercado Livre</strong><a href="#ajuda">Ajuda</a><a href="#termos">Termos e condições</a></div><div><strong>Para comprar</strong><a href="#ofertas">Ofertas do dia</a><a href="#beneficios">Mercado Pontos</a></div><div><strong>Para vender</strong><a href="#vender">Venda no Mercado Livre</a><a href="#lojas">Lojas oficiais</a></div></footer>
    <div class="toast" role="status" aria-live="polite"></div>
    <div class="overlay" hidden></div>
    <aside class="cart-drawer" aria-label="Carrinho de compras" aria-hidden="true"><div class="drawer-header"><h2>Seu carrinho</h2><button class="close-drawer" type="button" aria-label="Fechar">${icon('close')}</button></div><div class="cart-items"></div><div class="cart-empty"><span>${icon('cart')}</span><strong>Seu carrinho está vazio</strong><p>Adicione produtos para vê-los aqui.</p></div><div class="cart-summary"><div><span>Subtotal</span><strong class="cart-subtotal">R$ 0,00</strong></div><button class="checkout-button" type="button">Continuar compra</button></div></aside>
    <div class="modal" id="login-modal" hidden><div class="modal-card"><button class="modal-close" type="button" aria-label="Fechar">${icon('close')}</button><span class="modal-logo">M</span><h2>Entre na sua conta</h2><p>Acesse suas compras, favoritos e muito mais.</p><form class="login-form"><input name="login" placeholder="Usuário ou e-mail" required /><input name="password" type="password" placeholder="Senha" required /><button type="submit">Continuar</button><small class="login-message"></small></form><div class="modal-divider">ou</div><button class="outline-button" type="button">Criar conta</button></div></div>
    <div class="modal" id="checkout-modal" hidden><div class="modal-card checkout-card"><button class="modal-close" type="button" aria-label="Fechar">${icon('close')}</button><span class="modal-logo">✓</span><h2>Quase lá!</h2><p>Esta é uma compra demonstrativa. Confirme para finalizar seu pedido com segurança.</p><button class="confirm-checkout" type="button">Confirmar compra</button></div></div>
  `;
  bindEvents();
  renderProducts();
}

function visibleProducts() {
  let products = state.catalog.products.filter((product) => {
    const matchesCategory = !state.category || product.categoryId === state.category;
    const search = state.query.toLocaleLowerCase('pt-BR');
    const matchesMin = !state.minPrice || product.price >= Number(state.minPrice);
    const matchesMax = !state.maxPrice || product.price <= Number(state.maxPrice);
    return matchesCategory && matchesMin && matchesMax && (!search || `${product.title} ${categoryName(product.categoryId)}`.toLocaleLowerCase('pt-BR').includes(search));
  });
  if (state.sort === 'price-asc') products.sort((a, b) => a.price - b.price);
  if (state.sort === 'price-desc') products.sort((a, b) => b.price - a.price);
  if (state.sort === 'rating') products.sort((a, b) => b.rating - a.rating);
  return products;
}

function productCard(product) {
  const favorite = state.favorites.has(product.id);
  const discount = product.oldPrice ? Math.round((1 - product.price / product.oldPrice) * 100) : 0;
  return `<article class="product-card"><div class="product-image" style="background:${product.tone || '#f1f1f1'}"><img src="${product.image}" alt="${product.title}" loading="lazy" /><button class="favorite-button ${favorite ? 'is-favorite' : ''}" data-favorite="${product.id}" type="button" aria-label="${favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}">${icon('heart')}</button>${product.badge ? `<span class="product-badge">${product.badge}</span>` : ''}</div><div class="product-info"><span class="product-category">${categoryName(product.categoryId)}</span><h3>${product.title}</h3><div class="rating"><span>★</span> ${product.rating} <small>(${product.reviews.toLocaleString('pt-BR')})</small></div>${product.oldPrice ? `<div class="old-price">${money(product.oldPrice)} <b>${discount}% OFF</b></div>` : ''}<div class="price">${money(product.price)}</div><div class="installments">${product.installments}</div><div class="shipping">${product.shipping}</div><button class="add-button" data-add="${product.id}" type="button">Adicionar ao carrinho</button></div></article>`;
}

function renderProducts() {
  const grid = document.querySelector('#product-grid');
  if (!grid) return;
  const products = visibleProducts();
  grid.innerHTML = products.length ? products.map(productCard).join('') : `<div class="no-results"><span>⌕</span><h3>Nenhum produto encontrado</h3><p>Tente buscar por outro termo ou limpe os filtros.</p></div>`;
  document.querySelector('.result-count').textContent = `${products.length} produtos`;
  document.querySelectorAll('[data-favorite]').forEach((button) => button.addEventListener('click', () => {
    const id = button.dataset.favorite;
    state.favorites.has(id) ? state.favorites.delete(id) : state.favorites.add(id);
    localStorage.setItem('ml-favorites', JSON.stringify([...state.favorites]));
    renderProducts();
  }));
  document.querySelectorAll('[data-add]').forEach((button) => button.addEventListener('click', () => addToCart(button.dataset.add)));
}

async function request(url, options) {
  const response = await fetch(url, options);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Não foi possível concluir a ação.');
  return data;
}

async function loadData() {
  try {
    state.catalog = await request(`/api/catalog?q=${encodeURIComponent(state.query)}&category=${encodeURIComponent(state.category)}&sort=${state.sort}`);
    state.cart = await request('/api/cart');
  } catch {
    // The fallback keeps the preview useful when it is opened directly by Vite.
  }
  renderProducts();
  updateCart();
}

async function addToCart(productId) {
  try {
    state.cart = await request('/api/cart', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId, quantity: 1 }) });
    updateCart();
    showToast('Produto adicionado ao carrinho');
  } catch (error) {
    showToast(error.message, true);
  }
}

function updateCart() {
  const count = document.querySelector('.cart-count');
  if (count) count.textContent = state.cart.count || 0;
  const subtotal = document.querySelector('.cart-subtotal');
  if (subtotal) subtotal.textContent = money(state.cart.subtotal || 0);
  const items = document.querySelector('.cart-items');
  const empty = document.querySelector('.cart-empty');
  if (!items || !empty) return;
  empty.hidden = Boolean(state.cart.items.length);
  items.innerHTML = state.cart.items.map((item) => `<div class="cart-item"><img src="${item.product.image}" alt="" /><div><strong>${item.product.title}</strong><span>${money(item.product.price)}</span><div class="quantity-control"><button data-quantity="${item.id}" data-value="${item.quantity - 1}" type="button">−</button><b>${item.quantity}</b><button data-quantity="${item.id}" data-value="${item.quantity + 1}" type="button">+</button><button class="remove-item" data-remove="${item.id}" type="button">Excluir</button></div></div></div>`).join('');
  document.querySelector('.cart-summary').classList.toggle('has-items', Boolean(state.cart.items.length));
  items.querySelectorAll('[data-quantity]').forEach((button) => button.addEventListener('click', () => updateQuantity(button.dataset.quantity, Number(button.dataset.value))));
  items.querySelectorAll('[data-remove]').forEach((button) => button.addEventListener('click', () => removeItem(button.dataset.remove)));
}

async function updateQuantity(id, quantity) {
  if (quantity < 1) return removeItem(id);
  try { state.cart = await request(`/api/cart/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quantity }) }); updateCart(); }
  catch (error) { showToast(error.message, true); }
}

async function removeItem(id) {
  try { state.cart = await request(`/api/cart/${id}`, { method: 'DELETE' }); updateCart(); showToast('Produto removido do carrinho'); }
  catch (error) { showToast(error.message, true); }
}

function showToast(message, isError = false) {
  const toast = document.querySelector('.toast');
  toast.textContent = message;
  toast.classList.toggle('error', isError);
  toast.classList.add('visible');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('visible'), 2800);
}

function toggleCart(open) {
  document.querySelector('.overlay').hidden = !open;
  document.querySelector('.cart-drawer').classList.toggle('open', open);
  document.querySelector('.cart-drawer').setAttribute('aria-hidden', String(!open));
  document.body.classList.toggle('no-scroll', open);
}

function bindEvents() {
  document.querySelector('.search-form').addEventListener('submit', (event) => {
    event.preventDefault();
    state.query = document.querySelector('#search').value.trim();
    state.category = '';
    loadData();
    document.querySelector('#ofertas').scrollIntoView({ behavior: 'smooth' });
  });
  document.querySelector('#sort').addEventListener('change', (event) => { state.sort = event.target.value; loadData(); });
  document.querySelectorAll('[data-category]').forEach((button) => button.addEventListener('click', () => {
    state.category = state.category === button.dataset.category ? '' : button.dataset.category;
    document.querySelectorAll('[data-category]').forEach((item) => item.classList.toggle('selected', item === button && Boolean(state.category)));
    loadData();
    document.querySelector('#ofertas').scrollIntoView({ behavior: 'smooth' });
  }));
  document.querySelector('.filter-clear').addEventListener('click', () => {
    state.category = '';
    state.query = '';
    state.minPrice = '';
    state.maxPrice = '';
    document.querySelector('#search').value = '';
    document.querySelectorAll('.price-inputs input').forEach((input) => { input.value = ''; });
    document.querySelectorAll('.filters input[type="checkbox"]').forEach((input) => { input.checked = false; });
    document.querySelectorAll('[data-category]').forEach((item) => item.classList.remove('selected'));
    loadData();
  });
  document.querySelector('.apply-filter').addEventListener('click', () => {
    state.minPrice = document.querySelector('.price-inputs input[placeholder="mínimo"]').value.trim();
    state.maxPrice = document.querySelector('.price-inputs input[placeholder="máximo"]').value.trim();
    renderProducts();
  });
  document.querySelector('.location-button').addEventListener('click', () => showToast('Informe seu endereço no próximo passo da compra.'));
  document.querySelector('.account-button').addEventListener('click', () => document.querySelector('#login-modal').hidden = false);
  document.querySelector('.cart-button').addEventListener('click', () => toggleCart(true));
  document.querySelector('.close-drawer').addEventListener('click', () => toggleCart(false));
  document.querySelector('.overlay').addEventListener('click', () => toggleCart(false));
  document.querySelectorAll('.modal-close').forEach((button) => button.addEventListener('click', () => button.closest('.modal').hidden = true));
  document.querySelector('.login-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try { await request('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(form)) }); event.currentTarget.querySelector('.login-message').textContent = 'Login realizado com sucesso!'; }
    catch (error) { event.currentTarget.querySelector('.login-message').textContent = error.message; }
  });
  document.querySelector('.checkout-button').addEventListener('click', () => {
    if (!state.cart.items.length) return showToast('Adicione um produto ao carrinho primeiro.', true);
    document.querySelector('#checkout-modal').hidden = false;
  });
  document.querySelector('.outline-button').addEventListener('click', () => showToast('Cadastro disponível em breve.'));
  document.querySelector('.confirm-checkout').addEventListener('click', async () => {
    try { const order = await request('/api/orders', { method: 'POST' }); state.cart = { items: [], count: 0, subtotal: 0 }; document.querySelector('#checkout-modal').hidden = true; toggleCart(false); updateCart(); showToast(`Compra ${order.number} confirmada!`); }
    catch (error) { showToast(error.message, true); }
  });
}

shell();
loadData();