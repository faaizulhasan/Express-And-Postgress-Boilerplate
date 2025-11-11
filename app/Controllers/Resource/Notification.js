const _ = require("lodash");
const { getImageUrl } = require("../../Helper");
class Notification {
    static async initResponse(data, request) {
        if (_.isEmpty(data)) return Array.isArray(data) ? [] : {};

        let response;
        if (Array.isArray(data)) {
            response = [];
            for (var i = 0; i < data.length; i++) {
                response.push(this.jsonSchema(data[i], request));
            }
        } else {
            response = this.jsonSchema(data, request);
        }
        return response;
    }

    static jsonSchema(record, request) {
        return {
            id: record.id,
            user_id: record.user_id,
            type: record.type,
            title: record.title,
            message: record.message,
            image_url: record.image_url ? getImageUrl(record.image_url) : null,
            payload: record?.payload ? JSON.parse(record?.payload) : record?.payload,
            is_read: record.is_read,
            created_at: record.createdAt
        };
    }
}

module.exports = Notification;
