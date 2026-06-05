const fs = require("fs");
const path = require("path");
const { Op } = require("sequelize");
const db = require("../models");
const { userCanManageProject, findProjectForUser } = require("../utils/projectAccess");

const uploadsFolder = path.join(__dirname, "..", "public", "uploads", "attachments");

function getValidationMessage(error) {
  return error.errors && error.errors.length > 0 ? error.errors[0].message : error.message;
}

function deleteAttachmentFile(fileName) {
  if (!fileName) return;
  const filePath = path.join(uploadsFolder, fileName);

  fs.unlink(filePath, () => {
    // If the file is already missing, the database record can still be deleted.
  });
}

module.exports = {
  async index(req, res) {
    let projects;

    if (req.currentUser.isAdmin) {
      projects = await db.Project.findAll({
        include: [{ model: db.User, as: "owner" }],
        order: [["createdAt", "DESC"]]
      });
    } else {
      const ownedProjects = await db.Project.findAll({
        where: { ownerId: req.currentUser.id },
        include: [{ model: db.User, as: "owner" }]
      });

      const memberProjects = await db.Project.findAll({
        where: { ownerId: { [Op.ne]: req.currentUser.id } },
        include: [
          { model: db.User, as: "owner" },
          {
            model: db.User,
            as: "members",
            where: { id: req.currentUser.id },
            through: { attributes: [] }
          }
        ]
      });

      const uniqueProjects = new Map();
      [...ownedProjects, ...memberProjects].forEach((project) => {
        uniqueProjects.set(project.id, project);
      });

      projects = Array.from(uniqueProjects.values()).sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
    }

    res.render("projects/index", {
      pageTitle: "Projects",
      projects
    });
  },

  newForm(req, res) {
    res.render("projects/new", { pageTitle: "New Project" });
  },

  async create(req, res) {
    const { title, description } = req.body;

    try {
      const project = await db.Project.create({
        title,
        description,
        ownerId: req.currentUser.id
      });

      req.flash("success", "Project created successfully.");
      res.redirect(`/projects/${project.id}`);
    } catch (error) {
      req.flash("danger", getValidationMessage(error));
      res.redirect("/projects/new");
    }
  },

  async show(req, res) {
    const project = await findProjectForUser(req.params.id, req.currentUser, [
      { model: db.User, as: "owner" },
      {
        model: db.User,
        as: "members",
        through: { attributes: [] }
      },
      {
        model: db.Attachment,
        as: "attachments",
        include: [{ model: db.User, as: "uploader" }]
      },
      {
        model: db.DiscussionThread,
        as: "threads",
        include: [
          { model: db.User, as: "creator" },
          { model: db.Message, as: "messages" }
        ]
      }
    ]);

    if (!project) {
      req.flash("danger", "Project not found or you do not have access.");
      return res.redirect("/projects");
    }

    project.attachments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    project.threads.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const canManageProject = userCanManageProject(req.currentUser, project);
    const memberIds = project.members.map((member) => member.id);
    const unavailableIds = [project.ownerId, ...memberIds];
    const availableUsers = canManageProject
      ? await db.User.findAll({
          where: { id: { [Op.notIn]: unavailableIds } },
          order: [["name", "ASC"]]
        })
      : [];

    res.render("projects/show", {
      pageTitle: project.title,
      project,
      canManageProject,
      availableUsers
    });
  },

  async editForm(req, res) {
    const project = await db.Project.findByPk(req.params.id);

    if (!project) {
      req.flash("danger", "Project not found.");
      return res.redirect("/projects");
    }

    if (!userCanManageProject(req.currentUser, project)) {
      req.flash("danger", "You cannot edit that project.");
      return res.redirect("/projects");
    }

    res.render("projects/edit", {
      pageTitle: `Edit ${project.title}`,
      project
    });
  },

  async update(req, res) {
    const project = await db.Project.findByPk(req.params.id);

    if (!project) {
      req.flash("danger", "Project not found.");
      return res.redirect("/projects");
    }

    if (!userCanManageProject(req.currentUser, project)) {
      req.flash("danger", "You cannot update that project.");
      return res.redirect("/projects");
    }

    try {
      project.title = req.body.title;
      project.description = req.body.description;
      await project.save();

      req.flash("success", "Project updated successfully.");
      res.redirect(`/projects/${project.id}`);
    } catch (error) {
      req.flash("danger", getValidationMessage(error));
      res.redirect(`/projects/${project.id}/edit`);
    }
  },

  async destroy(req, res) {
    const project = await db.Project.findByPk(req.params.id, {
      include: [{ model: db.Attachment, as: "attachments" }]
    });

    if (!project) {
      req.flash("danger", "Project not found.");
      return res.redirect("/projects");
    }

    if (!userCanManageProject(req.currentUser, project)) {
      req.flash("danger", "You cannot delete that project.");
      return res.redirect("/projects");
    }

    project.attachments.forEach((attachment) => deleteAttachmentFile(attachment.fileName));
    await project.destroy();
    req.flash("success", "Project deleted successfully.");
    res.redirect("/projects");
  },

  async addMember(req, res) {
    const project = await db.Project.findByPk(req.params.projectId);

    if (!project) {
      req.flash("danger", "Project not found.");
      return res.redirect("/projects");
    }

    if (!userCanManageProject(req.currentUser, project)) {
      req.flash("danger", "Only the project admin can add members.");
      return res.redirect(`/projects/${project.id}`);
    }

    const userId = Number(req.body.userId);

    if (!userId || userId === project.ownerId) {
      req.flash("danger", "Please choose a valid user.");
      return res.redirect(`/projects/${project.id}`);
    }

    const user = await db.User.findByPk(userId);

    if (!user) {
      req.flash("danger", "User not found.");
      return res.redirect(`/projects/${project.id}`);
    }

    await db.ProjectMember.findOrCreate({
      where: {
        projectId: project.id,
        userId: user.id
      }
    });

    req.flash("success", `${user.name} was added to the project.`);
    res.redirect(`/projects/${project.id}`);
  },

  async removeMember(req, res) {
    const project = await db.Project.findByPk(req.params.projectId);

    if (!project) {
      req.flash("danger", "Project not found.");
      return res.redirect("/projects");
    }

    if (!userCanManageProject(req.currentUser, project)) {
      req.flash("danger", "Only the project admin can remove members.");
      return res.redirect(`/projects/${project.id}`);
    }

    await db.ProjectMember.destroy({
      where: {
        projectId: project.id,
        userId: req.params.userId
      }
    });

    req.flash("success", "Member removed from project.");
    res.redirect(`/projects/${project.id}`);
  }
};
