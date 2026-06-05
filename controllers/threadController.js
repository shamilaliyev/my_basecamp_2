const db = require("../models");
const { findProjectForUser, userCanManageProject } = require("../utils/projectAccess");

function getValidationMessage(error) {
  return error.errors && error.errors.length > 0 ? error.errors[0].message : error.message;
}

async function findThread(projectId, threadId) {
  return db.DiscussionThread.findOne({
    where: {
      id: threadId,
      projectId
    }
  });
}

module.exports = {
  async newForm(req, res) {
    const project = await findProjectForUser(req.params.projectId, req.currentUser, [
      { model: db.User, as: "owner" }
    ]);

    if (!project) {
      req.flash("danger", "Project not found or you do not have access.");
      return res.redirect("/projects");
    }

    if (!userCanManageProject(req.currentUser, project)) {
      req.flash("danger", "Only the project admin can create a thread.");
      return res.redirect(`/projects/${project.id}`);
    }

    res.render("threads/new", {
      pageTitle: "New Thread",
      project
    });
  },

  async create(req, res) {
    const project = await findProjectForUser(req.params.projectId, req.currentUser);

    if (!project) {
      req.flash("danger", "Project not found or you do not have access.");
      return res.redirect("/projects");
    }

    if (!userCanManageProject(req.currentUser, project)) {
      req.flash("danger", "Only the project admin can create a thread.");
      return res.redirect(`/projects/${project.id}`);
    }

    try {
      const thread = await db.DiscussionThread.create({
        title: req.body.title,
        description: req.body.description,
        projectId: project.id,
        userId: req.currentUser.id
      });

      req.flash("success", "Thread created successfully.");
      res.redirect(`/projects/${project.id}/threads/${thread.id}`);
    } catch (error) {
      req.flash("danger", getValidationMessage(error));
      res.redirect(`/projects/${project.id}/threads/new`);
    }
  },

  async show(req, res) {
    const project = await findProjectForUser(req.params.projectId, req.currentUser, [
      { model: db.User, as: "owner" },
      { model: db.User, as: "members", through: { attributes: [] } }
    ]);

    if (!project) {
      req.flash("danger", "Project not found or you do not have access.");
      return res.redirect("/projects");
    }

    const thread = await db.DiscussionThread.findOne({
      where: {
        id: req.params.threadId,
        projectId: project.id
      },
      include: [
        { model: db.User, as: "creator" },
        {
          model: db.Message,
          as: "messages",
          include: [{ model: db.User, as: "author" }]
        }
      ],
      order: [[{ model: db.Message, as: "messages" }, "createdAt", "ASC"]]
    });

    if (!thread) {
      req.flash("danger", "Thread not found.");
      return res.redirect(`/projects/${project.id}`);
    }

    res.render("threads/show", {
      pageTitle: thread.title,
      project,
      thread,
      canManageProject: userCanManageProject(req.currentUser, project)
    });
  },

  async editForm(req, res) {
    const project = await findProjectForUser(req.params.projectId, req.currentUser);

    if (!project) {
      req.flash("danger", "Project not found or you do not have access.");
      return res.redirect("/projects");
    }

    if (!userCanManageProject(req.currentUser, project)) {
      req.flash("danger", "Only the project admin can edit a thread.");
      return res.redirect(`/projects/${project.id}`);
    }

    const thread = await findThread(project.id, req.params.threadId);

    if (!thread) {
      req.flash("danger", "Thread not found.");
      return res.redirect(`/projects/${project.id}`);
    }

    res.render("threads/edit", {
      pageTitle: `Edit ${thread.title}`,
      project,
      thread
    });
  },

  async update(req, res) {
    const project = await findProjectForUser(req.params.projectId, req.currentUser);

    if (!project) {
      req.flash("danger", "Project not found or you do not have access.");
      return res.redirect("/projects");
    }

    if (!userCanManageProject(req.currentUser, project)) {
      req.flash("danger", "Only the project admin can update a thread.");
      return res.redirect(`/projects/${project.id}`);
    }

    const thread = await findThread(project.id, req.params.threadId);

    if (!thread) {
      req.flash("danger", "Thread not found.");
      return res.redirect(`/projects/${project.id}`);
    }

    try {
      thread.title = req.body.title;
      thread.description = req.body.description;
      await thread.save();

      req.flash("success", "Thread updated successfully.");
      res.redirect(`/projects/${project.id}/threads/${thread.id}`);
    } catch (error) {
      req.flash("danger", getValidationMessage(error));
      res.redirect(`/projects/${project.id}/threads/${thread.id}/edit`);
    }
  },

  async destroy(req, res) {
    const project = await findProjectForUser(req.params.projectId, req.currentUser);

    if (!project) {
      req.flash("danger", "Project not found or you do not have access.");
      return res.redirect("/projects");
    }

    if (!userCanManageProject(req.currentUser, project)) {
      req.flash("danger", "Only the project admin can delete a thread.");
      return res.redirect(`/projects/${project.id}`);
    }

    const thread = await findThread(project.id, req.params.threadId);

    if (!thread) {
      req.flash("danger", "Thread not found.");
      return res.redirect(`/projects/${project.id}`);
    }

    await thread.destroy();
    req.flash("success", "Thread deleted successfully.");
    res.redirect(`/projects/${project.id}`);
  }
};
