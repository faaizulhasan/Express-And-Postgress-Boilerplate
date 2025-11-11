const Validator = require('validatorjs');
const bcrypt = require("bcrypt")
const config = require("../config/constants");
const { UPLOAD_DIRECTORY, UPLOAD_DIRECTORY_MAPPING } = require('../config/enum');

const baseUrl = () => {
    return config.BASE_URL || "http://localhost:3000"
}


const getUserDirectory = () => {
    return 'uploads/' + UPLOAD_DIRECTORY.USER + '/';
}
const getUploadDirectoryPath = (module) => {
    return 'uploads/' + module + '/';
}
const isJSON = (str) => {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}


const extractFields = (obj, fields) => {
    const result = {};
    for (const field of fields) {
        if (field in obj) {
            result[field] = obj[field];
        }
    }
    return result;
}

const validateAll = async (body, rules, customMessages) => {
    const validation = new Validator(body, rules, customMessages);
    return validation
};
const validateAsync = async (body, rules, customMessages) => {

    try {

        const validation = new Validator(body, rules, customMessages);
        let passes = () => { };
        let fails = () => { };

        const promise = new Promise((resolve) => {
            passes = () => { resolve(true); };
            fails = () => { resolve(false); };
        });

        validation.checkAsync(passes, fails);

        const result = await promise;

        if (result === false) {
            const message = validation.errors.all();
            throw message
        }


        validation.fails = () => false;
        return validation
    }
    catch (err) {

        let obj = {
            errors: {
                errors: err
            },
            fails: () => true
        };

        return obj
    }



}

const generateHash = (text) => {
    console.log("Generating hash : ", text)
    return bcrypt.hashSync(text, config.PASSWORD_SALT_ROUND);

}

const generateOTP = () => {
    return `${Math.floor(100000 + Math.random() * 900000)}`
}

const compareHash = (password, hash) => {
    console.log(bcrypt.compareSync(password, hash))
    return bcrypt.compareSync(password, hash);
}


const getImageUrl = (image_url, type) => {
    let images;
    if (type === "Array") {
        images = [];
        if (image_url != null && image_url != '') {
            const urls = image_url.split(",");
            for (let i = 0; i < urls.length; i++) {
                const img = urls[i];
                if (img.startsWith('http')) {
                    images.push(img)
                } else {
                    images.push(baseUrl() + img);
                }
            }
        } else {
            images.push(baseUrl() + 'user-placeholder.jpeg')
        }
    }
    else {
        if (image_url != null && image_url != '') {
            if (image_url.startsWith('http')) {
                images = image_url;
            } else {
                images = baseUrl() + image_url;
            }
        }
        else {
            images = baseUrl() + 'user-placeholder.jpeg'
        }
    }
    return images
}

const getUserImageUrl = (image_url, type) => {
    let images;
    if (type === "Array") {
        images = [];
        if (image_url != null && image_url != '') {
            const urls = image_url.split(",");
            for (let i = 0; i < urls.length; i++) {
                const img = urls[i];
                if (img.startsWith('http')) {
                    images.push(img)
                } else {
                    images.push(baseUrl() + UPLOAD_DIRECTORY_MAPPING[UPLOAD_DIRECTORY.USER] + "/" + img);
                }
            }
        } else {
            images.push(baseUrl() + UPLOAD_DIRECTORY_MAPPING[UPLOAD_DIRECTORY.USER] + '/user-placeholder.jpeg')
        }
    }
    else {
        if (image_url != null && image_url != '') {
            if (image_url.startsWith('http')) {
                images = image_url;
            } else {
                images = baseUrl() + UPLOAD_DIRECTORY_MAPPING[UPLOAD_DIRECTORY.USER] + "/" + image_url;
            }
        }
        else {
            images = baseUrl() + UPLOAD_DIRECTORY_MAPPING[UPLOAD_DIRECTORY.USER] + '/user-placeholder.jpeg'
        }
    }
    return images
}


const removeBaseUrl = (text = "") => {
    if (Array.isArray(text)) {
        return text.map((item) => item.replace(baseUrl(), ""));
    } else {
        return text.replace(baseUrl(), "");
    }
};
const getFileUrl = (image_url) => {
    if (image_url != null && image_url != '') {
        if (image_url.startsWith('http')) {
            image_url = image_url;
        } else {
            image_url = baseUrl() + image_url;
        }
    }
    return image_url;
}

module.exports = {
    baseUrl,
    getUserDirectory,
    isJSON,
    extractFields,
    validateAll,
    generateHash,
    generateOTP,
    validateAsync,
    compareHash,
    getImageUrl,
    getUserImageUrl,
    getUploadDirectoryPath,
    removeBaseUrl,
    getFileUrl
}
