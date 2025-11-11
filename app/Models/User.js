const { v4: uuidv4 } = require('uuid');
const _ = require("lodash")
const randomstring = require("randomstring");
const moment = require("moment")

const { generateHash } = require("../Helper");
const RestModel = require("./RestModel")
const ResetPassword = require("./ResetPassword")
const emailHandler = require("../Libraries/EmailHandler/EmailHandler");
const { LOGIN_TYPE, API_TOKENS_ENUM, ROLES } = require('../config/enum');
const constants = require('../config/constants');
const { Sequelize } = require('../Database');
const {Op} = require("sequelize");


class User extends RestModel {

    constructor() {
        super("users")
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
            'firstname', 'lastname', 'name', 'username', 'email', 'mobile_no', 'password',
            'image_url', 'is_mobile_verify', 'mobile_verifyAt', 'is_email_verify', 'email_verifyAt',
            'status', 'is_activated', 'is_blocked', 'login_type', 'platform_type', 'platform_id',
            'createdAt', 'updatedAt', 'deletedAt'
        ];
    }


    showColumns() {
        return [
            'id', 'user_type', 'firstname', 'lastname', 'name', 'username',
            'email', 'mobile_no', 'image_url', 'is_mobile_verify', 'mobile_verifyAt', 'is_email_verify', 'email_verifyAt',
            'status', 'is_activated', 'login_type', 'platform_type', 'platform_id',
            'is_blocked', 'createdAt'
        ];
    }

    /**
     * omit fields from update request
     */
    exceptUpdateField() {
        return [
            'id', 'user_type',
            'email', 'mobile_no', 'is_email_verify', 'email_verifyAt', 'is_mobile_verify', 'mobile_verifyAt',
            'login_type', 'platform_type', 'platform_id',
            'createdAt'
        ];
    }

    /**
     * Hook for manipulate query of index result
     * @param {current mongo query} query
     * @param {adonis request object} request
     * @param {object} id
     */
    async indexQueryHook(query, request, id = {}) {
        query.where = {
            user_type: ROLES.USER,
            deletedAt: null
        }
        if (request.query.search){
            const searchQuery = request?.query?.search
            query.where = {
                ...query.where,
                [Op.or]: [
                    { firstname: { [Op.like]: `%${searchQuery}%` } },
                    { lastname: { [Op.like]: `%${searchQuery}%` } },
                    { name: { [Op.like]: `%${searchQuery}%` } },
                    { email: { [Op.like]: `%${searchQuery}%` } }
                ]
            }
        }
    }

    /**
     * Hook for manipulate data input before add data is execute
     * @param {adonis request object} request
     * @param {payload object} params
     */
    async beforeCreateHook(request, params) {
        params.user_type = ROLES.USER;
        params.username = params.name;
        params.password = generateHash(params.password)
        params.login_type = LOGIN_TYPE.CUSTOM
        params.platform_type = LOGIN_TYPE.CUSTOM
        params.platform_id = null
        params.createdAt = new Date();
    }

    /**
     * Hook for execute command after add public static function called
     * @param {saved record object} record
     * @param {controller request object} request
     * @param {payload object} params
     */
    async afterCreateHook(record, request, params) {
        const otp_record = {};
        if ((constants.EMAIL_VERIFICATION) && record.email) {
            otp_record.email = record.email;
        }

        if ((constants.SMS_VERIFICATION) && record.mobile_no) {
            otp_record.mobile_no = record.mobile_no;
        }
        if (!_.isEmpty(otp_record)) {
            await UserOTP.instance().createRecord(request, otp_record)
        }

        return;
    }

    /**
 * Hook for manipulate data input before update data is execute
 * @param {adonis request object} request
 * @param {payload object} params
 * @param {integer} int
 */
    async beforeEditHook(request, params, id) {
        let exceptUpdateField = this.exceptUpdateField();
        exceptUpdateField.filter(exceptField => {
            delete params[exceptField];
        });

        if (request?.image_url) {
            params.image_url = request.image_url;
        }
    }

    async socialLogin(request) {
        let user;
        let params = request.body;

        if (!_.isEmpty(params.email)) {
            user = await this.getUserByEmail(params.email);
        }
        if (_.isEmpty(user)) {
            user = await this.getUserByPlatformID(params.platform_type, params.platform_id);
        }

        //add new user
        if (_.isEmpty(user)) {
            let password = randomstring.generate(8);
            user = await this.orm.create({
                user_type: ROLES.USER,
                name: params.name,
                firstname: params.firstname || null,
                lastname: params.lastname || null,
                email: params.email,
                mobile_no: params.mobile_no,
                image_url: _.isEmpty(params.image_url) ? null : params.image_url,
                username: params.name,
                password: password,
                is_activated: true,
                is_email_verify: true,
                email_verifyAt: new Date(),
                is_mobile_verify: true,
                mobile_verifyAt: new Date(),
                login_type: params.platform_type,
                platform_type: request.body.platform_type,
                platform_id: request.body.platform_id,
                createdAt: new Date()
            });

        } else {

            //update user
            let updateParams = {
                updated_at: new Date()
            };
            if (!_.isEmpty(params.name)) {
                user.name = updateParams.name = params.name
                user.username = updateParams.username = params.name
            }
            if (!_.isEmpty(params.firstname) && !_.isEmpty(params.lastname)) {
                user.firstname = updateParams.firstname = params.firstname
                user.lastname = updateParams.lastname = params.lastname
            }
            if (!_.isEmpty(params.image_url))
                user.image_url = updateParams.image_url = params.image_url

            await this.orm.update(updateParams, {
                where: {
                    id: user.id
                }
            })
        }
        return user;
    }


    async getUserByEmail(email) {
        let query = await this.orm.findOne({
            where: {
                email: email,
                deletedAt: null
            }
        })
        return !_.isEmpty(query) ? query.toJSON() : {};
    }
    async getUserByID(user_id) {
        let query = await this.orm.findOne({
            where: {
                id: user_id,
                deletedAt: null,
            },
            raw: true
        });
        return query;
    }
    async getUserByMobileNo(mobile_no) {
        let query = await this.orm.findOne({
            where: {
                mobile_no: mobile_no,
                deletedAt: null
            }
        })
        return !_.isEmpty(query) ? query.toJSON() : {};
    }
    async getUserByPlatformID(platform_type, platform_id) {
        let query = await this.orm.findOne({
            where: {
                platform_type: platform_type,
                platform_id: platform_id,
                deletedAt: null
            },
            order: [['createdAt', 'DESC']]
        })
        return !_.isEmpty(query) ? query.toJSON() : {};
    }

    async forgotPassword(record) {
        let resetPasswordToken = encodeURI(record.id + '|' + moment().valueOf());
        resetPasswordToken = Buffer.from(resetPasswordToken).toString('base64')
        await ResetPassword.instance().createRecord(record.email, resetPasswordToken)

        //send reset password email
        await emailHandler.forgotPassword(record.email, resetPasswordToken);
        return true;
    }

    async getUserByApiToken(api_token, type = API_TOKENS_ENUM.ACCESS) {
        let query = await this.orm.findOne({
            where: {
                user_type: ROLES.USER
            },
            include: [
                {
                    model: UserApiToken.instance().getModel(),
                    where: {
                        api_token: api_token,
                        type: type,
                        deletedAt: null
                    },
                    order: [['createdAt', 'DESC']]
                },
            ]
        })

        return _.isEmpty(query) ? {} : _.isEmpty(query.toJSON()?.user_api_tokens) ? {} : query.toJSON();
    }

    async updateUser(condition, data) {
        await this.orm.update(data, {
            where: condition
        });
        return true;
    }

    async verifySocial(request, user_id) {
        await this.orm.update(
            {
                email_verifyAt: new Date(),
                is_email_verify: true,
                mobile_verifyAt: new Date(),
                is_mobile_verify: true,
            },
            {
                where: {
                    id: user_id,
                    deletedAt: null
                }
            })
        return true;
    }

    async getResetPassReq(reset_password_token) {
        const token = await ResetPassword.instance().getRecordByResetPasswordToken(reset_password_token);
        if (_.isEmpty(token)) return {};

        let query = await this.orm.findOne({
            where: {
                email: token.email,
                deletedAt: null
            },
            raw: true
        })

        if (_.isEmpty(query)) return {}

        query.reset_passwords = token
        return query;
    }

    async updateResetPassword(user, params) {
        let new_password = generateHash(params.newPassword)
        await this.orm.update({
            password: new_password
        }, {
            where: {
                email: user.email
            }
        })
        await ResetPassword.instance().deleteResetPassToken(user.email, params.resetPassToken);
        return true;
    }


    async getMyProfile(request) {
        const record = await this.orm.findOne({
            where: {
                id: request.user.id,
                deletedAt: null
            },
        })

        return _.isEmpty(record) ? {} : record.toJSON()
    }

    async validateUser(user_id) {
        const record = await this.orm.findOne({
            where: {
                id: user_id,
                user_type: ROLES.USER,
                is_activated: true,
                is_blocked: false,
                deletedAt: null
            }
        })
        return _.isEmpty(record) ? {} : record.toJSON()
    }

    async toggleNotification(user_id) {
        await this.orm.update({
            push_notification: Sequelize.literal('case when push_notification=0 then 1 else 0 end')
        }, {
            where: {
                id: user_id
            }
        })
        return;
    }

    /**
     * Hook for execute command after edit
     * @param {updated record object} record
     * @param {adonis request object} request
     * @param {payload object} params
     */
    async afterEditHook(record, request, params) {

    }

    /**
     * Hook for execute command before delete
     * @param {adonis request object} request
     * @param {payload object} params
     * @param {integer} id
     */
    async beforeDeleteHook(request, params, id) {

    }

    /**
     * Hook for execute command after delete
     * @param {adonis request object} request
     * @param {payload object} params
     * @param {integer} id
     */
    async afterDeleteHook(request, params, id) {
        await UserApiToken.instance().deleteRecord(id);
        await UserOTP.instance().deleteRecord(request.user.email, request.user.mobile_no)
    }

    /**
     * Hook for manipulate query of datatable result
     * @param {current mongo query} query
     * @param {adonis request object} request
     */
    async datatable_query_hook(query, request) {

    }


}

module.exports = User;

const UserApiToken = require('./UserApiToken');
const UserOTP = require('./UserOTP');

