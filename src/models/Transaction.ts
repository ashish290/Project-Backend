import mongoose,{Schema,Document} from "mongoose";

export interface TransactionDoc extends Document {
    customer: string;
    vandorId: string;
    orderId: string;
    orderValue: number;
    offerUsed: string;
    status: string;
    paymentMode: string;
    paymentResponse: string;
}

const TransactionSchema = new Schema({
    customer: String,
    vandorId: String,
    orderId: String,
    orderValue: Number,
    offerUsed: String,
    status: String,
    paymentMode: String,
    paymentResponse: String
}, {
    toJSON : {
        transform(doc, ret) {
            delete ret.__v,
            delete ret.createdAt,
            delete ret.updatedAt
        }
    },
    timestamps : true
})

const Transaction = mongoose.model<TransactionDoc>('transaction', TransactionSchema);
export{Transaction};