const _ = require("lodash")
const { LOGIN_TYPE, GENDER_ENUM, API_TOKENS_ENUM, UPLOAD_DIRECTORY } = require("../../../config/enum.js");
const constants = require("../../../config/constants.js");
const { validateAll, compareHash, extractFields, generateHash, validateAsync, getUploadDirectoryPath } = require("../../../Helper/index.js");


const FileHandler = require("../../../Libraries/FileHandler/FileHandler.js");
const SocialUser = require("../../../Models/SocialUser.js");
const UserApiToken = require("../../../Models/UserApiToken.js");
const UserOTP = require("../../../Models/UserOTP.js");

const RestController = require("../../RestController");

class UserController extends RestController {

    constructor(model = 'User') {
        super(model)
        this.resource = 'User';
        this.request; //adonis request obj
        this.response; //adonis response obj
        this.params = {}; // this is used for get parameters from url
    }


    async validation(action, id = 0) {
        let validator = [];
        let rules;
        let customMessages = {
            required: 'You forgot to give a :attribute',
            'regex.password': "Password must contain atleast one number and one special character and should be 6 to 16 character long",
            same: ":attribute is not same as password"

        }

        switch (action) {
            case "store":
                rules = {
                    firstname: 'required|min:2|max:100',
                    lastname: 'required|min:2|max:100',
                    username: "min:2|max:45",
                    email: 'required|email|unique:users,email|max:250',
                    mobile_no: [
                        'required',
                        'unique:users,mobile_no',
                        "max:18"
                    ],
                    password: 'required|min:8|max:30',
                    confirm_password: 'required|same:password',
                }

                validator = await validateAsync(this.request.body, rules, customMessages)
                break;
            case "update":
                rules = {
                    firstname: 'min:2|max:45',
                    lastname: 'min:2|max:45',
                    username: "min:2|max:45"
                }
                break;
        }
        return validator;
    }

    async beforeUpdateLoadModel() {
        const params = this.request.body;

        this.params.id = this.request.user.id;
        if (!this.request.files?.length) return

        try {
            const fileObject = this.request.files;
            const image_url = await FileHandler.doUpload(fileObject[0], UPLOAD_DIRECTORY.USER)
            this.request.image_url = image_url
            return
        }
        catch (err) {
            this.__is_error = true;
            console.log(err)
            return this.sendError(
                "Failed to upload user image",
                {},
                500
            )
        }
    }

    async afterStoreLoadModel(record) {
        this.__collection = false;
        this.response_message = "User Created Successfully";
        return {}
    }

    async beforeDestroyLoadModel() {
        console.log('Before Destroy Load Model ')
        this.params.id = this.request.user.id
    }

    async login({ request, response }) {
        try {
            this.request = request;
            this.response = response;

            let customMessages = {
                required: 'You forgot to give :attribute',
                email: "Invalid Email",
                'regex.password': "Password must contain atleast one number and one special character and should be 6 to 16 character long",
            }

            let rules = {
                "email": 'required|email',
                "password": 'required',
                "device_type": "required|in:web,ios,android",
                "device_token": "required"
            }
            let validator = await validateAll(request.body, rules, customMessages);
            let validation_error = this.validateRequestParams(validator);
            if (this.__is_error)
                return validation_error;

            let params = this.request.body;
            let user = await this.modal.getUserByEmail(params.email);

            if (_.isEmpty(user))
                return this.sendError(
                    'This email is not associated with any user',
                    {},
                    400
                );

            if (!compareHash(params.password, user.password))
                return this.sendError(
                    "Incorrect Password",
                    {},
                    400
                );

            if (user.login_type !== LOGIN_TYPE.CUSTOM) {
                return this.sendError(
                    "Email already registered from different platform.",
                    {},
                    403
                );
            }

            if (!user.is_activated) {
                return this.sendError(
                    "You have been de-activated by Admin. Kindly contact the administrator",
                    {},
                    403
                );
            }

            if (user.is_blocked) {
                return this.sendError(
                    "You have been blocked by Admin. Kindly contact the administrator.",
                    {},
                    403
                );
            }

            if ((constants.SMS_VERIFICATION && !user.is_mobile_verify) || (constants.EMAIL_VERIFICATION && !user.is_email_verify)) {

                const payload = {}
                if (user.email) {
                    payload.email = user.email;
                }
                if (user.mobile_no) {
                    payload.mobile_no = user.mobile_no
                }
                await UserOTP.instance().createRecord(this.request, payload);
                return this.sendError(
                    "Email or mobile no is not verified.",
                    payload,
                    428
                );
            }

            request.body.user_id = user.id
            await UserApiToken.instance().createRecord(
                request,
                extractFields(request.body, UserApiToken.instance().getFields())
            )


            this.__is_paginate = false;
            await this.sendResponse(
                200,
                'User logged in successfully!',
                user
            );
            return;
        }
        catch (err) {
            console.log(err);
            return this.sendError(
                'Internal server error. Please try again later.',
                {},
                500
            )
        }
    }


    async socialLogin({ request, response }) {
        this.request = request;
        this.response = response;
        const params = request.body;
        let socialUser;

        let customMessages = {
            required: 'You forgot to give :attribute',
            email: "Invalid Email",
            'regex.password': "Password must contain atleast one number and one special character and should be 6 to 16 character long",
        }

        let rules = {
            "email": 'email|max:50',
            "platform_id": "required|max:255",
            "platform_type": "required|in:facebook,google,apple",
            "device_type": "required|in:web,android,ios",
            "device_token": "required",

        }
        let validator = await validateAll(params, rules, customMessages);
        let validation_error = this.validateRequestParams(validator);
        if (this.__is_error)
            return validation_error;


        if (!_.isEmpty(params.email)) {
            const existing_user = await this.modal.getRecordByCondition(
                this.request,
                {
                    platform_id: params.platform_id,
                    platform_type: params.platform_type,
                    deletedAt: null
                }
            )
            if (!_.isEmpty(existing_user) && (existing_user.email !== params.email)) {
                return this.sendError(
                    "Invalid social details",
                    {},
                    400
                )
            }
            await SocialUser.instance().findOrCreateRecord(this.request, extractFields(params, SocialUser.instance().getFields()));
        } else {
            const saved_user = await SocialUser.instance().getUserRecord(params.platform_id, params.platform_type)
            if (!_.isEmpty(saved_user)) {
                params.email = saved_user.email;
                request.body.email = saved_user.email;
                request.body.name = saved_user.name
            }
        }
        if (!_.isEmpty(params.email)) {
            socialUser = await this.modal.getUserByEmail(params.email);
        }

        // if (_.isEmpty(socialUser)) {
        //     socialUser = await this.modal.getUserByPlatformID(params.platform_type, params.platform_id);
        // }

        if (_.isEmpty(socialUser) && !params.email) {
            return this.sendError(
                "Not able to sign up without email",
                {},
                403
            );
        }

        if (!_.isEmpty(socialUser)) {
            if (socialUser.login_type !== params.platform_type) {
                return this.sendError(
                    "Email already registered from different platform.",
                    {},
                    400
                );
            }

            if (!socialUser.is_activated) {
                return this.sendError(
                    "You have been de-activated by Admin. Kindly contact the administrator",
                    {},
                    403
                );
            }
            console.log("Block Status", socialUser.is_blocked)

            if (socialUser.is_blocked) {
                return this.sendError(
                    "You have been blocked by Admin. Kindly contact the administrator.",
                    {},
                    403
                );
            }
        }


        let user = await this.modal.socialLogin(request);

        /*const invite_count = await Invite.instance().getInviteCount(user.id);
        if (invite_count < constants.MIN_INVITE_REQUIRED) {
            request.body.slug = user.slug
            request.body.type = API_TOKENS_ENUM.INVITE
            await UserApiToken.instance().createRecord(
                request,
                extractFields(request.body, UserApiToken.instance().getFields())
            )

            return this.sendError(
                "Please invite user to login.",
                { invite_count: invite_count, api_token: Buffer.from(this.request.api_token).toString('base64') },
                430
            );
        }*/


        //generate api token
        const userApiToken = UserApiToken.instance()
        user.user_id = user.id;
        await userApiToken.createRecord(request, extractFields(user, userApiToken.getFields()))



        this.__is_paginate = false;
        await this.sendResponse(
            200,
            "User logged in successfully",
            user
        );
        return;
    }

    async setNewPassword({ request, response }) {
        this.request = request;
        this.response = response;
        const user = this.request.user;
        const params = this.request.body

        let rules = {
            "new_password": 'required|min:8|max:30',
            "confirm_password": 'required|same:new_password',
        }
        let validator = await validateAll(params, rules);
        let validation_error = this.validateRequestParams(validator);
        if (this.__is_error)
            return validation_error;

        //update new password
        let update_params = {
            password: generateHash(params.new_password)
        }
        //update user
        await this.modal.updateUser({ email: user.email }, update_params);
        await UserApiToken.instance().deleteRecord(user.id)
        await UserOTP.instance().deleteRecord(user?.email, user?.mobile_no)

        this.__is_paginate = false;
        return this.sendResponse(
            200,
            'Password reset successfully',
            {}
        )
    }


    async forgotPassword({ request, response }) {
        this.request = request;
        this.response = response;
        let params = request.body;

        let rules = {
            "email": 'required',
        }
        let validator = await validateAll(params, rules);
        let validation_error = this.validateRequestParams(validator);
        if (this.__is_error)
            return validation_error;


        //get user by email
        let user = await this.modal.getUserByEmail(params.email);
        if (_.isEmpty(user))
            return this.sendError(
                'This email is not associated with any user.',
                {},
                400
            );
        try {
            await UserOTP.instance().createRecord(
                this.request,
                extractFields(user, UserOTP.instance().getFields())
            )
            // const record = await this.modal.forgotPassword(user);
        }
        catch (err) {
            return this.sendError(
                'Failed to send mail',
                {},
                500
            )
        }

        this.__collection = false;
        this.__is_paginate = false;
        this.sendResponse(
            200,
            "Otp has been sent to your email",
            {}
        );
        return;
    }

    async changePassword({ request, response }) {
        this.request = request;
        this.response = response;
        //validation rules
        let rules = {
            "current_password": 'required',
            "new_password": 'required|min:8|max:30',
            "confirm_password": 'required|same:new_password',
        }
        let validator = await validateAll(request.body, rules);
        let validation_error = this.validateRequestParams(validator);
        if (this.__is_error)
            return validation_error;

        let user = this.request.user;
        let params = this.request.body;

        if (user.login_type !== LOGIN_TYPE.CUSTOM) {
            return this.sendError(
                'Not able to change password. Not a custom user',
                {},
                400
            )
        }

        //check old password
        let checkCurrentPass = await compareHash(params.current_password, user.password)
        if (!checkCurrentPass)
            return this.sendError(
                "Invalid current password",
                {},
                400
            );
        //check current and old password
        if (params.current_password == params.new_password)
            return this.sendError(
                "Current password is same as new password",
                {},
                400
            );
        //update new password
        let update_params = {
            password: generateHash(params.new_password)
        }
        //update user
        await this.modal.updateUser({ email: user.email }, update_params);

        //remove all api token except current api token
        await UserApiToken.instance().deleteRecord(user.id)

        this.__is_paginate = false;
        this.__collection = false;
        this.sendResponse(
            200,
            "Password updated successfully",
            {}
        );
        return;
    }


    async toggleNotification({ request, response }) {
        try {
            this.request = request;
            this.response = response;

            await this.modal.toggleNotification(request.user.id);
            this.__is_paginate = false;
            this.__collection = false
            return await this.sendResponse(
                200,
                "Notification status updated successfully",
                {}
            )
        }
        catch (err) {
            console.log(err);
            return this.sendError(
                "Internal server error. Please try again later.",
                {},
                500
            )

        }

    }


    async getMyProfile({ request, response }) {
        this.request = request;
        this.response = response;

        const user = await this.modal.getMyProfile(request);
        this.resource = 'MyProfile'
        this.__is_paginate = false;
        return await this.sendResponse(
            200,
            "Profile retreived successfully",
            user
        )

    }


    async logout({ request, response }) {
        this.request = request;
        this.response = response;

        const id = request.user.id;
        const record = await UserApiToken.instance().deleteRecord(id);

        this.__is_paginate = false;
        this.__collection = false;

        return this.sendResponse(
            200,
            "User Logout Successfully",
            {}
        )
    }

    async uploadAttachments({ request, response }) {
        try {
            this.request = request;
            this.response = response;

            if (!request.files?.length) {
                throw new Error("Files are required");
            }
            if (!request.body?.path) {
                throw new Error("path is required");
            }
            const fileObjects = request.files;
            const files = await FileHandler.doUpload(fileObjects, request.body?.path)
            this.__collection = false;
            this.__is_paginate = false;
            return this.sendResponse(200, "Files uploaded successfully", files);
        }
        catch (err) {
            console.log(err)
            return this.sendError(
                "Failed to upload files",
                {},
                500
            )
        }
    }

    async updateDeviceToken({request, response}){
        try {
            this.request = request;
            this.response = response;
            let rules = {
                "device_type": "required",
                "device_token": "required"
            }
            let validator = await validateAll(request.body, rules);
            let validation_error = this.validateRequestParams(validator);
            if (this.__is_error)
                return validation_error;

            await UserApiToken.instance().updateDeviceToken(request);

            return this.sendResponse(200,"Device Token Updated Successfully",{})
        }catch (e) {
            console.log(e)
            return this.sendError(e.message,{},400)
        }
    }



}


module.exports = UserController;