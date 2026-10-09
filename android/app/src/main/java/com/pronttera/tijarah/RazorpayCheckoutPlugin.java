package com.pronttera.tijarah;

import android.content.Intent;

import androidx.activity.result.ActivityResult;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.razorpay.Checkout;
import com.razorpay.CheckoutActivity;
import com.razorpay.ExternalWalletListener;
import com.razorpay.PaymentData;
import com.razorpay.PaymentResultWithDataListener;

/**
 * Native Razorpay checkout for Android.
 *
 * The web checkout.js can't launch UPI apps from inside a WebView, so it hides
 * UPI/wallet options. This plugin hands the same order/subscription options to
 * Razorpay's native CheckoutActivity, which shows the full method list (UPI
 * intent, wallets, cards, net-banking) using the device's installed UPI apps.
 *
 * Options are the standard Razorpay checkout options (key, amount, currency,
 * order_id / subscription_id, name, description, prefill, theme). The success
 * payload is returned under `response` as { razorpay_payment_id,
 * razorpay_order_id, razorpay_signature }.
 */
@CapacitorPlugin(name = "RazorpayCheckout")
public class RazorpayCheckoutPlugin extends Plugin {

    @PluginMethod
    public void open(PluginCall call) {
        // Keep the call alive across the Activity round-trip.
        call.setKeepAlive(true);

        JSObject options = call.getData();
        Intent intent = new Intent(getActivity(), CheckoutActivity.class);
        intent.putExtra("OPTIONS", options.toString());
        intent.putExtra("FRAMEWORK", "capacitor");
        startActivityForResult(call, intent, "onCheckoutResult");
    }

    @ActivityCallback
    private void onCheckoutResult(PluginCall call, ActivityResult result) {
        if (call == null) {
            return;
        }

        Checkout.handleActivityResult(
            getActivity(),
            Checkout.RZP_REQUEST_CODE,
            result.getResultCode(),
            result.getData(),
            new PaymentResultWithDataListener() {
                @Override
                public void onPaymentSuccess(String razorpayPaymentId, PaymentData paymentData) {
                    JSObject ret = new JSObject();
                    try {
                        // paymentData.getData() carries razorpay_payment_id,
                        // razorpay_order_id and razorpay_signature.
                        ret.put("response", paymentData.getData());
                    } catch (Exception e) {
                        JSObject fallback = new JSObject();
                        fallback.put("razorpay_payment_id", razorpayPaymentId);
                        ret.put("response", fallback);
                    }
                    call.resolve(ret);
                }

                @Override
                public void onPaymentError(int code, String description, PaymentData paymentData) {
                    call.reject(description, String.valueOf(code));
                }
            },
            new ExternalWalletListener() {
                @Override
                public void onExternalWalletSelected(String walletName, PaymentData paymentData) {
                    // External wallet (e.g. PayZapp) selected but not completed in-app.
                    call.reject("External wallet selected: " + walletName, "EXTERNAL_WALLET");
                }
            }
        );
    }
}
