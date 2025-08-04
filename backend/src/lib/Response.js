const CustomError = require('./Error');
const Enum = require('../config/Enum');
const config = require('../config');
const i18n = new (require("./i18n"))(config.DEFAULT_LANGUAGE);


class Response{
    constructor() {}

    static success(data, code = 200) {
        return {
            code,
            data
        }
    }

    static error(error, lang) {
        if(error instanceof CustomError){
            return {
                code: error.code,
                error: {
                    message: error.message,
                    description: error.description
                }
            }
        } else if(error.message.includes("E11000")){
            return {
                code: Enum.HTTP_CODES.CONFLICT,
                error: {
                    message: i18n.translate("COMMON.DUPLICATE_KEY_ERROR_TITLE", lang),
                    description: i18n.translate("COMMON.DUPLICATE_KEY_ERROR_DESCRIPTION", lang)
                }
            }
        }

        return{
            code : Enum.HTTP_CODES.INTERNAL_SERVER_ERROR,
            error:{
                message: error.message,
                description: error.description
            }
            
        }
    }
}

module.exports = Response;