import express, {Request, Response, NextFunction} from 'express';
import { GetFoodAvailability, GetFoodsIn30Min, GetOffersById, GetTopRestaurants, RestaurantById, SearchFoods } from '../controllers';

const router = express.Router();


// ------------ Food Available -----------------
router.get('/:pincode', GetFoodAvailability);
// ------------ Top Restaurants -----------------
router.get('/top-restaurants/:pincode',GetTopRestaurants);
// ----------- Foods Available in 30 Minutes ------------
router.get('/foods-in-30-min/:pincode',GetFoodsIn30Min);
// ------------ Search Foods -------------
router.get('/search/:pincode',SearchFoods);
// ------------ Find Restaurnat By ID -------------
router.get('/restaurant/:id',RestaurantById);
//  ----------- Find Offers -------- 
router.get('/offers/:pincode',GetOffersById);

export { router as ShoppingRoute };