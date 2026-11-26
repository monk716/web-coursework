import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import htm from 'htm';
import { emptyForm, validateRegistration } from './validation.js';
import { apiCategories, categoryLabels, currency, loadProducts, selectProducts } from './catalog.js';

const html = htm.bind(React.createElement);
const Icon = ({ name = 'arrow', size = 20 }) => html`<svg width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${name === 'search' ? html`<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>` : name === 'check' ? html`<path d="m5 12 4 4L19 6"/>` : name === 'eye' ? html`<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>` : name === 'heart' ? html`<path d="M20.5 4.6a5.4 5.4 0 0 0-7.6 0l-.9.9-.9-.9a5.4 5.4 0 1 0-7.6 7.6L12 21l8.5-8.8a5.4 5.4 0 0 0 0-7.6Z"/>` : html`<path d="M4 12h16m-6-6 6 6-6 6"/>`}</svg>`;

function ProductCard({ product, favorite, toggleFavorite }) {
  return html`<article className="product-card">
    <div className=${`product-image tone-${apiCategories.indexOf(product.category)}`}>
      <span className="product-label">${categoryLabels[product.category]}</span>
      <button className=${`favorite ${favorite ? 'selected' : ''}`} aria-label=${`${favorite ? 'Убрать из' : 'Добавить в'} избранного: ${product.title}`} aria-pressed=${favorite} onClick=${toggleFavorite}><${Icon} name="heart" size=${18}/></button>
      <img src=${product.thumbnail} alt=${product.title} loading="lazy" onError=${e => { e.currentTarget.hidden = true; }}/>
    </div>
    <div className="product-info"><span className="product-brand">${product.brand || 'FORMA selection'}</span><span className="rating" aria-label=${`Рейтинг ${product.rating} из 5`}>★ ${product.rating.toFixed(1)}</span>
      <h3>${product.title}</h3><p className="product-price">${currency.format(product.price)}</p>
    </div>
  </article>`;
}

function Catalog() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('default');
  const [maxPrice, setMaxPrice] = useState('');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [favorites, setFavorites] = useState(() => {
    try { const ids = JSON.parse(localStorage.getItem('forma-favorites') || '[]'); return Array.isArray(ids) ? ids : []; } catch { return []; }
  });
  useEffect(() => {
    const controller = new AbortController();
    let timedOut = false;
    const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, 20000);
    setLoading(true); setError('');
    loadProducts(controller.signal).then(setProducts).catch(err => {
      if (err.name !== 'AbortError' || timedOut) setError(timedOut ? 'API не ответил вовремя. Попробуйте ещё раз.' : 'Не удалось загрузить товары. Проверьте подключение к интернету.');
    }).finally(() => { clearTimeout(timeout); if (!controller.signal.aborted || timedOut) setLoading(false); });
    return () => { clearTimeout(timeout); controller.abort(); };
  }, [attempt]);
  const visible = useMemo(() => selectProducts(onlyFavorites ? products.filter(p => favorites.includes(p.id)) : products, { query, category, sort, maxPrice }), [products, query, category, sort, maxPrice, onlyFavorites, favorites]);
  function toggleFavorite(id) {
    setFavorites(current => {
      const next = current.includes(id) ? current.filter(value => value !== id) : [...current, id];
      try { localStorage.setItem('forma-favorites', JSON.stringify(next)); } catch { /* Favorites still work in memory. */ }
      return next;
    });
  }
  function reset() { setQuery(''); setCategory('all'); setSort('default'); setMaxPrice(''); setOnlyFavorites(false); }
  return html`<main>
    <section className="hero"><div className="hero-copy"><span className="eyebrow">ПРОСТРАНСТВО ДЛЯ ВАШЕГО РИТМА</span><h1>Хорошие вещи.<br/><em>Каждый день.</em></h1><p>Для дома, работы и маленьких повседневных<br className="desktop-break"/> радостей. Найдите то, что подходит вам.</p><a className="button light-button" href="#products" onClick=${e => { e.preventDefault(); document.getElementById('products').scrollIntoView({ behavior: 'smooth' }); }}>Смотреть каталог <${Icon}/></a><span className="hero-note">Меньше лишнего. Больше вашего.</span></div>
      <div className="hero-art" aria-hidden="true"><div className="art-circle"></div><span className="art-caption">OBJECTS<br/>WITH PURPOSE</span><svg className="chair-art" viewBox="0 0 460 410"><defs><linearGradient id="chair" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#dfc7a4"/><stop offset="1" stop-color="#b39069"/></linearGradient></defs><ellipse cx="255" cy="372" rx="150" ry="18" fill="#13251d" opacity=".2"/><path d="m181 234-35 136m122-135 27 135m25-164 34 150m-121-146-26 136" stroke="#98734d" stroke-width="12"/><path d="M146 209q91-43 183-8l-27 61q-80 22-143-6Z" fill="url(#chair)"/><path d="m158 219-17-103q-3-34 35-40l89-10q34-3 40 30l13 104q-77 38-160 19Z" fill="url(#chair)"/><path d="M155 116q67-34 145-13M162 157q65-32 144-15M167 197q66-30 144-16" fill="none" stroke="#a68158" opacity=".25" stroke-width="3"/><path d="M145 212q79-32 176-13" fill="none" stroke="#f0dfc5" stroke-width="5"/></svg><div className="art-sticker">ВЕЩИ СО<br/>СМЫСЛОМ <span>↗</span></div><span className="art-number">FORMA / 01</span></div>
    </section>
    <section className="catalog-section" id="products" aria-labelledby="catalog-title"><div className="section-title"><div><span className="eyebrow muted">ВЫБИРАЙТЕ СВОЁ</span><h2 id="catalog-title">Каталог <span>${loading ? '…' : products.length}</span></h2></div><span className="api-label"><i></i> Данные из API</span></div>
      <div className="catalog-toolbar"><div className="category-tabs" aria-label="Категории">${[['all','Все товары'], ...Object.entries(categoryLabels)].map(([value,label]) => html`<button key=${value} className=${category === value ? 'active' : ''} aria-pressed=${category === value} onClick=${() => setCategory(value)}>${label}</button>`)}</div><button className=${`favorites-filter ${onlyFavorites ? 'active' : ''}`} aria-pressed=${onlyFavorites} onClick=${() => setOnlyFavorites(!onlyFavorites)}><${Icon} name="heart" size=${16}/> Избранное (${favorites.length})</button></div>
      <div className="filter-row"><label className="search-box"><${Icon} name="search"/><input type="search" aria-label="Поиск товаров" placeholder="Найти что-то особенное…" value=${query} onChange=${e => setQuery(e.target.value)}/></label><label className="price-filter">Цена до, $<input type="number" min="0" step="0.01" placeholder="Любая" aria-label="Максимальная цена в долларах" value=${maxPrice} onChange=${e => setMaxPrice(e.target.value)}/></label><label className="sort-label">Сортировка<select value=${sort} onChange=${e => setSort(e.target.value)} aria-label="Сортировка товаров"><option value="default">По умолчанию</option><option value="price-asc">Сначала дешевле</option><option value="price-desc">Сначала дороже</option><option value="rating">По рейтингу</option></select></label></div>
      <div className="results-line" aria-live="polite"><span>${loading ? 'Загружаем коллекцию…' : `Найдено товаров: ${visible.length}`}</span><button className="text-button" onClick=${reset}>Сбросить фильтры</button></div>
      ${loading ? html`<div className="product-grid" aria-label="Загрузка товаров">${[1,2,3,4,5,6,7,8].map(i => html`<div key=${i} className="skeleton"><div></div><span></span><span></span></div>`)}</div>` : error ? html`<div className="empty-state" role="alert"><h3>Коллекция пока недоступна</h3><p>${error}</p><button className="button" onClick=${() => setAttempt(attempt + 1)}>Попробовать снова <${Icon}/></button></div>` : visible.length ? html`<div className="product-grid">${visible.map(product => html`<${ProductCard} key=${product.id} product=${product} favorite=${favorites.includes(product.id)} toggleFavorite=${() => toggleFavorite(product.id)}/>` )}</div>` : html`<div className="empty-state"><span className="empty-symbol">∅</span><h3>Пока ничего не нашлось</h3><p>Попробуйте другую категорию, цену или поисковый запрос.</p><button className="button" onClick=${reset}>Показать все товары <${Icon}/></button></div>`}
    </section><section className="join-banner"><div><span className="eyebrow">ВАШЕ ПРОСТРАНСТВО НАЧИНАЕТСЯ ЗДЕСЬ</span><h2>Давайте знакомиться.</h2><p>Создайте профиль и познакомьтесь с FORMA поближе.</p></div><a className="button light-button" href="#register">Создать профиль <${Icon}/></a></section>
  </main>`;
}

function Registration() {
  const [values, setValues] = useState({ ...emptyForm });
  const [touched, setTouched] = useState({});
  const [serverErrors, setServerErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const [user, setUser] = useState(null);
  const formRef = useRef(null);
  const errors = { ...validateRegistration(values), ...serverErrors };
  function update(field, value) { setValues(current => ({ ...current, [field]: value })); setServerErrors(current => { const next = { ...current }; delete next[field]; return next; }); setMessage(''); }
  async function submit(event) {
    event.preventDefault();
    if (pending) return;
    setTouched({ name: true, email: true, password: true, confirmPassword: true });
    const currentErrors = validateRegistration(values);
    if (Object.keys(currentErrors).length) { formRef.current.elements[Object.keys(currentErrors)[0]]?.focus(); return; }
    setPending(true); setMessage(''); setServerErrors({});
    try {
      const { registerUser } = await import('./database.js');
      const created = await registerUser(values);
      setUser(created); setValues({ ...emptyForm });
    } catch (error) {
      if (error.fields) { setServerErrors(error.fields); formRef.current.elements[Object.keys(error.fields)[0]]?.focus(); }
      else setMessage(error.message?.includes('вкладке') ? error.message : 'Не удалось открыть базу данных. Разрешите хранение данных сайта и попробуйте снова.');
    } finally { setPending(false); }
  }
  const fields = [
    ['name','Ваше имя','Как к вам обращаться?','text','name'],
    ['email','Email','name@example.com','email','email'],
    ['password','Пароль','Не менее 8 символов',showPassword ? 'text' : 'password','new-password'],
    ['confirmPassword','Подтверждение пароля','Повторите пароль',showPassword ? 'text' : 'password','new-password']
  ];
  return html`<main className="registration-page"><a className="back-link" href="#catalog">← Вернуться в каталог</a><div className="registration-layout"><aside className="registration-aside"><span className="eyebrow">РАДЫ ВАС ВИДЕТЬ</span><h1>Хорошие вещи<br/>начинаются<br/><em>со знакомства.</em></h1><p>Небольшой шаг к пространству,<br/>в котором всё на своём месте.</p><div className="registration-shapes" aria-hidden="true"><div></div><div></div><div></div></div><span className="aside-bottom">FORMA — ВАША ПОВСЕДНЕВНОСТЬ, ЛУЧШЕ.</span></aside>
    <section className="registration-form-wrap">${user ? html`<div className="success-state" role="status"><span className="success-icon"><${Icon} name="check" size=${36}/></span><span className="eyebrow muted">ВСЁ ПОЛУЧИЛОСЬ</span><h2>Добро пожаловать,<br/>${user.name}!</h2><p>Профиль <strong>${user.email}</strong> сохранён в PostgreSQL этого браузера.</p><a className="button" href="#catalog">Перейти в каталог <${Icon}/></a><button className="text-button" onClick=${() => { setUser(null); setTouched({}); }}>Зарегистрировать ещё пользователя</button></div>` : html`<span className="eyebrow muted">НОВОЕ ЗНАКОМСТВО</span><h2>Создать профиль</h2><p className="form-subtitle">Заполните четыре поля — и готово.</p><form ref=${formRef} onSubmit=${submit} noValidate>
      ${fields.map(([field,label,placeholder,type,autocomplete]) => html`<div className="form-field" key=${field}><label htmlFor=${field}>${label}<span aria-hidden="true"> *</span></label><div className=${`input-wrap ${touched[field] && errors[field] ? 'invalid' : ''}`}><input id=${field} name=${field} type=${type} autoComplete=${autocomplete} placeholder=${placeholder} value=${values[field]} required minLength=${field === 'name' ? 2 : field.includes('assword') ? 8 : undefined} maxLength=${field === 'name' ? 80 : field === 'email' ? 254 : 128} disabled=${pending} aria-invalid=${Boolean(touched[field] && errors[field])} aria-describedby=${`${field}-hint`} onChange=${e => update(field,e.target.value)} onBlur=${() => setTouched(current => ({ ...current, [field]: true }))}/>${field === 'password' ? html`<button type="button" className="password-toggle" aria-label=${showPassword ? 'Скрыть пароли' : 'Показать пароли'} aria-pressed=${showPassword} onClick=${() => setShowPassword(!showPassword)}><${Icon} name="eye" size=${19}/></button>` : null}</div><span id=${`${field}-hint`} className=${touched[field] && errors[field] ? 'field-error' : 'field-hint'} aria-live="polite">${touched[field] && errors[field] ? errors[field] : field === 'password' ? 'От 8 до 128 символов. Можно использовать пробелы.' : ''}</span></div>`)}
      ${message ? html`<p className="form-alert" role="alert">${message}</p>` : null}<button className="button submit-button" type="submit" disabled=${pending}>${pending ? 'Сохраняем в PostgreSQL…' : 'Создать профиль'}${pending ? html`<span className="spinner"></span>` : html`<${Icon}/>`}</button><p className="form-note">Учебная регистрация. Используйте тестовые данные.<br/>Данные хранятся только в этом браузере; пароль — в виде хеша.</p>
      </form>`}</section></div></main>`;
}

function App() {
  const [route, setRoute] = useState(location.hash === '#register' ? 'register' : 'catalog');
  useEffect(() => {
    function navigate() { const next = location.hash === '#register' ? 'register' : 'catalog'; setRoute(next); window.scrollTo({ top: 0 }); }
    window.addEventListener('hashchange', navigate);
    return () => window.removeEventListener('hashchange', navigate);
  }, []);
  useEffect(() => { document.title = route === 'register' ? 'Создать профиль — FORMA' : 'FORMA — вещи для вашего пространства'; }, [route]);
  return html`<div className="site"><a href="#main-content" className="skip-link" onClick=${e => { e.preventDefault(); document.getElementById('main-content').focus(); }}>Перейти к содержимому</a><div className="announcement">Учебный проект <span>Регистрация · React · PostgreSQL</span></div><header className="header"><a className="logo" href="#catalog" aria-label="FORMA — главная">F<span className="logo-o">O</span>RMA<span className="logo-dot">●</span></a><nav aria-label="Главная навигация"><a href="#catalog" className=${route === 'catalog' ? 'current' : ''} aria-current=${route === 'catalog' ? 'page' : undefined}>Каталог</a><a href="#register" className=${route === 'register' ? 'current' : ''} aria-current=${route === 'register' ? 'page' : undefined}>Регистрация</a></nav><a className="header-profile" href="#register">Создать профиль <${Icon} size=${17}/></a></header><div id="main-content" tabIndex="-1">${route === 'register' ? html`<${Registration}/>` : html`<${Catalog}/>`}</div><footer><a href="#catalog" className="logo">FORMA<span className="logo-dot">●</span></a><span>Вещи для вашего пространства.</span><span className="footer-project">Учебный проект · Задания 3 и 4</span></footer></div>`;
}

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { failed: false }; }
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? html`<div className="empty-state"><h1>Не удалось открыть страницу</h1><p>Обновите страницу и проверьте подключение к интернету.</p><button className="button" onClick=${() => location.reload()}>Обновить страницу</button></div>` : this.props.children; }
}
createRoot(document.getElementById('root')).render(html`<${ErrorBoundary}><${App}/></${ErrorBoundary}>`);
