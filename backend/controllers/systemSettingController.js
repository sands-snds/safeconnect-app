const SystemSetting = require("../models/SystemSetting");
const Service = require("../services/systemSettingService");

exports.getSettings = async (req, res) => {
    const settings = await Service.getSettings();
    res.json({
        success:true,
        data:settings
    });
};

exports.updateSetting = async (req,res)=>{
    const { key, value } = req.body;
    await SystemSetting.update(key,value);
    res.json({
        success:true,
        message:"Setting updated."
    });
};