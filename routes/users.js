const express = require("express");
const userController = require("../controllers/userController");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

// Bütün user-ləri yalnız admin görə bilər.
router.get("/", requireAuth, requireAdmin, userController.index);
// Yeni user yaratmaq formu.
router.get("/new", userController.newForm);
// User yaratmaq.
router.post("/", userController.create);
// Bir user-in profilini göstərmək.
router.get("/:id", requireAuth, userController.show);
// User silmək.
router.delete("/:id", requireAuth, userController.destroy);
// User-i admin etmək.
router.post("/:id/admin", requireAuth, requireAdmin, userController.setAdmin);
// User-dən admin səlahiyyətini almaq.
router.delete("/:id/admin", requireAuth, requireAdmin, userController.removeAdmin);

module.exports = router;
