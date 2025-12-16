const { validationResult } = require('express-validator');
const userSettingsService = require('./userSettings.service');

class UserSettingsController {
  async getByUserId(req, res) {
    try {
      const { userId } = req.params;
      const settings = await userSettingsService.getByUserId(userId);

      if (!settings) {
        return res.status(404).json({
          success: false,
          message: 'User settings not found',
        });
      }

      res.status(200).json({
        success: true,
        message: 'User settings retrieved successfully',
        data: settings,
      });
    } catch (error) {
      console.error('UserSettings getByUserId error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  async getCurrentUserSettings(req, res) {
    try {
      const userId = req.user.id;
      const settings = await userSettingsService.getByUserId(userId);

      if (!settings) {
        // If no settings exist, create default settings
        const defaultSettings = await userSettingsService.create({
          userId,
          language: 'en',
          currency: 'MYR',
          timezone: 'Asia/Kuala_Lumpur',
          notifications: {},
          privacy: {},
          preferences: {},
        });

        return res.status(200).json({
          success: true,
          message: 'Default user settings created successfully',
          data: defaultSettings,
        });
      }

      res.status(200).json({
        success: true,
        message: 'User settings retrieved successfully',
        data: settings,
      });
    } catch (error) {
      console.error('UserSettings getCurrentUserSettings error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  async create(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const { userId, language, currency, timezone, notifications, privacy, preferences } = req.body;

      const settings = await userSettingsService.create({
        userId,
        language: language || 'en',
        currency: currency || 'MYR',
        timezone: timezone || 'Asia/Kuala_Lumpur',
        notifications: notifications || {},
        privacy: privacy || {},
        preferences: preferences || {},
      });

      res.status(201).json({
        success: true,
        message: 'User settings created successfully',
        data: settings,
      });
    } catch (error) {
      console.error('UserSettings create error:', error);

      if (error.code === 'P2002') {
        return res.status(400).json({
          success: false,
          message: 'User settings already exist for this user',
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  async update(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const { userId } = req.params;
      const updateData = req.body;

      const settings = await userSettingsService.update(userId, updateData);

      if (!settings) {
        return res.status(404).json({
          success: false,
          message: 'User settings not found',
        });
      }

      res.status(200).json({
        success: true,
        message: 'User settings updated successfully',
        data: settings,
      });
    } catch (error) {
      console.error('UserSettings update error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  async updateCurrentUserSettings(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const userId = req.user.id;
      const updateData = req.body;

      const settings = await userSettingsService.update(userId, updateData);

      if (!settings) {
        // If no settings exist, create default settings first
        const defaultSettings = await userSettingsService.create({
          userId,
          language: 'en',
          currency: 'MYR',
          timezone: 'Asia/Kuala_Lumpur',
          notifications: {},
          privacy: {},
          preferences: {},
        });

        // Then update with the provided data
        const updatedSettings = await userSettingsService.update(userId, updateData);

        return res.status(200).json({
          success: true,
          message: 'User settings created and updated successfully',
          data: updatedSettings,
        });
      }

      res.status(200).json({
        success: true,
        message: 'User settings updated successfully',
        data: settings,
      });
    } catch (error) {
      console.error('UserSettings updateCurrentUserSettings error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  async delete(req, res) {
    try {
      const { userId } = req.params;

      const success = await userSettingsService.delete(userId);

      if (!success) {
        return res.status(404).json({
          success: false,
          message: 'User settings not found',
        });
      }

      res.status(200).json({
        success: true,
        message: 'User settings deleted successfully',
      });
    } catch (error) {
      console.error('UserSettings delete error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  }
}

module.exports = new UserSettingsController();