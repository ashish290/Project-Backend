import { Request, Response, NextFunction } from "express";
import {
  CretaeOfferInputs,
  EditVandorInputs,
  VandorLoginInputs,
} from "../dto/Vandor.dto";
import { findVandor } from "./AdminController";
import { GenerateSignature, ValidatePassword } from "../utility";
import { CreateFoodInputs } from "../dto/Food.dto";
import { Food, Offer } from "../models";
import { Order } from "../models/Order";

export const VandorLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const { email, password } = <VandorLoginInputs>req.body;
  const exisitingVandor = await findVandor("", email);
  if (exisitingVandor !== null) {
    const validation = await ValidatePassword(
      password,
      exisitingVandor.password,
      exisitingVandor.salt
    );
    if (validation) {
      const signature = await GenerateSignature({
        _id: exisitingVandor.id,
        email: exisitingVandor.email,
        foodTypes: exisitingVandor.foodType,
        name: exisitingVandor.name,
      });
      console.log(signature);
      return res.json(signature);
    } else {
      return res.json({ message: "Password is not valid" });
    }
  }
  return res.json({ message: "Login credential not valid" });
};

export const GetVandorProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const user = req.user;
  console.log(user);
  if (user) {
    const exisitingVandor = await findVandor(user._id);
    return res.json(exisitingVandor);
  }
  return res.json({ message: "Vandor information Not found" });
};

export const UpdateVandorProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const { foodTypes, name, address, phone } = <EditVandorInputs>req.body;
  const user = req.user;
  if (user) {
    const exisitingVandor = await findVandor(user._id);
    if (exisitingVandor !== null) {
      exisitingVandor.name = name;
      exisitingVandor.address = address;
      exisitingVandor.phone = phone;
      exisitingVandor.foodType = foodTypes;

      const saveResult = await exisitingVandor.save();
      return res.json(saveResult);
    }
    return res.json(exisitingVandor);
  }
  return res.json({ message: "Vandor information Not found" });
};

export const UpdateVandorCoverImage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const user = req.user;
    if (user) {
      const vandor = await findVandor(user._id);
      if (vandor !== null) {
        const files = req.files as [Express.Multer.File];
        const images = files.map((file: Express.Multer.File) => file.filename);

        vandor.coverImages.push(...images);
        const result = await vandor.save();

        return res.json(result);
      }
    }
    return res.json({ message: "Something went wrong with add food" });
  } catch (err) {
    console.log(err);
  }
};

export const UpdateVandorService = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const user = req.user;
  if (user) {
    const existingVandor = await findVandor(user._id);
    if (existingVandor !== null) {
      existingVandor.serviceAvailable = !existingVandor.serviceAvailable;
      const saveResult = await existingVandor.save();
      return res.json(saveResult);
    }
    return res.json(existingVandor);
  }
  return res.json({ message: "Vandor information Not found" });
};

export const AddFood = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const user = req.user;
  if (user) {
    const { name, description, category, foodType, readyTime, price } = <
      CreateFoodInputs
    >req.body;
    const vandor = await findVandor(user._id);
    if (vandor !== null) {
      const files = req.files as [Express.Multer.File];
      const images = files.map((file: Express.Multer.File) => file.filename);

      const createdFood = await Food.create({
        vandorId: vandor._id,
        name: name,
        description: description,
        category: category,
        foodType: foodType,
        images: images,
        readyTime: readyTime,
        price: price,
        rating: 0,
      });
      vandor.foods.push(createdFood);
      const result = await vandor.save();
      console.log(result);
      return res.json(result);
    }
  }
  return res.json({ message: "Something went wrong with add food" });
};

export const GetFoods = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const user = req.user;
  if (user) {
    const foods = await Food.find({ vandorId: user._id });
    if (foods !== null) {
      return res.json(foods);
    }
  }
  return res.json({ message: "Foods information Not found" });
};

export const GetCurrentOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const user = req.user;
  if (user) {
    const orders = await Order.find({ vandorId: user._id }).populate(
      "items.food"
    );
    if (orders != null) {
      return res.status(200).json(orders);
    }
  }
  return res.json({ msg: "Order not found" });
};

export const GetOrdersDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const orderId = req.params.id;
  if (orderId) {
    const order = (await Order.findById(orderId)).populated("items.food");
    if (order != null) {
      return res.status(200).json(order);
    }
  }
  return res.json({ msg: "Order not found" });
};

export const ProcessOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const orderId = req.params.id;
  const { status, remarks, time } = req.body;
  if (orderId) {
    const order = Order.findById(orderId).populate("food");
    (await order).orderStatus = status;
    (await order).remarks = remarks;
    if (time) {
      (await order).readyTime = time;
    }
    const orderResult = (await order).save();
    if (orderResult !== null) {
      return res.status(200).json(orderResult);
    }
  }
  return res.json({ msg: "Unable to process Order!" });
};

//  ------- Offer --------
export const GetOffers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const user = req.user;
  if (user) {
    let currentOffers = Array();
    const offers = await Offer.find().populate("vandors");
    if (offers) {
      offers.map((item) => {
        if (item.vandors) {
          item.vandors.map((vandor) => {
            if (vandor._id.toString() === user._id) {
              currentOffers.push(item);
            }
          });
        }
        if (item.offerTypes === "GENERIC") {
          currentOffers.push(item);
        }
      });
    }
    return res.json(currentOffers);
  }
  return res.json({ msg: "Offer is not available!" });
};

export const AddOffer = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const user = req.user;
  if (user) {
    const {
      title,
      description,
      offerType,
      offerAmount,
      pincode,
      promocode,
      promoType,
      startValidity,
      endValidity,
      bank,
      bins,
      minValue,
      isActive,
    } = <CretaeOfferInputs>req.body;
    const vandor = await findVandor(user._id);
    if (vandor) {
      const offer = await Offer.create({
        title,
        description,
        offerType,
        offerAmount,
        pincode,
        promocode,
        promoType,
        startValidity,
        endValidity,
        bank,
        bins,
        minValue,
        isActive,
        vandors: [vandor],
      });
      return res.status(200).json(offer);
    }
  }
  return res.json({ msg: "Unable to Add Offer!" });
};

export const EditOffer = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const user = req.user;
  const offerId = req.params.id;
  if (user) {
    const {
      title,
      description,
      offerType,
      offerAmount,
      pincode,
      promocode,
      promoType,
      startValidity,
      endValidity,
      bank,
      bins,
      minValue,
      isActive,
    } = <CretaeOfferInputs>req.body;
    const currentOffer = await Offer.findById(offerId);
    if (currentOffer) {
      const vandor = await findVandor(user._id);
      if (vandor) {
          (currentOffer.title = title),
          (currentOffer.description = description),
          (currentOffer.offerTypes = offerType),
          (currentOffer.offerAmount = offerAmount),
          (currentOffer.pincode = pincode),
          (currentOffer.promocode = promocode),
          (currentOffer.promoType = promoType),
          (currentOffer.startValidity = startValidity),
          (currentOffer.endValidity = endValidity),
          (currentOffer.bank = bank),
          (currentOffer.bins = bins),
          (currentOffer.minValue = minValue),
          (currentOffer.isActive = isActive),
          (currentOffer.vandors = [vandor])
          const result = await currentOffer.save();

          return res.json(result);
      }
    }
  }
  return res.json({msg : "Unable to Add Offers"});
};
