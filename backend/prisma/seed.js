const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error('Erreur: ADMIN_EMAIL et ADMIN_PASSWORD doivent être définis dans les variables d\'environnement.');
    process.exit(1);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  // Utilisation de upsert : créer si n'existe pas, sinon ne rien faire
  const admin = await prisma.user.upsert({
    where: { email: email },
    update: {}, 
    create: {
      email: email,
      password: hashedPassword,
      role: 'ADMIN', // Assurez-vous que ce champ correspond à votre modèle
      name: 'Admin Principal',
      is_verified: true
    },
  });

  console.log('Admin créé avec succès:', admin.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });