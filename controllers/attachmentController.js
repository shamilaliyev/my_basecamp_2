const fs = require("fs");
const path = require("path");
const multer = require("multer");
const db = require("../models");
const { findProjectForUser, userCanManageProject } = require("../utils/projectAccess");

const uploadFolder = path.join(__dirname, "..", "public", "uploads", "attachments");
fs.mkdirSync(uploadFolder, { recursive: true });

const allowedFormats = ["png", "jpg", "jpeg", "pdf", "txt"];

const storage = multer.diskStorage({
  destination(req, file, callback) {
    callback(null, uploadFolder);
  },
  filename(req, file, callback) {
    const extension = path.extname(file.originalname).toLowerCase();
    const safeBaseName = path
      .basename(file.originalname, extension)
      .replace(/[^a-z0-9]/gi, "-")
      .toLowerCase();
    const uniquePart = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;

    callback(null, `${safeBaseName}-${uniquePart}${extension}`);
  }
});

const multerUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(req, file, callback) {
    const extension = path.extname(file.originalname).replace(".", "").toLowerCase();

    if (!allowedFormats.includes(extension)) {
      return callback(new Error("Only png, jpg, pdf, and txt files are allowed."));
    }

    callback(null, true);
  }
}).single("attachment");

function deleteUploadedFile(fileName) {
  if (!fileName) return;
  fs.unlink(path.join(uploadFolder, fileName), () => {});
}

module.exports = {
  upload(req, res, next) {
    multerUpload(req, res, (error) => {
      if (error) {
        req.flash("danger", error.message);
        return res.redirect(`/projects/${req.params.projectId}`);
      }

      next();
    });
  },

  async create(req, res) {
    const project = await findProjectForUser(req.params.projectId, req.currentUser);

    if (!project) {
      if (req.file) deleteUploadedFile(req.file.filename);
      req.flash("danger", "Project not found or you do not have access.");
      return res.redirect("/projects");
    }

    if (!req.file) {
      req.flash("danger", "Please choose a file to upload.");
      return res.redirect(`/projects/${project.id}`);
    }

    const rawFormat = path.extname(req.file.originalname).replace(".", "").toLowerCase();
    const format = rawFormat === "jpeg" ? "jpg" : rawFormat;

    await db.Attachment.create({
      originalName: req.file.originalname,
      fileName: req.file.filename,
      format,
      mimeType: req.file.mimetype,
      size: req.file.size,
      projectId: project.id,
      userId: req.currentUser.id
    });

    req.flash("success", "Attachment uploaded successfully.");
    res.redirect(`/projects/${project.id}`);
  },

  async destroy(req, res) {
    const project = await findProjectForUser(req.params.projectId, req.currentUser);

    if (!project) {
      req.flash("danger", "Project not found or you do not have access.");
      return res.redirect("/projects");
    }

    const attachment = await db.Attachment.findOne({
      where: {
        id: req.params.attachmentId,
        projectId: project.id
      }
    });

    if (!attachment) {
      req.flash("danger", "Attachment not found.");
      return res.redirect(`/projects/${project.id}`);
    }

    const canDelete =
      userCanManageProject(req.currentUser, project) || attachment.userId === req.currentUser.id;

    if (!canDelete) {
      req.flash("danger", "You can delete only your own attachment.");
      return res.redirect(`/projects/${project.id}`);
    }

    deleteUploadedFile(attachment.fileName);
    await attachment.destroy();

    req.flash("success", "Attachment deleted successfully.");
    res.redirect(`/projects/${project.id}`);
  }
};
