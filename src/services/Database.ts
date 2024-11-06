import mongoose from "mongoose";
import { MONGO_URL } from "../config";

export default async () => {
  try {
    await mongoose.connect(MONGO_URL);
    console.log("DB Connected.....");
  } catch (error) {
    console.log(error);
  }
  
};
