const db = require("../models");

function userCanManageProject(user, project) {
  return Boolean(user && project && (user.isAdmin || user.id === project.ownerId));
}

async function userCanUseProject(user, project) {
  if (!user || !project) return false;
  if (userCanManageProject(user, project)) return true;

  const membership = await db.ProjectMember.findOne({
    where: {
      projectId: project.id,
      userId: user.id
    }
  });

  return Boolean(membership);
}

async function findProjectForUser(projectId, user, include = []) {
  const project = await db.Project.findByPk(projectId, { include });

  if (!project) {
    return null;
  }

  const canUse = await userCanUseProject(user, project);
  return canUse ? project : null;
}

module.exports = {
  userCanManageProject,
  userCanUseProject,
  findProjectForUser
};
