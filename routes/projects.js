const express = require("express");
const projectController = require("../controllers/projectController");
const attachmentController = require("../controllers/attachmentController");
const threadController = require("../controllers/threadController");
const messageController = require("../controllers/messageController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth);

router.get("/", projectController.index);
router.get("/new", projectController.newForm);
router.post("/", projectController.create);

router.post("/:projectId/members", projectController.addMember);
router.delete("/:projectId/members/:userId", projectController.removeMember);

router.post(
  "/:projectId/attachments",
  attachmentController.upload,
  attachmentController.create
);
router.delete(
  "/:projectId/attachments/:attachmentId",
  attachmentController.destroy
);

router.get("/:projectId/threads/new", threadController.newForm);
router.post("/:projectId/threads", threadController.create);
router.get("/:projectId/threads/:threadId", threadController.show);
router.get("/:projectId/threads/:threadId/edit", threadController.editForm);
router.put("/:projectId/threads/:threadId", threadController.update);
router.delete("/:projectId/threads/:threadId", threadController.destroy);

router.post("/:projectId/threads/:threadId/messages", messageController.create);
router.get(
  "/:projectId/threads/:threadId/messages/:messageId/edit",
  messageController.editForm
);
router.put(
  "/:projectId/threads/:threadId/messages/:messageId",
  messageController.update
);
router.delete(
  "/:projectId/threads/:threadId/messages/:messageId",
  messageController.destroy
);

router.get("/:id", projectController.show);
router.get("/:id/edit", projectController.editForm);
router.put("/:id", projectController.update);
router.delete("/:id", projectController.destroy);

module.exports = router;
