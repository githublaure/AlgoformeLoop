import bcrypt from 'bcrypt';
import { sql } from 'drizzle-orm';
import { users, subscriptions } from '@shared/schema';

async function main() {
  try {
    const { db } = await import('../db');

    // Find user by name
    const [existing] = await db.select().from(users).where(users.name.equals('yoopiyo'));

    let user = existing;
    if (!user) {
      console.log('Utilisateur "yoopiyo" introuvable, création d\'un compte avec email yoopiyo@example.com et mot de passe temporaire');
      const password = 'changeme';
      const hashed = await bcrypt.hash(password, 10);
      const [created] = await db.insert(users).values({ name: 'yoopiyo', email: 'yoopiyo@example.com', password: hashed }).returning();
      user = created;
      console.log(`Compte créé: id=${user.id}, email=${user.email}, mot de passe temporaire='${password}'`);
    } else {
      console.log(`Utilisateur trouvé: id=${user.id}, email=${user.email}`);
    }

    // Count orphans
    const orphans = await db.select().from(subscriptions).where(subscriptions.userId.isNull);
    if (!orphans.length) {
      console.log('Aucun abonnement orphelin à assigner.');
      return;
    }

    console.log(`Assignation de ${orphans.length} abonnement(s) orphelin(s) à l'utilisateur yoopiyo (id=${user.id})...`);

    await db.execute(sql`UPDATE "subscriptions" SET "user_id" = ${user.id} WHERE "user_id" IS NULL`);

    console.log('Assignation terminée.');
  } catch (err: any) {
    if (err && /DATABASE_URL/.test(err.message)) {
      console.error('Impossible d\'exécuter le script: la variable d\'environnement DATABASE_URL n\'est pas définie.');
      process.exit(1);
    }

    console.error('Erreur lors de l\'exécution:', err);
    process.exit(1);
  }
}

main();
