'use strict'

const { validateAll } = require("../../Helper");
const RestController = require("../RestController");

class NotificationController extends RestController {
    constructor() {
        super('Notification');
        this.resource = "Notification";
        this.request;
        this.response;
        this.params = {};
    }

    /**
     * This function is used for validate restfull request
     * @param $action
     * @param string $slug
     * @return validator response
     */
    async validation(action, slug = '') {
        let validator = [];
        let rules;
        switch (action) {
            case "store":
                rules = {
                    name: 'required',
                }
                validator = await validateAll(this.request.body, rules)
                break;
            case "update":
                rules = {
                    name: 'required',
                }
                validator = await validateAll(this.request.body, rules);
                break;
        }
        return validator;
    }

    async getUnreadCount({request,response}){
        this.request = request;
        this.response = response;
        this.__collection = false
        this.__is_paginate = false
        let result = await this.modal.getUnreadCount(request);
        console.log("result:",result)
        return this.sendResponse(200,"Unread Count", {total:result})
    }
    async markAllRead({request,response}){
        this.request = request;
        this.response = response;
        this.__collection = false
        this.__is_paginate = false
        let result = await this.modal.markAllRead(request);
        return this.sendResponse(200,"Mark read successfully", {})
    }
    async markSingleRead({request,response}){
        this.request = request;
        this.response = response;
        this.__collection = false
        this.__is_paginate = false
        let result = await this.modal.markSingleRead(request);
        return this.sendResponse(200,"Mark read successfully", {})
    }
    async sendTestNotification({request,response}){
        this.request = request;
        this.response = response;
        let result = await this.modal.createRecord(request,{
            user_id: request.user.id,
            type: "test",
            title: request?.body?.title || "Test Notification",
            message: request?.body?.message || "Test Notification",
            image_url: request?.body?.image_url || null,
            payload: {
                title: request?.body?.title || "Test Notification",
                message: request?.body?.message || "Test Notification",
            },
            is_read: 0
        });
        return this.sendResponse(200,"Record created successfully", result)
    }
}
module.exports = NotificationController;
