import express from "express";
import App from "./services/ExpressApp";
import dbConnection from "./services/Database";
import { PORT } from "./config";

const StartServer = async () => {
  const app = express();

  await dbConnection();

  await App(app);

  app.listen(PORT, () => {
    console.log(`Listening to port ${PORT}`);
  });
};

StartServer();

// import express from 'express';
// import bodyParser from 'body-parser';
// import mongoose from 'mongoose';
// import path from 'path';

// import { AdminRoute, VandorRoute } from './routes';
// import { MONGO_URL } from './config';

// const app = express();

// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended : true}));
// app.use('/images', express.static(path.join(__dirname, 'images')));

// app.use('/admin',AdminRoute);
// app.use('/vandor',VandorRoute);

// mongoose.connect(MONGO_URL).then(result => {
//     console.log('Connection Successful')
// }).catch(err => console.log('error' + err));

// app.listen(8000,  () => {
//     console.clear();
//     console.log("App is listing to port : 8000");
// });
