const express = require("express");
const sessionController = require("../controllers/sessionController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// Giriş formunu göstərir.
router.get("/sign-in", sessionController.newForm);
// Giriş etməyə çalışır.
router.post("/sign-in", sessionController.create);
// Çıxış edir.
router.delete("/sign-out", requireAuth, sessionController.destroy);

module.exports = router;
