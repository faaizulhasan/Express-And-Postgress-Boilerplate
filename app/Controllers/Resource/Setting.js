const _ = require("lodash")

class Setting {

    static async initResponse(data, request) {
        if (_.isEmpty(data))
            return data;

        let response;
        if (Array.isArray(data)) {
            response = []
            for (var i = 0; i < data.length; i++) {
                response.push(this.jsonSchema(data[i], request));
            }
        } else {
            response = this.jsonSchema(data, request)
        }
        return response;

    }


    static jsonSchema(record, request) {
        return {
            "title": record.title,
            "gst": record.gst,
            "platform_fee": record.platform_fee,
            "app_store_url": record.app_store_url,
            "play_store_url": record.play_store_url,
        }
    }
}

module.exports = Setting