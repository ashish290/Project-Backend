import express, { Request, Response, NextFunction} from 'express';
import { AddFood, AddOffer, EditOffer, GetCurrentOrders, GetFoods, GetOffers, GetOrders, GetOrdersDetails, GetVandorProfile, ProcessOrders, UpdateVandorCoverImage, UpdateVandorProfile, UpdateVandorService, VandorLogin } from '../controllers';
import multer from 'multer';
import { Authenticate } from '../middleware';

const router = express.Router();

const imageStorage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'images')
    },
    filename: function(req,file,cb) {
        cb(null, new Date().toISOString+'_'+file.originalname)
    }
});

const images = multer({storage: imageStorage}).array('images',10);

router.post('/login',VandorLogin);

router.use(Authenticate);
router.get('/profile',GetVandorProfile);
router.patch('/profile',UpdateVandorProfile);
router.patch('/coverimage', images, UpdateVandorCoverImage);
router.patch('/service',UpdateVandorService);

router.post('/food', images, AddFood);
router.get('/foods',GetFoods);

// Order
router.get('/orders',GetCurrentOrders);
router.put('/order/:id/process',ProcessOrders);
router.get('/order/:id',GetOrdersDetails);

// -------- Offer --------
router.post('/offer',AddOffer);
router.get('/offers',GetOffers);
router.put('/offer/:id',EditOffer);


router.get('/',(req : Request, res : Response,next : NextFunction) : void => {
    res.json({
        message : 'Hello Vandor',
    })
});

export {router as VandorRoute};