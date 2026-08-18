import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

let dbInstance = null;

export async function getDatabaseConnection() {
  if (dbInstance) {
    return dbInstance;
  }

  const dbPath = process.env.DATABASE_PATH || '../dev.db';
  const absolutePath = path.resolve(dbPath);

  try {
    dbInstance = await open({
      filename: absolutePath,
      driver: sqlite3.Database
    });
    console.log(`📡 Conectado a la base de datos de la tienda virtual en: ${absolutePath}`);
    return dbInstance;
  } catch (error) {
    console.error('❌ Error al conectar a la base de datos:', error);
    throw error;
  }
}

// Helper to fetch active products
export async function getActiveProducts() {
  try {
    const db = await getDatabaseConnection();
    // Fetch products that are active
    const products = await db.all('SELECT id, name, price_local, pv, description, sku, stock FROM products WHERE active = 1');
    return products;
  } catch (error) {
    console.error('Error fetching active products:', error);
    return [];
  }
}

// Helper to fetch payment configuration or verify user
export async function getUserByPhone(phone) {
  try {
    const db = await getDatabaseConnection();
    // Clean phone number to compare (users register phone numbers in various formats)
    // We do a simple search matching ending digits
    const cleanedPhone = phone.replace(/\D/g, '');
    if (cleanedPhone.length < 7) return null;
    
    const user = await db.get(
      'SELECT id, username, name, email, phone, status, package_level FROM users WHERE phone LIKE ?',
      [`%${cleanedPhone}%`]
    );
    return user;
  } catch (error) {
    console.error('Error fetching user by phone:', error);
    return null;
  }
}
