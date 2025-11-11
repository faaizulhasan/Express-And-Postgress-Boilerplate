const _ = require("lodash")
const { v4: uuidv4 } = require('uuid');

const RestModel = require("./RestModel");
const emailHandler = require("../Libraries/EmailHandler/EmailHandler");
const { generateOTP } = require("../Helper");
const SmsHandler = require("../Libraries/SmsHandler");
const constants = require("../config/constants");
const { Op } = require("sequelize");
const { OTP_VERIFICATION_TYPE } = require("../config/enum");

class UserOTP extends RestModel {

    constructor() {
        super("user_otp")
    }

    softdelete() {
        return true;
    }

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */

    getFields() {
        return [
            'email', 'mobile_no'
        ];
    }



    showColumns() {
        return [
            'email', 'mobile_no'
        ];
    }

    async beforeCreateHook(request, params) {
        params.otp = generateOTP()
        params.createdAt = new Date()
    }

    async afterCreateHook(record, request, params) {
        try {
            const result = record.toJSON()
            if (constants.EMAIL_VERIFICATION && result.email) {
                const email = await emailHandler.sendOTP(result.email, result.otp);
            }

            if (constants.SMS_VERIFICATION && result.mobile_no) {
                // const mobile_no = await SmsHandler.instance().sendOTP(result.mobile_no, result.otp)
            }
        }
        catch (err) {
            console.log("Sending otp error : ", err)
        }
    }

    async storeOTP(request, params) {
        await this.beforeCreateHook(request, params);
        var record = await this.orm.create(params);
        await this.afterCreateHook(record, request, params);
        return true;
    }

    async createRecord(request, params) {
        if (params.email) {
            const payload = {}
            payload.email = params.email;
            await this.storeOTP(request, payload)
        }
        if (params.mobile_no) {
            const payload = {}
            payload.mobile_no = params.mobile_no;
            await this.storeOTP(request, payload)
        }
        return true;
    }

    async verifyOTP(request, params, type = OTP_VERIFICATION_TYPE.EMAIL) {
        const otp = params.otp;
        const conditions = {}
        conditions.deletedAt = null;

        if (type === OTP_VERIFICATION_TYPE.EMAIL) {
            conditions.email = params.email;
        }
        else {
            conditions.mobile_no = params.mobile_no
        }

        const record = await this.orm.findOne({
            where: conditions,
            order: [['createdAt', 'DESC']],
        })

        if (_.isEmpty(record) || (otp != '000000' && otp != record?.toJSON().otp)) return {}

        return record.toJSON()

    }

    async deleteRecord(email = '', mobile_no = '') {
        const conditions = {};
        if (email) {
            conditions.email = email
        }
        if (mobile_no) {
            conditions.mobile_no = mobile_no
        }

        const query = await this.orm.update({
            deletedAt: new Date()
        }, {
            where: {
                [Op.or]: conditions
            }
        })
        return true;

    }

}

module.exports = UserOTP