// Bu da Project modelidir.
// Burada layihə cədvəlinin necə görünəcəyini deyirik.
module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "Project",
    {
      // Layihənin başlığı boş qala bilməz.
      title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: { msg: "Project title is required." }
        }
      },
      // Təsvir hissəsi uzun mətn ola bilər.
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: ""
      },
      // ownerId bu layihənin hansı user-ə aid olduğunu göstərir.
      ownerId: {
        type: DataTypes.INTEGER,
        allowNull: false
      }
    },
    {
      tableName: "projects"
    }
  );
};
