"use client";
import { Block, BlockTitle } from "konsta/react";

const ProviderHome = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
      <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mb-6">
        <div className="text-3xl text-indigo-600 font-bold italic">BC</div>
      </div>
      <BlockTitle large className="mb-2">Provider Dashboard</BlockTitle>
      <Block className="text-slate-500">
        You are currently in Provider Mode. Your dashboard specialized for managing services, bookings, and customer interactions will appear here soon.
      </Block>
    </div>
  );
};

export default ProviderHome;
