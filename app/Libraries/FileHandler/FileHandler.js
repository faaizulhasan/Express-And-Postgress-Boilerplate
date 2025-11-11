'use strict'
const { v4: uuidv4 } = require('uuid');
const _ = require('lodash');
const fs = require('fs');
const constants = require('../../config/constants');

class FileHandler {

    static async doUpload(fileObject, destination_upload_path = 'uploads/', resize = true) {
        let supportDrivers = ['local', 's3'];
        if (supportDrivers.indexOf(constants.FILE_SYSTEM) == -1) {
            throw new Error('File upload driver ' + process.env.FILESYSTEM + ' is not supported');
            return;
        }
        if (constants.FILE_SYSTEM == 'local') {
            return await this.uploadFileInLocal(fileObject, destination_upload_path, resize);
        } else {
            return await this.uploadFileInS3(fileObject, destination_upload_path, resize);
        }
    }

    static async uploadFileInLocal(fileObject, destination_upload_path, resize) {
        const original_destination_upload_path = "uploads/" + destination_upload_path+"/";
        if (!fs.existsSync(original_destination_upload_path)) {
            fs.mkdirSync(original_destination_upload_path, { recursive: true });
        }
        if (!Array.isArray(fileObject)) {
            const subtype = fileObject.mimetype.split('/')
            let filename = `${uuidv4()}.${subtype[subtype.length - 1]}`;
            fs.writeFileSync(original_destination_upload_path + filename, fileObject.buffer);

            return destination_upload_path+"/"+filename;
        } else {
            //multiple file upload
            let file_data = [];
            let files = fileObject;
            for (var i = 0; i < files.length; i++) {
                const subtype = files[i].mimetype.split('/')
                let filename = `${uuidv4()}.${subtype[subtype.length - 1]}`;
                fs.writeFileSync(original_destination_upload_path + filename, files[i].buffer);

                file_data.push(destination_upload_path+"/"+filename);
            }
            return file_data;
        }


    }

    static async makeDirectory(dir = '') {
        if (!dir) return;
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }
}
module.exports = FileHandler
