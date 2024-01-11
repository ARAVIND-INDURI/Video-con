import { Router } from 'express';
import { healthcheck } from "../Controllers/healthcheck.controller.js"

const router = Router();

router.route('/').get(healthcheck);

export default router