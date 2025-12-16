const userSettingsRoutes = require('./userSettings.routes');
const userSettingsController = require('./userSettings.controller');
const userSettingsService = require('./userSettings.service');
const userSettingsRepository = require('./userSettings.repository');

module.exports = {
  routes: userSettingsRoutes,
  controller: userSettingsController,
  service: userSettingsService,
  repository: userSettingsRepository,
};