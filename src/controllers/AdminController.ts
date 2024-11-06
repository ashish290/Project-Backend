import { Request, Response, NextFunction } from "express";
import { CreateVandorInput } from "../dto/Vandor.dto";
import { Vandor } from "../models";
import { GeneratePassword, GenerateSalt } from "../utility";
import { Transaction } from "../models/Transaction";

export const findVandor = async(id: string | undefined, email ?: string) => {
    if(email) {
        return await Vandor.findOne({email: email});
    }
    else {
        return await Vandor.findById(id);
    }
}

export const CreateVandor = async(req : Request, res : Response, next : NextFunction) : Promise<any> => {
    const { name, address, pincode, foodType, email, password, ownerName, phone } = <CreateVandorInput>req.body;

    const existVandor = await findVandor('',email);
    if(existVandor !== null) {
        return res.json({
            "message" : "Vandor already exist",
        })
    }
    const salt = await GenerateSalt();
    const userPassword = await GeneratePassword(password, salt);

    const createVandor = await Vandor.create({
        name : name,
        address : address,
        pincode: pincode,
        foodType: foodType,
        email: email,
        password: userPassword,
        salt: salt,
        ownerName: ownerName,
        phone: phone,
        rating: 0,
        serviceAvailable: false,
        coverImages: [],
        foods: []
    });

    return res.json(createVandor);
}

export const GetVandors = async(req : Request, res : Response, next : NextFunction) : Promise<any> => {
     
    const vandors = await Vandor.find();
    if(vandors !== null) {
        return res.json(vandors);
    }
    return res.json({"message" : "vandors data not available"});
}

export const GetVandorByID = async(req : Request, res : Response, next : NextFunction) : Promise<any> => {
    const vandorID = req.params.id;
    const vandor = await findVandor(vandorID);
    if(vandorID !== null) {
        return res.json(vandor);
    }
    return res.json({"message" : "Vandors data not available"});
}

export const GetTransactions = async(req : Request, res : Response, next : NextFunction) : Promise<any> => {
    const transactions = await Transaction.find();
    if(transactions) {
        return res.status(200).json(transactions);
    }
    return res.json({msg : 'Transaction not available'});
}

export const GetTransactionById = async(req : Request, res : Response, next : NextFunction) : Promise<any> => {
    const id = req.params.id;
    const transaction = await Transaction.findById(id);
    if(transaction) {
        return res.status(200).json(transaction);
    }
    return res.json({msg : "Transaction not available!"});
}