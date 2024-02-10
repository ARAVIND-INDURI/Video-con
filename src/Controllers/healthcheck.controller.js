import { asyncHandler } from "../utils/asyncHandler.js"
import { APiResponce } from "../utils/apiResponce.js"


const healthcheck = asyncHandler(async (req, res) => {
    //TODO: build a healthcheck response that simply returns the OK status as json with a message
    res
    .status(200)
    .json(new APiResponce(200,{},"All Good.."))
})

export {
    healthcheck
    }