import express, { Request, Response, NextFunction } from "express";

import { plainToClass } from "class-transformer";
import { isTimeZone, validate } from "class-validator";
import {
  CartItems,
  CreateCustomerInputs,
  EditCustomerProfileInputs,
  OrderInputs,
  UserLoginInputs,
} from "../dto/Customer.dto";
import {
  GenerateOtp,
  GeneratePassword,
  GenerateSalt,
  GenerateSignature,
  onRequestOTP,
  ValidatePassword,
} from "../utility";
import { Customer, Food, Offer } from "../models";
import { Order } from "../models/Order";
import { AsyncResource } from "async_hooks";
import { Transaction } from "../models/Transaction";

export const CustomerSignUp = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const customerInputs = plainToClass(CreateCustomerInputs, req.body);
  const InputError = await validate(customerInputs, {
    validationError: { target: true },
  });

  if (InputError.length > 0) {
    return res.status(400).json(InputError);
  }
  const { email, phone, password } = customerInputs;

  const salt = await GenerateSalt();
  const userPassword = await GeneratePassword(password, salt);

  const { otp, expiry } = GenerateOtp();

  const result = await Customer.create({
    email: email,
    password: userPassword,
    salt: salt,
    phone: phone,
    otp: otp,
    otp_expiry: expiry,
    firstName: "",
    lastName: "",
    address: "",
    verified: false,
    lat: 0,
    lng: 0,
    orders: [],
  });

  if (result) {
    // Send the OTP to Customer
    await onRequestOTP(otp, phone);

    // Signature
    const signature = await GenerateSignature({
      _id: result.id,
      email: result.email,
      verified: result.verified,
    });

    // send the result to client
    return res.status(201).json({
      signature: signature,
      verified: result.verified,
      email: result.email,
    });
  }
  return res.status(400).json({ msg: "Error with Signup" });
};

export const CustomerLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const loginInputs = plainToClass(UserLoginInputs, req.body);
  const loginErrors = await validate(loginInputs, {
    validationError: { target: false },
  });

  if (loginErrors.length > 0) {
    return res.status(400).json(loginErrors);
  }
  const { email, password } = loginInputs;
  const customer = await Customer.findOne({ email: email });
  if (customer) {
    const validation = await ValidatePassword(
      password,
      customer.password,
      customer.salt
    );
    if (validation) {
      const signature = await GenerateSignature({
        _id: customer.id,
        email: customer.email,
        verified: customer.verified,
      });

      return res.status(201).json({
        signature: signature,
        verified: customer.verified,
        email: customer.email,
      });
    }
  }
  return res.status(404).json({ msg: "Login Error" });
};

export const CustomerVerify = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const { otp } = req.body;
  const customer = req.user;

  if (customer) {
    const profile = await Customer.findById(customer._id);
    if (profile) {
      if (profile.otp === parseInt(otp) && profile.otp_expiry >= new Date()) {
        profile.verified = true;
        const updateCustomerResponse = await profile.save();
        const signature = await GenerateSignature({
          _id: updateCustomerResponse.id,
          email: updateCustomerResponse.email,
          verified: updateCustomerResponse.verified,
        });
        return res.status(201).json({
          signature: signature,
          verified: updateCustomerResponse.verified,
          email: updateCustomerResponse.email,
        });
      }
    }
  }
  return res.status(400).json({ message: "Error with OTP validation" });
};

export const RequestOTP = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const customer = req.user;
  if (customer) {
    const profile = await Customer.findById(customer._id);
    if (profile) {
      const { otp, expiry } = GenerateOtp();
      profile.otp = otp;
      profile.otp_expiry = expiry;

      await profile.save();
      await onRequestOTP(otp, profile.phone);
      res.status(200).json({ msg: "OTP sent your registered phone number" });
    }
  }
  return res.status(400).json({ msg: "Error with Request OTP" });
};

export const GetCustomerProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const customer = req.user;
  if (customer) {
    const profile = await Customer.findById(customer._id);

    if (profile) {
      return res.status(201).json(profile);
    }
  }
  return res.status(400).json({ msg: "Error while Fetching Profile" });
};

export const EditCustomerProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const customer = req.user;
  const customerInputs = plainToClass(EditCustomerProfileInputs, req.body);

  const profileInputs = plainToClass(EditCustomerProfileInputs, req.body);
  const profileErrors = await validate(profileInputs, {
    validationError: { target: false },
  });
  if (profileErrors.length > 0) {
    return res.status(400).json(profileErrors);
  }

  const { firstName, lastName, address } = customerInputs;
  if (customer) {
    const profile = await Customer.findById(customer._id);
    if (profile) {
      profile.firstName = firstName;
      profile.lastName = lastName;
      profile.address = address;
      const result = await profile.save();
      return res.status(201).json(result);
    }
  }
  return res.status(400).json({ msg: "Error while Updating Profile" });
};
// ------------------- Create Order ------------------- 

const validateTransaction = async(txnId : string) => {
  const currentTransaction = await Transaction.findById(txnId);
  if(currentTransaction) {
    if(currentTransaction.status.toLowerCase() !== "failed") {
      return {status : true, currentTransaction};
    }
  }
  return {status : false, currentTransaction};
}

export const CreateOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const customer = req.user;
  const {txnId,amount,items} = <OrderInputs>req.body;

  if (customer) {
    const {status, currentTransaction} = await validateTransaction(txnId);
    if(!status) {
      return res.status(404).json({msg : 'Error with Create Order!'});
    }

    const orderId = `${Math.floor(Math.random() * 89999) + 1000}`;
    const profile = await Customer.findById(customer._id);

    let cartItems = [];
    let netAmount = 0.0;
    let vandorId;

    // Calculate order amount
    const foods = await Food.find()
      .where("_id")
      .in(items.map((item) => item._id))
      .exec();
    foods.map((food) => {
      items.map(({ _id, unit }) => {
        if (food._id == _id) {
          vandorId = food.vandorId;
          netAmount += food.price * unit;
          cartItems.push({ food, unit });
        }
      });
    });
    // Create Order with Item descriptions
    if (cartItems) {
      //Create Order
      const currentOrder = await Order.create({
        orderId: orderId,
        vandorId: vandorId,
        items: cartItems,
        totalAmount: netAmount,
        paidAmount : amount,
        orderDate: new Date(),
        orderStatus: "Waiting",
        remarks: "",
        deliveryId: "",
        readyTime: 45,
      });
      if (currentOrder) {
        profile.cart = [] as any;
        profile.orders.push(currentOrder);

        currentTransaction.vandorId = vandorId;
        currentTransaction.orderId = orderId;
        currentTransaction.status = 'CONFIRMED';
        await currentTransaction.save();

        await profile.save();

        return res.status(200).json(currentOrder);
      }
    }
  }
  return res.status(400).json({ msg: "Error with Create Order!" });
};

export const GetOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const customer = req.user;
  if (customer) {
    const profile = await Customer.findById(customer._id).populate("orders");
    if (profile) {
      return res.status(200).json(profile.orders);
    }
  }
};

export const GetOrderById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const orderId = req.params.id;
  if (orderId) {
    const order = await Order.findById(orderId).populate("items.food");
    return res.status(200).json(order);
  }
};

// ------- Cart ------
export const addtoCart = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const customer = req.user;
  if (customer) {
    const profile = await Customer.findById(customer._id).populate("cart.food");
    let cartItems = Array();
    const { _id, unit } = <CartItems>req.body;
    const food = await Food.findById(_id);
    if (food) {
      if (profile != null) {
        cartItems = profile.cart;
        if (cartItems.length > 0) {
          let existFoodItem = cartItems.filter(
            (item) => item.food._id.toString() === _id
          );
          if (existFoodItem.length > 0) {
            const index = cartItems.indexOf(existFoodItem[0]);
            if (unit > 0) {
              cartItems[index] = { food, unit };
            } else {
              cartItems.splice(index, 1);
            }
          } else {
            cartItems.push({ food, unit });
          }
        } else {
          cartItems.push({ food, unit });
        }
        if (cartItems) {
          profile.cart = cartItems as any;
          const cartresult = await profile.save();
          return res.status(200).json(cartresult.cart);
        }
      }
    }
  }
  return res.status(400).json({ msg: "Unable to create Cart!" });
};

export const GetCart = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const customer = req.user;
  if (customer) {
    const profile = await Customer.findById(customer._id).populate("cart.food");
    if (profile) {
      return res.status(200).json(profile.cart);
    }
  }
  return res.status(400).json({ msg: "Cart is empty!" });
};

export const DeleteCart = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const customer = req.user;
  if (customer) {
    const profile = await Customer.findById(customer._id).populate("cart.food");
    if (profile != null) {
      profile.cart = [] as any;
      const cartResult = await profile.save();
      return res.status(200).json(cartResult);
    }
  }
  return res.status(400).json({ msg: "Cart already empty!" });
};

export const ApplyOffers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const offerId = req.params.id;
  const customer = req.user;
  if (customer) {
    const appliedOffers = await Offer.findById(offerId);
    if (appliedOffers) {
      if (appliedOffers.promoType === "USER") {
      } else {
        if (appliedOffers.isActive) {
          return res
            .status(200)
            .json({ msg: "Offer is Valid", offer: appliedOffers });
        }
      }
    }
  }
  return res.status(400).json({ msg: "Offer not Valid!" });
};

export const CreatePayment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const customer = req.user;
  const {amount, paymentMode, offerId} = req.body;
  let payableAmount = Number(amount);
  if(offerId) {
    const appliedOffer = await Offer.findById(offerId);
    if(appliedOffer) {
      if(appliedOffer.isActive) {
        payableAmount -= appliedOffer.offerAmount;
      }
    }

    // Create record on Transaction
    const transaction = await Transaction.create({
      customer: customer._id,
      vandorId : '',
      orderId: '',
      orderValue: payableAmount,
      offerUsed: offerId || 'NA',
      status : 'OPEN',
      paymentMode : paymentMode,
      paymentResponse: 'Payment is Cash on Delivery'
    })
    return res.status(200).json(transaction);
  }
};
