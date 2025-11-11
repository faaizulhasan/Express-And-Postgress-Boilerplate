module.exports = (sequelize, DataTypes) => {
    const AppUpdate = sequelize.define('app_updates', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        android_version: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        ios_version: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        force_update: {
            type: DataTypes.BOOLEAN,
            defaultValue: false, // ✅ use boolean, not 0/1
            allowNull: false
        },
        createdAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            allowNull: false
        },
        updatedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            allowNull: false
        },
        deletedAt: {
            type: DataTypes.DATE,
            allowNull: true
        }
    }, {
        timestamps: true,
        paranoid: true,
        tableName: 'app_updates',
        underscored: true
    });

    return AppUpdate;
};
