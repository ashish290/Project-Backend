import express,{ Application } from 'express';
import path from 'path';

import { AdminRoute, ShoppingRoute, VandorRoute, CustomerRoute } from '../routes';

export default async (app : Application) => {
    app.use(express.json());
    app.use(express.urlencoded({ extended : true}));

    const imagePath = path.join(__dirname, '../images');
    app.use('/images', express.static(imagePath));

    app.use('/admin',AdminRoute);
    app.use('/vandor',VandorRoute);
    app.use('/customer', CustomerRoute);
    app.use('/shopping',ShoppingRoute);

    return app;
}