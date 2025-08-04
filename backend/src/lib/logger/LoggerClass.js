const logger = require("./logger");
let instance = null;

class LoggerClass {
    constructor(){

        if(!instance) instance = this;

        return instance
    }


    #createLogObject(level, email, location, proc_type, log){
        return {
            level, email, location, proc_type, log
        }
    }

    info(email, location, proc_type, log){
        let logs = this.#createLogObject(email, location, proc_type, log);
        logger.info(logs);
    }

    warn(email, location, proc_type, log){
        let logs = this.#createLogObject(email, location, proc_type, log);
        logger.warn(logs);
    }

    debug(email, location, proc_type, log){
        let logs = this.#createLogObject(email, location, proc_type, log);
        logger.debug(logs);
    }

    error(email, location, proc_type, log){
        let logs = this.#createLogObject(email, location, proc_type, log);
        logger.error(logs);
    }

    verbose(email, location, proc_type, log){
        let logs = this.#createLogObject(email, location, proc_type, log);
        logger.verbose(logs);
    }

    http(email, location, proc_type, log){
        let logs = this.#createLogObject(email, location, proc_type, log);
        logger.http(logs);
    }
}

module.exports = new LoggerClass();