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

async function findMessage(threadId, messageId) {
  return db.Message.findOne({
    where: {
      id: messageId,
      threadId
    },
    include: [{ model: db.User, as: "author" }]
  });
}

function canChangeMessage(user, project, message) {
  return userCanManageProject(user, project) || message.userId === user.id;
}

module.exports = {
  async create(req, res) {
    const project = await findProjectForUser(req.params.projectId, req.currentUser);

    if (!project) {
      req.flash("danger", "Project not found or you do not have access.");
      return res.redirect("/projects");
    }

    const thread = await findThread(project.id, req.params.threadId);

    if (!thread) {
      req.flash("danger", "Thread not found.");
      return res.redirect(`/projects/${project.id}`);
    }

    try {
      await db.Message.create({
        content: req.body.content,
        threadId: thread.id,
        userId: req.currentUser.id
      });

      req.flash("success", "Message posted successfully.");
      res.redirect(`/projects/${project.id}/threads/${thread.id}`);
    } catch (error) {
      req.flash("danger", getValidationMessage(error));
      res.redirect(`/projects/${project.id}/threads/${thread.id}`);
    }
  },

  async editForm(req, res) {
    const project = await findProjectForUser(req.params.projectId, req.currentUser);

    if (!project) {
      req.flash("danger", "Project not found or you do not have access.");
      return res.redirect("/projects");
    }

    const thread = await findThread(project.id, req.params.threadId);

    if (!thread) {
      req.flash("danger", "Thread not found.");
      return res.redirect(`/projects/${project.id}`);
    }

    const message = await findMessage(thread.id, req.params.messageId);

    if (!message) {
      req.flash("danger", "Message not found.");
      return res.redirect(`/projects/${project.id}/threads/${thread.id}`);
    }

    if (!canChangeMessage(req.currentUser, project, message)) {
      req.flash("danger", "You can edit only your own message.");
      return res.redirect(`/projects/${project.id}/threads/${thread.id}`);
    }

    res.render("messages/edit", {
      pageTitle: "Edit Message",
      project,
      thread,
      message
    });
  },

  async update(req, res) {
    const project = await findProjectForUser(req.params.projectId, req.currentUser);

    if (!project) {
      req.flash("danger", "Project not found or you do not have access.");
      return res.redirect("/projects");
    }

    const thread = await findThread(project.id, req.params.threadId);

    if (!thread) {
      req.flash("danger", "Thread not found.");
      return res.redirect(`/projects/${project.id}`);
    }

    const message = await findMessage(thread.id, req.params.messageId);

    if (!message) {
      req.flash("danger", "Message not found.");
      return res.redirect(`/projects/${project.id}/threads/${thread.id}`);
    }

    if (!canChangeMessage(req.currentUser, project, message)) {
      req.flash("danger", "You can edit only your own message.");
      return res.redirect(`/projects/${project.id}/threads/${thread.id}`);
    }

    try {
      message.content = req.body.content;
      await message.save();

      req.flash("success", "Message updated successfully.");
      res.redirect(`/projects/${project.id}/threads/${thread.id}`);
    } catch (error) {
      req.flash("danger", getValidationMessage(error));
      res.redirect(`/projects/${project.id}/threads/${thread.id}/messages/${message.id}/edit`);
    }
  },

  async destroy(req, res) {
    const project = await findProjectForUser(req.params.projectId, req.currentUser);

    if (!project) {
      req.flash("danger", "Project not found or you do not have access.");
      return res.redirect("/projects");
    }

    const thread = await findThread(project.id, req.params.threadId);

    if (!thread) {
      req.flash("danger", "Thread not found.");
      return res.redirect(`/projects/${project.id}`);
    }

    const message = await findMessage(thread.id, req.params.messageId);

    if (!message) {
      req.flash("danger", "Message not found.");
      return res.redirect(`/projects/${project.id}/threads/${thread.id}`);
    }

    if (!canChangeMessage(req.currentUser, project, message)) {
      req.flash("danger", "You can delete only your own message.");
      return res.redirect(`/projects/${project.id}/threads/${thread.id}`);
    }

    await message.destroy();
    req.flash("success", "Message deleted successfully.");
    res.redirect(`/projects/${project.id}/threads/${thread.id}`);
  }
};
