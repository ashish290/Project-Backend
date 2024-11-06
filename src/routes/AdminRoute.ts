import express, { Request, Response, NextFunction } from "express";
import { CreateVandor, GetVandors, GetVandorByID } from "../controllers";

const router = express.Router();

router.post('/vandor',CreateVandor)
router.get('/vandors',GetVandors)
router.get('/vandor/:id',GetVandorByID)

router.get("/", (req: Request, res: Response, next: NextFunction) : void => {
  res.json({
    message: "Hello Admin",
  });
});

export { router as AdminRoute };