const _ = require("lodash")
const { validateAsync, validateAll, compareHash, extractFields, generateHash, getUserDirectory } = require("../../../Helper");
const { LOGIN_TYPE,UPLOAD_DIRECTORY } = require("../../../config/enum");

const UserApiToken = require("../../../Models/UserApiToken");

const RestController = require("../../RestController");
const FileHandler = require("../../../Libraries/FileHandler/FileHandler");

class UserController extends RestController {

    constructor() {
        super("Admin")
        this.resource = 'Admin';
        this.request;
        this.response;
        this.params = {};
    }

    async validation(action, id = 0) {
        let validator = [];
        let rules;
        let customMessages = {
            required: 'You forgot to give a :attribute',
            email: "Invalid Email",
            'regex.password': "Password must contain atleast one number and one special character and should be 6 to 16 character long",
            same: ":attribute is not same as password"

        }

        switch (action) {
            case "store":
                rules = {
                    email: 'required|email|unique:users,email',
                    password: 'required|min:8|max:30',
                    device_type: "required",
                    device_token: "required"
                }

                validator = await validateAsync(this.request.body, rules)

                break;
            case "update":

                break;
        }
        return validator;
    }

    async beforeUpdateLoadModel() {
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



    async login({ request, response }) {
        this.request = request;
        this.response = response;

        let customMessages = {
            required: 'You forgot to give :attribute',
        }

        let rules = {
            "email": 'required|email',
            "password": 'required',
            "device_type": "required",
            "device_token": "required"
        }
        let validator = await validateAll(request.body, rules, customMessages);
        let validation_error = this.validateRequestParams(validator);
        if (this.__is_error)
            return validation_error;

        let params = this.request.body;
        let user = await this.modal.getAdminByEmail(params.email);

        if (_.isEmpty(user))
            return this.sendError(
                'This email is not associated with any admin',
                {},
                400
            );

        if (!compareHash(params.password, user.password))
            return this.sendError(
                "Incorrect email or password",
                {},
                400
            );

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
            const record = await this.modal.forgotPassword(user);
        }
        catch (err) {
            return this.sendError(
                'Failed to send mail',
                {},
                500
            )
        }


        this.__is_paginate = false;
        this.sendResponse(
            200,
            "Reset password link has been sent to your email",
            []
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


    async getMyProfile({ request, response }) {
        this.request = request;
        this.response = response;

        this.resource = 'AdminProfile'
        this.__is_paginate = false;
        return await this.sendResponse(
            200,
            "Profile retreived successfully",
            this.request.user
        )

    }

    async logout({ request, response }) {
        this.request = request;
        this.response = response;

        const user_id = request.user.id;
        const record = await UserApiToken.instance().deleteRecord(user_id);

        this.__is_paginate = false;
        this.__collection = false;

        return this.sendResponse(
            200,
            "User Logout Successfully",
            {}
        )
    }


}

module.exports = UserController