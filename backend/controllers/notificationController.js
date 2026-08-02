const Notification = require("../models/Notification");

exports.getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.findAll();
        const unread = await Notification.unreadCount();

        res.json({
            success: true,
            unread,
            count: notifications.length,
            data: notifications
        });
    }

    catch(err){
        console.error(err);
        res.status(500).json({
            success:false
        });
    }
};

exports.markAsRead = async (req,res)=>{
    await Notification.markAsRead(req.params.id);
    res.json({
        success:true
    });
};