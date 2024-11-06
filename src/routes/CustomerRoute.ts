import express,{Request,Response,NextFunction} from "express";
import { CustomerLogin, RequestOTP, CustomerSignUp, CustomerVerify, EditCustomerProfile, GetCustomerProfile, CreateOrder, GetOrders, GetOrderById, addtoCart, GetCart, DeleteCart, ApplyOffers, CreatePayment } from "../controllers";
import { Authenticate } from "../middleware";

const router = express.Router();

// ------------ SignUp / Create Customer ------------ 
router.post('/signup',CustomerSignUp);
// ------------ Login ------------ 
router.post('/login',CustomerLogin);

// after this line we need to authentication feature
router.use(Authenticate);
// ------------ Verify Customer Account ------------ 
router.patch('/verfiy',CustomerVerify);
// ------------ OTP / Requesting OTP ------------ 
router.get('/otp',RequestOTP);
// ------------ Profile ------------ 
router.get('/profile',GetCustomerProfile);
router.patch('/profile',EditCustomerProfile);

// ---------------- Cart ----------------
router.post('/cart', addtoCart);
router.get('/cart',GetCart);
router.delete('/cart',DeleteCart);

// ------- Apply Offer --------
router.get('/offer/verify/:id',ApplyOffers);

// -------- Payment -------
router.post('/create-payment',CreatePayment);


// ------------ Order ------------ 
router.post('/create-order',CreateOrder);
router.get('/orders',GetOrders);
router.get('/order/:id',GetOrderById);

export {router as CustomerRoute};