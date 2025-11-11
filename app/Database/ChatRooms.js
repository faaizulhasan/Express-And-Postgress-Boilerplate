module.exports = (sequelize, DataTypes) => {
    const User = require("./User.js")(sequelize, DataTypes);

    const ChatRooms = sequelize.define("chat_rooms", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: User, // ✅ reference model object, not the require() call
                key: "id",
            },
            onDelete: "CASCADE",
            onUpdate: "NO ACTION",
        },
        title: {
            type: DataTypes.STRING(150),
            allowNull: false,
        },
        image_url: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        description: {
            type: DataTypes.STRING(300),
            allowNull: true,
        },
        type: {
            type: DataTypes.STRING(50),
            allowNull: false,
        },
        status: {
            type: DataTypes.STRING(30),
            allowNull: true,
        },
        member_limit: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1024,
        },
        can_memberEditGroup: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
        can_memberSendMessage: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
        can_memberAddMember: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
        last_message_timestamp: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        is_admin: {
            type: DataTypes.BOOLEAN, // ✅ PostgreSQL uses BOOLEAN, not TINYINT(1)
            allowNull: false,
            defaultValue: false,
        },
        deletedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    }, {
        timestamps: true,
        paranoid: true,
        underscored: true,
        tableName: 'chat_rooms',
    });

    return ChatRooms;
};
