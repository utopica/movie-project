module.exports = {
    HTTP_CODES : {
        OK: 200,
        CREATED: 201,
        NO_CONTENT: 204,
        BAD_REQUEST: 400,
        UNAUTHORIZED: 401,
        FORBIDDEN: 403,
        NOT_FOUND: 404,
        METHOD_NOT_ALLOWED: 405,
        NOT_ACCEPTABLE: 406,
        CONFLICT: 409,
        GONE : 410,
        UNSUPPORTED_MEDIA_TYPE: 415,
        UNPROCESSABLE_ENTITY: 422,
        TOO_MANY_REQUESTS: 429,
        INTERNAL_SERVER_ERROR: 500,
        BAD_GATEWAY: 502,  
    },
    PASSWORD_MIN_LENGTH: 8,
    LOG_LEVELS: {
        INFO: 'INFO',
        WARN: 'WARN',
        ERROR: 'ERROR',
        DEBUG: 'DEBUG',
        VERBOSE: 'VERBOSE',
        HTTP : 'HTTP',
    },
    ROLES: {
        ADMIN: 'ADMIN',
        USER : 'USER',
        GUEST: 'GUEST',
    },
    

}