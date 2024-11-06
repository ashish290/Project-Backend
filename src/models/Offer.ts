import mongoose,{Schema,Document} from "mongoose";

export interface OfferDoc extends Document {
    offerTypes : string;
    vandors : [any];
    title : string;
    description : string;
    minValue : number;
    offerAmount : number;
    startValidity : Date;
    endValidity : Date;
    promocode : string;
    promoType : string;
    bank : [any];
    pincode : string;
    bins : [any];
    isActive : boolean;
}

const OfferSchema = new Schema({
    offerTypes : String,
    vandors : [{
        type : Schema.Types.ObjectId, ref: 'vandor'
    }],
    title : String,
    description : String,
    minValue : String,
    offerAmount : Number,
    startValidity : Date,
    endValidity : Date,
    promocode : String,
    promoType : String,
    bank : [{
        type : String,
    }],
    pincode : String,
    bins : [{
        type : Number,
    }],
    isActive : Boolean,
}, {
    toJSON : {
        transform(doc, ret) {
            delete ret.__v
        }
    },
    timestamps : true
})

const Offer = mongoose.model<OfferDoc>('offer', OfferSchema);
export{Offer};