// Join table for users associated with projects.
module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "ProjectMember",
    {
      projectId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false
      }
    },
    {
      tableName: "project_members",
      indexes: [
        {
          unique: true,
          fields: ["projectId", "userId"]
        }
      ]
    }
  );
};
