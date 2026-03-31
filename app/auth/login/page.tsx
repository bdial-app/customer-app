"use client"
import { BlockTitle, List, ListInput, Page, Block, Button, Preloader } from "konsta/react";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function LoginPage() {
    const [mobile, setMobile] = useState("");
    const [otp, setOtp] = useState("");
    const [showOtp, setShowOtp] = useState(false);

    const mobileRegex = /^\d{10}$/;
    const isMobileValid = mobileRegex.test(mobile);

    const handleMobileSubmit = () => {
        if (isMobileValid) {
            setShowOtp(true);
        }
    };

    const handleBack = () => {
        setShowOtp(false);
        setOtp("");
    };

    return <Page className="flex flex-col justify-end" style={{
        background: 'radial-gradient(at 0% 10%, #f0eff4, #f0ecff)',
        
    }}>
         <Image src="/login-card.png" fill objectFit="contain" alt="Logo" />
        <Block className="mb-auto flex items-center gap-2 mb-0">
            <Image src="/vercel.svg" width={24} height={24} alt="Vercel Logo" />
            <p className="text-lg">Brand Name</p>
            
        </Block>
       
        <BlockTitle className="mt-auto z-10">Login</BlockTitle>
        <Block className="mb-0"> 
            <p>
                Donec et nulla auctor massa pharetra adipiscing ut sit amet sem.
            </p>
        </Block>
        <List strongIos insetIos className="mb-0">
            {!showOtp ? (
                <ListInput
                    label="Mobile Number"
                    type="tel"
                    placeholder="10 digit mobile number"
                    info="Enter 10 digit mobile number"
                    value={mobile}
                    error={
                        mobile && !isMobileValid ? 'Please enter valid 10 digit mobile number' : ''
                    }
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                />
            ) : (
                <ListInput
                    label="OTP"
                    type="tel"
                    placeholder="4 digit OTP"
                    info="Enter 4 digit OTP"
                    value={otp}
                    error={
                        otp && otp.length !== 4 ? 'Please enter 4 digit OTP' : ''
                    }
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                />
            )}
        </List>
        <Block>
            {!showOtp ? (
                <Button large rounded onClick={handleMobileSubmit} disabled={!isMobileValid}>
                    {/* {0 && <Preloader className="w-4 h-4 mr-4" />} */}
                    Get OTP
                </Button>
            ) : (
                <div className="flex gap-2">
                    <Button rounded clear onClick={handleBack} className="flex-1">
                        Back
                    </Button>
                    <Button large rounded disabled={otp.length !== 4} className="flex-1">
                        Verify OTP
                    </Button>
                </div>
            )}
        </Block>
        <Block className="my-0 text-center mb-4">
           <p>Don't have an account? <Link href={"/auth/signup"} className="text-blue-600">Create Account</Link></p>
        </Block>
    </Page>;
}