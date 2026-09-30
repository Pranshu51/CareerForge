import razorpay from "../configs/razorpay.js";
import Billing from "../models/billing.model.js";
import crypto from "crypto"



const PLANS = {
    starter: {
        amount: 199,
        interviewCoins: 300,
    },
};

export const createOrder = async (req, res) => {
    try {
        const { planId } = req.body
        const userId = req.headers["x-user-id"]
        const plan = PLANS[planId]

        if (!plan) {
            return res.status(400).json({
                success: false,
                message: "Invalid plan",
            });
        }

        const order = await razorpay.orders.create({
            amount: plan.amount * 100,
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
        })

        await Billing.create({
            userId,
            amount: plan.amount,
            interviewCoins: plan.interviewCoins,
            razorpayOrderId: order.id,
            status: "created",
        })

        return res.status(201).json({
            success: true,
            order,
        })

    } catch (error) {
        console.log(error)
        return res.status(500).json({
            success: false,
            message: "Failed to create order",
        });
    }
}

export const verifyPayment = async (req, res) => {
    try {

        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
        } = req.body

        const payment = await Billing.findOne({
            razorpayOrderId:razorpay_order_id
        })
        if(!payment){
             return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
        }

        const genSign = crypto.createHmac("sha256",process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`).digest("hex")

        if(genSign !== razorpay_signature){
            payment.status = "failed";
            await payment.save()
            return res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
        }

        if (payment.status === "paid") {
      return res.status(200).json({
        success: true,
        message: "Payment already verified",
      });
    }

    payment.status = "paid"
    payment.razorpayPaymentId = razorpay_payment_id
    payment.razorpaySignature = razorpay_signature

    await payment.save()

    return res.status(200).json({
      success: true,
      message: "Payment successful",
    });
    } catch (error) {

        console.log(error);

    if (req.body?.razorpay_order_id) {
      await Payment.findOneAndUpdate(
        {
          razorpayOrderId: req.body.razorpay_order_id,
        },
        {
          status: "failed",
        }
      );
    }

    return res.status(500).json({
      success: false,
      message: "Payment verification failed",
    });

    }
}
