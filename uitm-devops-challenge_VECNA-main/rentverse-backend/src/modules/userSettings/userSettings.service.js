const userSettingsRepository = require('./userSettings.repository');

class UserSettingsService {
  async getByUserId(userId) {
    return await userSettingsRepository.findByUserId(userId);
  }

  async create(data) {
    return await userSettingsRepository.create(data);
  }

  async update(userId, data) {
    const settings = await userSettingsRepository.findByUserId(userId);
    if (!settings) {
      return null;
    }

    return await userSettingsRepository.update(userId, data);
  }

  async delete(userId) {
    const settings = await userSettingsRepository.findByUserId(userId);
    if (!settings) {
      return false;
    }

    await userSettingsRepository.delete(userId);
    return true;
  }

  async upsert(userId, data) {
    const existingSettings = await userSettingsRepository.findByUserId(userId);
    
    if (existingSettings) {
      return await userSettingsRepository.update(userId, data);
    } else {
      return await userSettingsRepository.create({
        userId,
        language: 'en',
        currency: 'MYR',
        timezone: 'Asia/Kuala_Lumpur',
        notifications: {},
        privacy: {},
        preferences: {},
        ...data,
      });
    }
  }
}

module.exports = new UserSettingsService();