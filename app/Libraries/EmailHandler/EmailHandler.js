const { baseUrl } = require("../../Helper");
const constants = require("../../config/constants");
const Transporter = require("./Transporter");


class EmailHandler extends Transporter {

    constructor() {
        super();
    }

    async forgotPassword(email, token) {

        const link = baseUrl() + 'web/reset-password/' + token

        let mailOptions = {
            from: constants.MAIL_FROM,
            to: email,
            subject: 'Reset Password Link!',
            html: `<a href="${link}">${link}</a>`
        }

        const mail = await this.sendMail(mailOptions);

        return true


    }

    async sendOTL(email, token) {
        const link = baseUrl() + 'api/one-time-login/' + token
        let mailOptions = {
            from: constants.MAIL_FROM,
            to: email,
            subject: 'One Time Login Credentials!',
            html: `<a href="${link}">${link}</a>`
        }
        const mail = await this.sendMail(mailOptions);
        return true

    }

    async sendOTP(email, otp) {
        let mailOptions = {
            from: constants.MAIL_FROM,
            to: email,
            subject: 'YOUR OTP Code:',
            html: `<p>Your OTP Code is : ${otp}</p>`
        }

        const mail = await this.sendMail(mailOptions);
        return true


    }

    async sendInviteLink(email, url, username) {
        let mailOptions = {
            from: constants.MAIL_FROM,
            to: email,
            subject: 'Invite link',
            html: `<p>${username} is inviting you to download Kansensus. Sign up now, explore this amazing app, and start earning points!.<br />${url}</p>`
        }

        const mail = await this.sendMail(mailOptions);
        return true


    }




}


module.exports = new EmailHandler()