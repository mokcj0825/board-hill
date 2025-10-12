const { PrismaClient } = require('@prisma/client');

// Single Prisma client instance
const prisma = new PrismaClient();

module.exports = { prisma };


