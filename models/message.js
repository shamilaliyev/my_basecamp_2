// Message model stores messages written inside a discussion thread.
module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "Message",
    {
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notEmpty: { msg: "Message cannot be empty." }
        }
      },
      threadId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false
      }
    },
    {
      tableName: "messages"
    }
  );
};
