const { prisma } = require('../../config/database');

class UserSettingsRepository {
  async findByUserId(userId) {
    return await prisma.userSettings.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  async create(data) {
    return await prisma.userSettings.create({
      data,
    });
  }

  async update(userId, data) {
    return await prisma.userSettings.update({
      where: { userId },
      data,
    });
  }

  async delete(userId) {
    return await prisma.userSettings.delete({
      where: { userId },
    });
  }

  async findMany(options = {}) {
    return await prisma.userSettings.findMany(options);
  }

  async count(options = {}) {
    return await prisma.userSettings.count(options);
  }

  async upsert(userId, data) {
    return await prisma.userSettings.upsert({
      where: { userId },
      update: data,
      create: data,
    });
  }
}

module.exports = new UserSettingsRepository();