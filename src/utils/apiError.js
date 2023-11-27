class ApiError extends Error {
    constructor(
        StatusCode,
        messege = "Something Went Wrong",
        errors = [],
        stack = ""

    ){
        super(messege);
        this.StatusCode = StatusCode;
        this.message = messege;
        this.errors = errors;
        this.success = false;
        this.data = null;
        
        if(stack){
            this.stack = stack;
        }
        else
        {
            Error.captureStackTrace(this, this.constructor)
        }
    }
}

export {ApiError};