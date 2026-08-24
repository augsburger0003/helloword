import fs from "node:fs/promises";
import path from "node:path";
import { randomBytes, scryptSync } from "node:crypto";
import { config } from "./config.js";

function passwordHash(password, salt = randomBytes(16).toString("hex")) {
  return {
    salt,
    passwordHash: scryptSync(password, salt, 64).toString("hex"),
  };
}

function valueOrGenerated(value, fallbackFactory) {
  return typeof value === "string" && value.trim() ? value.trim() : fallbackFactory();
}

const categories = [
  { id: "tech", name: "Tecnologia", icon: "▣", color: "#dcecff" },
  { id: "home", name: "Casa e decoração", icon: "⌂", color: "#fff0ce" },
  { id: "fashion", name: "Moda", icon: "✦", color: "#f9ddec" },
  { id: "beauty", name: "Beleza", icon: "✺", color: "#e7ddff" },
  { id: "sports", name: "Esportes", icon: "◉", color: "#d9f2df" },
  { id: "auto", name: "Autopeças", icon: "◌", color: "#e5e5e5" },
];

const products = [
  {
    id: "iphone-15-128gb",
    title: "Apple iPhone 15 128 GB",
    categoryId: "tech",
    price: 3899.9,
    oldPrice: 4299.9,
    installments: "12x R$ 324,99 sem juros",
    shipping: "Frete grátis",
    badge: "OFERTA DO DIA",
    rating: 4.9,
    reviews: 1820,
    stock: 18,
    image: "https://images.unsplash.com/photo-1696446701796-da61225697cc?auto=format&fit=crop&w=700&q=85",
    tone: "#e8eef7",
  },
  {
    id: "notebook-acer-aspire",
    title: "Notebook Acer Aspire 5, Intel Core i5",
    categoryId: "tech",
    price: 2799,
    oldPrice: 3299,
    installments: "10x R$ 279,90 sem juros",
    shipping: "Frete grátis",
    badge: "MAIS VENDIDO",
    rating: 4.8,
    reviews: 634,
    stock: 12,
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=700&q=85",
    tone: "#e7ebf0",
  },
  {
    id: "fone-jbl-tune",
    title: "Fone de ouvido Bluetooth JBL Tune 520BT",
    categoryId: "tech",
    price: 199.9,
    oldPrice: 249.9,
    installments: "6x R$ 33,32 sem juros",
    shipping: "Frete grátis",
    badge: "OFERTA",
    rating: 4.7,
    reviews: 2470,
    stock: 34,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=700&q=85",
    tone: "#eee9f7",
  },
  {
    id: "smart-tv-lg-50",
    title: "Smart TV LG 50 polegadas 4K UHD",
    categoryId: "tech",
    price: 2399,
    oldPrice: 2799,
    installments: "12x R$ 199,92 sem juros",
    shipping: "Frete grátis",
    badge: "OFERTA DO DIA",
    rating: 4.8,
    reviews: 891,
    stock: 9,
    image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=700&q=85",
    tone: "#e1edf5",
  },
  {
    id: "cadeira-escritorio",
    title: "Cadeira de escritório ergonômica com apoio",
    categoryId: "home",
    price: 649.9,
    oldPrice: 899.9,
    installments: "10x R$ 64,99 sem juros",
    shipping: "Frete grátis",
    badge: "MAIS VENDIDO",
    rating: 4.6,
    reviews: 451,
    stock: 21,
    image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=700&q=85",
    tone: "#ede8df",
  },
  {
    id: "tenis-adidas-run",
    title: "Tênis Adidas Runfalcon 3.0 masculino",
    categoryId: "fashion",
    price: 299.9,
    oldPrice: 399.9,
    installments: "8x R$ 37,49 sem juros",
    shipping: "Frete grátis",
    badge: "OFERTA",
    rating: 4.8,
    reviews: 718,
    stock: 28,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=700&q=85",
    tone: "#f8e3d8",
  },
  {
    id: "cafeteira-nespresso",
    title: "Cafeteira Espresso automática 3 Corações",
    categoryId: "home",
    price: 449.9,
    oldPrice: 599.9,
    installments: "10x R$ 44,99 sem juros",
    shipping: "Frete grátis",
    badge: "OFERTA DO DIA",
    rating: 4.9,
    reviews: 124,
    stock: 15,
    image: "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=700&q=85",
    tone: "#f0e6dc",
  },
  {
    id: "kit-skincare",
    title: "Kit skincare facial vitamina C e ácido hialurônico",
    categoryId: "beauty",
    price: 89.9,
    oldPrice: 129.9,
    installments: "3x R$ 29,97 sem juros",
    shipping: "Frete grátis",
    badge: "MAIS VENDIDO",
    rating: 4.7,
    reviews: 306,
    stock: 42,
    image: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=700&q=85",
    tone: "#f4e4e2",
  },
];

async function seedCollection(database, collection, records) {
  for (const record of records) {
    const exists = database.find(collection, (item) => item.id === record.id);
    if (!exists) await database.insert(collection, record);
  }
}

async function writeAccessFile({ username, email, password }) {
  const accessDir = path.join(config.rootDir, ".dashboardia");
  await fs.mkdir(accessDir, { recursive: true });
  await fs.writeFile(
    path.join(accessDir, "demo-access.json"),
    `${JSON.stringify({ version: 1, username, email, password }, null, 2)}\n`,
    "utf8",
  );
}

export async function bootstrapDemo(database) {
  // The catalog is public demonstration content and is safe to create on any
  // clean database. Credentials are strictly opt-in through DEMO_MODE.
  await seedCollection(database, "categories", categories);
  await seedCollection(database, "products", products);

  if (!config.demoMode) return { enabled: false, seeded: false };

  const accessDir = path.join(config.rootDir, ".dashboardia");
  let previousAccess = null;
  try {
    previousAccess = JSON.parse(await fs.readFile(path.join(accessDir, "demo-access.json"), "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }

  const username = valueOrGenerated(process.env.DASHBOARDIA_DEMO_USERNAME, () => "admin");
  const email = valueOrGenerated(
    process.env.DASHBOARDIA_DEMO_EMAIL,
    () => `${username}@example.com`,
  );
  const password = valueOrGenerated(
    process.env.DASHBOARDIA_DEMO_PASSWORD,
    () => previousAccess?.password || randomBytes(12).toString("base64url"),
  );

  let user = database.find("users", (item) => item.email === email || item.username === username);
  if (!user) {
    user = await database.insert(
      "users",
      { username, email, role: "admin", ...passwordHash(password) },
      {
        unique: [
          ["username", "O nome de usuário já está em uso."],
          ["email", "O e-mail já está em uso."],
        ],
      },
    );
  } else {
    user = await database.update("users", user.id, passwordHash(password));
  }

  await writeAccessFile({ username, email, password });
  return { enabled: true, seeded: true, username, email };
}

export { categories, products };