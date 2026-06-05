// Thread model is used for project discussions.
module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "DiscussionThread",
    {
      title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: { msg: "Thread title is required." }
        }
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: ""
      },
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
      tableName: "threads"
    }
  );
};
