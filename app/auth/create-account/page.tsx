"use client"
import { BlockTitle, List, ListInput, Page, Block, Button, Preloader, Navbar } from "konsta/react";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ROUTE_PATH } from "@/utils/contants";

type CreateAccountStep = 'mobile' | 'otp' | 'details';

interface UserDetails {
    name: string;
    gender: 'male' | 'female' | 'other';
    city: string;
    area: string;
    pincode: string;
}

export default function CreateAccountPage() {
    const [currentStep, setCurrentStep] = useState<CreateAccountStep>('mobile');
    const [mobile, setMobile] = useState("");
    const [otp, setOtp] = useState("");
    const [userDetails, setUserDetails] = useState<UserDetails>({
        name: '',
        gender: 'male',
        city: '',
        area: '',
        pincode: ''
    });

    const mobileRegex = /^\d{10}$/;
    const isMobileValid = mobileRegex.test(mobile);

    const handleMobileSubmit = () => {
        if (isMobileValid) {
            setCurrentStep('otp');
        }
    };

    const handleOtpSubmit = () => {
        if (otp.length === 4) {
            setCurrentStep('details');
        }
    };

    const handleBack = () => {
        if (currentStep === 'otp') {
            setCurrentStep('mobile');
            setOtp("");
        } else if (currentStep === 'details') {
            setCurrentStep('otp');
        }
    };

    const handleDetailsSubmit = () => {
        // TODO: API call to create account
        console.log('Creating account with:', { mobile, userDetails });
    };

    const isFormValid = userDetails.name.trim() !== '' &&
        userDetails.city.trim() !== '' &&
        userDetails.pincode.trim() !== '';

    return (
        <Page className="flex flex-col justify-end" style={{
            background: 'radial-gradient(at 0% 10%, #f0eff4, #f0ecff)',
        }}>
            <Navbar right={<p className="min-w-18 text-center"><Link href={ROUTE_PATH.HOME}>Skip</Link></p>}
            />
            <Image src="/login-card.png" fill objectFit="contain" alt="Logo" />

            <Block className="mb-auto flex items-center gap-2 mb-0">
                <Image src="/vercel.svg" width={24} height={24} alt="Vercel Logo" />
                <p className="text-lg">Brand Name</p>
            </Block>

            <BlockTitle className="mt-auto z-10">Create Account</BlockTitle>
            <Block className="mb-0">
                <p>
                    {currentStep === 'mobile' && "Enter your mobile number to get started"}
                    {currentStep === 'otp' && "We've sent a verification code to your mobile"}
                    {currentStep === 'details' && "Tell us a bit about yourself"}
                </p>
            </Block>

            <List strongIos insetIos>
                {currentStep === 'mobile' && (
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
                )}

                {currentStep === 'otp' && (
                    <ListInput
                        label="OTP"
                        type="tel"
                        placeholder="4 digit OTP"
                        info="Enter 4 digit OTP sent to your mobile"
                        value={otp}
                        error={
                            otp && otp.length !== 4 ? 'Please enter 4 digit OTP' : ''
                        }
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    />
                )}

                {currentStep === 'details' && (
                    <>
                        <ListInput
                            label="Full Name"
                            type="text"
                            placeholder="Enter your full name"
                            value={userDetails.name}
                            onChange={(e) => setUserDetails(prev => ({ ...prev, name: e.target.value }))}
                        />

                        <div className="px-4 py-2">
                            <label className="block text-sm font-medium mb-2">Gender</label>
                            <div className="flex gap-2">
                                <Button
                                    rounded
                                    outline={userDetails.gender !== 'male'}
                                    onClick={() => setUserDetails(prev => ({ ...prev, gender: 'male' }))}
                                    className="flex-1"
                                >
                                    Male
                                </Button>
                                <Button
                                    rounded
                                    outline={userDetails.gender !== 'female'}
                                    onClick={() => setUserDetails(prev => ({ ...prev, gender: 'female' }))}
                                    className="flex-1"
                                >
                                    Female
                                </Button>
                                <Button
                                    rounded
                                    outline={userDetails.gender !== 'other'}
                                    onClick={() => setUserDetails(prev => ({ ...prev, gender: 'other' }))}
                                    className="flex-1"
                                >
                                    Other
                                </Button>
                            </div>
                        </div>

                        <ListInput
                            label="City"
                            type="text"
                            placeholder="Enter your city"
                            value={userDetails.city}
                            onChange={(e) => setUserDetails(prev => ({ ...prev, city: e.target.value }))}
                        />

                        <ListInput
                            label="Area"
                            type="text"
                            placeholder="Enter your area (optional)"
                            value={userDetails.area}
                            onChange={(e) => setUserDetails(prev => ({ ...prev, area: e.target.value }))}
                        />

                        <ListInput
                            label="Pincode"
                            type="text"
                            placeholder="Enter your pincode"
                            value={userDetails.pincode}
                            onChange={(e) => setUserDetails(prev => ({ ...prev, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                        />
                    </>
                )}
            </List>

            <Block>
                {currentStep === 'mobile' && (
                    <Button large rounded onClick={handleMobileSubmit} disabled={!isMobileValid}>
                        Get OTP
                    </Button>
                )}

                {currentStep === 'otp' && (
                    <div className="flex gap-2">
                        <Button rounded clear onClick={handleBack} className="flex-1">
                            Back
                        </Button>
                        <Button large rounded disabled={otp.length !== 4} className="flex-1" onClick={handleOtpSubmit}>
                            Verify OTP
                        </Button>
                    </div>
                )}

                {currentStep === 'details' && (
                    <div className="flex gap-2">
                        <Button rounded clear onClick={handleBack} className="flex-1">
                            Back
                        </Button>
                        <Button large rounded disabled={!isFormValid} className="flex-1" onClick={handleDetailsSubmit}>
                            Create Account
                        </Button>
                    </div>
                )}
            </Block>

            <Block className="my-0 text-center mb-4">
                <p>Already have an account? <Link href={ROUTE_PATH.LOGIN} className="text-blue-600">Login</Link></p>
            </Block>
        </Page>
    );
}
