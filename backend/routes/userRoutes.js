const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");

const {
    verifyToken,
    verifyAdmin
} = require("../middleware/authMiddleware");

router.use(verifyToken);
router.use(verifyAdmin);

router.get(
    "/",
    userController.getUsers
);

router.put(
    "/:id",
    userController.updateUserStatus
);

module.exports = router;