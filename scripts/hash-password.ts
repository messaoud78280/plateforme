/**
 * Génère le hash bcrypt pour le mot de passe de démo.
 * Collez le résultat dans Supabase (Table User, colonne password) pour agence@exemple.com et client@exemple.com.
 *
 * Usage: npx tsx scripts/hash-password.ts
 */
import bcrypt from "bcryptjs";

const password = "motdepasse123";
const hash = await bcrypt.hash(password, 12);
console.log("Mot de passe:", password);
console.log("Hash à coller dans Supabase (colonne password):");
console.log(hash);
