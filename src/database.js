import { validateRegistration } from './validation.js';

let databasePromise;
const schema = `CREATE TABLE IF NOT EXISTS users (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(80) NOT NULL CHECK (char_length(name) BETWEEN 2 AND 80),
  email VARCHAR(254) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);`;

// This is PostgreSQL compiled to WebAssembly. Its files persist in IndexedDB.
// The Web Lock prevents two tabs from opening the same files concurrently.
async function getDatabase() {
  if (!databasePromise) {
    databasePromise = (async () => {
      const { PGlite } = await import('https://cdn.jsdelivr.net/npm/@electric-sql/pglite@0.3.14/dist/index.js');
      const db = new PGlite('idb://forma-coursework-v1');
      await db.waitReady;
      await db.exec(schema);
      return db;
    })().catch(error => { databasePromise = undefined; throw error; });
  }
  return databasePromise;
}

let lockPromise;
async function holdDatabaseLock() {
  if (!navigator.locks) throw new Error('Для базы данных нужен современный браузер с поддержкой Web Locks.');
  if (!lockPromise) {
    lockPromise = new Promise((resolve, reject) => {
      navigator.locks.request('forma-postgresql-files', { ifAvailable: true }, async lock => {
        if (!lock) { reject(new Error('Регистрация уже открыта в другой вкладке. Закройте её и повторите.')); return; }
        resolve();
        await new Promise(() => {}); // Released automatically when the tab closes.
      }).catch(reject);
    }).catch(error => { lockPromise = undefined; throw error; });
  }
  return lockPromise;
}

async function passwordHash(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 600000 }, key, 256);
  const hex = bytes => Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('');
  return `pbkdf2-sha256$600000$${hex(salt)}$${hex(bits)}`;
}

export async function registerUser(values) {
  const errors = validateRegistration(values);
  if (Object.keys(errors).length) { const error = new Error('Проверьте поля формы.'); error.fields = errors; throw error; }
  await holdDatabaseLock();
  const db = await getDatabase();
  const hash = await passwordHash(values.password);
  try {
    const { rows } = await db.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, created_at',
      [values.name.trim(), values.email.trim().toLowerCase(), hash]
    );
    return rows[0];
  } catch (error) {
    if (error.code === '23505') {
      const duplicate = new Error('Этот email уже зарегистрирован в этом браузере.');
      duplicate.fields = { email: duplicate.message };
      throw duplicate;
    }
    throw error;
  }
}
