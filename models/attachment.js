// Attachment model stores files uploaded inside a project.
module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "Attachment",
    {
      originalName: {
        type: DataTypes.STRING,
        allowNull: false
      },
      fileName: {
        type: DataTypes.STRING,
        allowNull: false
      },
      format: {
        type: DataTypes.STRING,
        allowNull: false
      },
      mimeType: {
        type: DataTypes.STRING,
        allowNull: false
      },
      size: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
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
      tableName: "attachments"
    }
  );
};
