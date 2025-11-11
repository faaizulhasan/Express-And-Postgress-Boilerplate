const { USER_UPLOAD_DIRECTORY } = require("./constants")

const ROLES = {
    ADMIN: 'ADMIN',
    USER: 'USER',
}


const UPLOAD_DIRECTORY = {
    USER: "user",
}

const UPLOAD_DIRECTORY_MAPPING = {
    [UPLOAD_DIRECTORY.USER]: 'user',
}

const LOGIN_TYPE = {
    CUSTOM: "custom",
    GOOGLE: "google",
    APPLE: 'apple',
    FACEBOOK: 'facebook'
}

const API_TOKENS_ENUM = {
    ACCESS: "ACCESS",
    RESET: 'RESET'
}

const OTP_VERIFICATION_TYPE = {
    EMAIL: 'EMAIL',
    MOBILE_NO: 'MOBILE_NO'
}


const SETTING_ENUM = {
    PRIVACY_POLICY: 'privacy-policy',
    TERMS_AND_CONDITION: 'terms-and-condition'
}

const SETTING_MAPPING_ENUM = {
    'privacy-policy': SETTING_ENUM.PRIVACY_POLICY,
    'terms-and-condition': SETTING_ENUM.TERMS_AND_CONDITION,
}


const CHAT_ROOM_STATUS_ENUM = {
    PENDING: 'pending',
    ACCEPTED: 'accepted',
    REJECTED: 'rejected'
}

const MESSAGE_TYPE_ENUM = {
    TEXT: 'TEXT',
    FILE: 'FILE',
    BADGE: 'BADGE'
}
const CHAT_ROOM_TYPE_ENUM = {
    SINGLE: 'single',
    GROUP: 'group'
}
const NOTIFICATION_TYPES = {
    CHAT_MESSAGE: "chat_message",
    ADMIN_NOTIFICATION: "admin_notification"
}
module.exports = {
    ROLES,
    LOGIN_TYPE,
    API_TOKENS_ENUM,
    OTP_VERIFICATION_TYPE,
    UPLOAD_DIRECTORY,
    UPLOAD_DIRECTORY_MAPPING,
    SETTING_ENUM,
    SETTING_MAPPING_ENUM,
    CHAT_ROOM_STATUS_ENUM,
    MESSAGE_TYPE_ENUM,
    CHAT_ROOM_TYPE_ENUM,
    NOTIFICATION_TYPES
}