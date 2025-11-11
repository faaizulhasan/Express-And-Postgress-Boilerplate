module.exports = {
    PASSWORD_SALT_ROUND: 6,
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRY: process.env.JWT_EXPIRY,
    CLIENT_ID: process.env.CLIENT_ID,
    BASE_URL: process.env.BASE_URL,
    FILE_SYSTEM: process.env.FILE_SYSTEM,

    MAIL_SYSTEM: process.env.MAIL_SYSTEM,
    MAIL_API_KEY: process.env.MAIL_API_KEY,
    MAIL_HOST: process.env.MAIL_HOST,
    MAIL_PORT: process.env.MAIL_PORT,
    MAIL_EMAIL: process.env.MAIL_EMAIL,
    MAIL_PASSWORD: process.env.MAIL_PASSWORD,
    MAIL_FROM: process.env.MAIL_FROM,
    EMAIL_VERIFICATION: 1,

    SMS_VERIFICATION: process.env.APP_ENV == "production" ? 1 : 0,

    PAGINATION_LIMIT: 20,
    LOOKUPS_ID: "de6683e5-9241-4ffc-9bf6-06d4cc614c37",
    STATIC_PAGE_ID: "c19c2f29-8e79-471c-b01d-e88d806bc0a7",

    USER_UPLOAD_DIRECTORY: 'user',

    NOTIFICATION_DRIVER: process.env.NOTIFICATION_DRIVER || "Firebase",
    SERVICE_ACCOUNT: {

    }
}