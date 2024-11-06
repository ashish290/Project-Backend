import express,{Request,Response,NextFunction} from 'express';
import { FoodDoc, Offer, Vandor } from '../models';

export const GetFoodAvailability = async(req: Request,res: Response,next: NextFunction) : Promise<any> => {
    try {
    const pincode = req.params.pincode;
    
    const result = await Vandor.find({ pincode: pincode, serviceAvailable: false}).sort([['rating', 'descending']]).populate('foods');

    if(result.length > 0){
        return res.status(200).json(result);
    }

    return res.status(404).json({ msg: 'data Not found!'});
    }
    catch(err) {
        console.log(err);
        return res.status(500).json({ msg: 'Server error' });
    }
}

export const GetTopRestaurants = async(req: Request,res: Response,next: NextFunction) : Promise<any> => {
    const pincode = req.params.pincode;

    const result = await Vandor.find({pincode: pincode, serviceAvailable: false })
    .sort([['rating', 'descending']])
    .limit(1);
    console.log(result);

    if(result.length > 0) {
        return res.status(200).json(result);
    }
    return res.status(400).json({msg : 'Data not found!'});
}

export const GetFoodsIn30Min = async(req: Request,res: Response,next: NextFunction) : Promise<any> => {
    const pincode = req.params.pincode;

    const result = await Vandor.find({pincode: pincode, serviceAvailable: false })
    .populate("foods")

    if(result.length > 0) {
        let foodResult: any = [];
        result.map(vandor => {
            const foods = vandor.foods as [FoodDoc];
            foodResult.push(...foods.filter(food => food.readyTime <= 30));
        })
        return res.status(200).json(foodResult);
    }
    return res.status(400).json({msg : 'Data not found!'});
}

export const SearchFoods = async(req: Request,res: Response,next: NextFunction) : Promise<any> => {
    const pincode = req.params.pincode;

    const result = await Vandor.find({pincode: pincode, serviceAvailable: false })
    .populate("foods")

    if(result.length > 0) {
        let foodResult: any = [];
        result.map(item => foodResult.push(...item.foods))
        return res.status(200).json(foodResult);
    }
    return res.status(400).json({msg : 'Data not found!'});
}

export const RestaurantById = async(req: Request,res: Response,next: NextFunction) : Promise<any> => {
    try {
        const id = req.params.id;
        const result = await Vandor.findById(id).populate("foods");
        if(result) {
            res.status(200).json(result);
        }
        return res.status(400).json({msg : 'Restaurant not found!'});
    }
    catch(err) {
        console.log(err);
    }
}
export const GetOffersById = async(req: Request,res: Response,next: NextFunction) : Promise<any> => {
    const pincode = req.params.pincode;
    const offers = await Offer.find({pincode : pincode, isActive : true});
    console.log(offers);
    if(offers) {
        return res.status(200).json(offers);
    }
    return res.status(400).json({msg : "Offers not available!"});
}