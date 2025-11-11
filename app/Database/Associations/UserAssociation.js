module.exports = (db) => {
    /**User Api Token Models Relationships Or Assosiaction */
    db.users.hasOne(db.user_api_tokens, { foreignKey: "user_id", sourceKey: 'id', as: "UserApiToken_Slug_Single" });
    db.users.hasMany(db.user_api_tokens, { foreignKey: "user_id", sourceKey: 'id' });
    db.user_api_tokens.belongsTo(db.users, {
        foreignKey: "user_id",
        targetKey: 'id'
    }, {
        onDelete: 'cascade',
        onUpdate: 'cascade'
    });



    /*User Groups Model Relation */
    db.user_groups.hasMany(db.users, { foreignKey: "user_type", sourceKey: 'type' });
    db.users.belongsTo(db.user_groups, {
        foreignKey: "user_type",
        targetKey: 'type'
    }, {
        onDelete: 'cascade',
        onUpdate: 'cascade'
    });

}