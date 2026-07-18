const SystemSetting = require("../models/SystemSetting");

class SystemSettingService {
    static async getSettings() {
        const settings = await SystemSetting.getAll();
        const formatted = {};
        settings.forEach(item => {
            formatted[item.setting_key] = item.setting_value;
        });
        return formatted;
    }
}

module.exports = SystemSettingService;