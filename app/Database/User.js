const { LOGIN_TYPE } = require("../config/enum.js");

module.exports = (sequelize, Sequelize) => {

    const User = sequelize.define("users", {
        id: {
            type: Sequelize.INTEGER.UNSIGNED,
            primaryKey: true,
            autoIncrement: true
        },
        user_type: {
            type: Sequelize.STRING(50),
            allowNull: false,
            references: {
                model: require("./UserGroups.js")(sequelize, Sequelize),
                key: 'type'
            },
        },
        name: {
            type: Sequelize.STRING(200),
            allowNull: true
        },
        username: {
            type: Sequelize.STRING(100),
            allowNull: true
        },
        firstname: {
            type: Sequelize.STRING(100),
            allowNull: true
        },
        lastname: {
            type: Sequelize.STRING(100),
            allowNull: true
        },
        email: {
            type: Sequelize.STRING(100),
            allowNull: true,
        },
        mobile_no: {
            type: Sequelize.STRING(15),
            allowNull: true,
        },
        password: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        image_url: {
            type: Sequelize.STRING,
            allowNull: true,
        },
        status: {
            type: Sequelize.BOOLEAN,
            defaultValue: true,

        },
        is_email_verify: {
            type: Sequelize.BOOLEAN,
            defaultValue: false,

        },
        email_verifyAt: {
            type: Sequelize.DATE,
            allowNull: true
        },
        is_mobile_verify: {
            type: Sequelize.BOOLEAN,
            defaultValue: false,

        },
        mobile_verifyAt: {
            type: Sequelize.DATE,
            allowNull: true
        },
        login_type: {
            type: Sequelize.STRING(30),
            defaultValue: LOGIN_TYPE.CUSTOM,
            allowNull: true,
        },
        platform_type: {
            type: Sequelize.STRING(100),
            allowNull: true,
        },
        platform_id: {
            type: Sequelize.TEXT,
            allowNull: true,
        },
        is_activated: {
            type: Sequelize.BOOLEAN,
            defaultValue: true,
        },
        is_blocked: {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
        },
        push_notification: {
            type: Sequelize.BOOLEAN,
            defaultValue: true,
        },
        deletedAt: {
            type: Sequelize.DATE,
            allowNull: true
        }
    });

    return User;
}
