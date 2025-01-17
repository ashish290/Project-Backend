import { Console } from "console";

// OTP :-
export const GenerateOtp = () => {
    const otp = Math.floor(100000 + Math.random() * 900000)
    let expiry = new Date();
    expiry.setTime(new Date().getTime() + (30 * 60 * 1000));
    return {otp, expiry};
}

export const onRequestOTP = async(otp : number, toPhoneNumber : string) => {
    const accountSid = "AC7d7a858ecf640af013ed95882ac5ac72";
    const authToken = "ad5aad3ed71088ce4726655bfcb55b38";
    const client = require('twilio')(accountSid, authToken);
    console.log(toPhoneNumber);

    const response = await client.messages.create({
        body : `Your OTP id ${otp}`,
        from : '+1 469 518 7607',
        to : `+91${toPhoneNumber}`,
    })
    return response;
}