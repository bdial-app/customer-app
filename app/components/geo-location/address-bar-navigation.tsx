import { IonIcon } from "@ionic/react";
import { Button } from "konsta/react";
import Image from "next/image";
import React from "react";
import { BiChevronRight } from "react-icons/bi";

const AddressBarNavigation = ({
  title,
  address,
}: {
  title: string;
  address: string;
}) => {
  return (
    <div className="flex gap-4">
      <Image src="/vercel.svg" alt="Location" width={32} height={32} />

      <div className="flex-1 flex gap-2 items-center px-3 py-1 bg-slate-700/5 hover:bg-slate-700/15 active:bg-slate-700/10 rounded-lg cursor-pointer">
        <div className="flex flex-col gap-0 flex-1">
          <div className="title text-lg font-medium">{title}</div>
          <div className="address text-sm text-slate-600 relative top-[-4px]">
            {address}
          </div>
        </div>
        <BiChevronRight className="text-2xl" />
      </div>
    </div>
  );
};

export default AddressBarNavigation;
