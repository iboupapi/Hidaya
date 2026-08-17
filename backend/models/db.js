const { PrismaClient } = require('@prisma/client');

// Instanciation unique du client Prisma
const prisma = new PrismaClient();

module.exports = prisma;