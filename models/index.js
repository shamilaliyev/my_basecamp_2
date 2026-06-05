const sequelize = require("../config/database");
const { DataTypes } = require("sequelize");

const User = require("./user")(sequelize, DataTypes);
const Project = require("./project")(sequelize, DataTypes);
const ProjectMember = require("./projectMember")(sequelize, DataTypes);
const Attachment = require("./attachment")(sequelize, DataTypes);
const DiscussionThread = require("./thread")(sequelize, DataTypes);
const Message = require("./message")(sequelize, DataTypes);

User.hasMany(Project, {
  foreignKey: "ownerId",
  as: "projects",
  onDelete: "CASCADE"
});

Project.belongsTo(User, {
  foreignKey: "ownerId",
  as: "owner"
});

Project.belongsToMany(User, {
  through: ProjectMember,
  foreignKey: "projectId",
  otherKey: "userId",
  as: "members"
});

User.belongsToMany(Project, {
  through: ProjectMember,
  foreignKey: "userId",
  otherKey: "projectId",
  as: "memberProjects"
});

Project.hasMany(Attachment, {
  foreignKey: "projectId",
  as: "attachments",
  onDelete: "CASCADE"
});

Attachment.belongsTo(Project, {
  foreignKey: "projectId",
  as: "project"
});

User.hasMany(Attachment, {
  foreignKey: "userId",
  as: "attachments",
  onDelete: "CASCADE"
});

Attachment.belongsTo(User, {
  foreignKey: "userId",
  as: "uploader"
});

Project.hasMany(DiscussionThread, {
  foreignKey: "projectId",
  as: "threads",
  onDelete: "CASCADE"
});

DiscussionThread.belongsTo(Project, {
  foreignKey: "projectId",
  as: "project"
});

User.hasMany(DiscussionThread, {
  foreignKey: "userId",
  as: "createdThreads",
  onDelete: "CASCADE"
});

DiscussionThread.belongsTo(User, {
  foreignKey: "userId",
  as: "creator"
});

DiscussionThread.hasMany(Message, {
  foreignKey: "threadId",
  as: "messages",
  onDelete: "CASCADE"
});

Message.belongsTo(DiscussionThread, {
  foreignKey: "threadId",
  as: "thread"
});

User.hasMany(Message, {
  foreignKey: "userId",
  as: "messages",
  onDelete: "CASCADE"
});

Message.belongsTo(User, {
  foreignKey: "userId",
  as: "author"
});

module.exports = {
  sequelize,
  User,
  Project,
  ProjectMember,
  Attachment,
  DiscussionThread,
  Message
};
