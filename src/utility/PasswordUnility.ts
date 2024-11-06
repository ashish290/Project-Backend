import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { APP_SECRET } from "../config";
import { AuthPayload } from "../dto/Auth.dto";

export const GenerateSalt = async () => {
  return await bcrypt.genSalt();
};

export const GeneratePassword = async (password: string, salt: string) => {
  return await bcrypt.hash(password, salt);
};

export const ValidatePassword = async (
  enterdPassword: string,
  savedPassword: string,
  salt: string
) => {
  return (await GeneratePassword(enterdPassword, salt)) === savedPassword;
};

export const GenerateSignature = async (payload: AuthPayload) => {
  return jwt.sign(payload, APP_SECRET, { expiresIn: "10d" });
};

export const validateSignature = async (req: Request): Promise<any> => {
  const signature = req.get("Authorization");
  if (signature) {
    const payload = (await jwt.verify(
      signature.split(" ")[1],
      APP_SECRET
    )) as AuthPayload;
    req.user = payload;
    return true;
  }
  return false;
};
