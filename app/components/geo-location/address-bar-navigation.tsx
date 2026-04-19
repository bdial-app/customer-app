import { IonIcon } from "@ionic/react";
import { Button } from "konsta/react";
import Image from "next/image";
import React from "react";
import { BiChevronRight } from "react-icons/bi";

const AddressBarNavigation = ({
  title,
  address,
  isLoading,
  hideIcon = false,
  hideChevron = false,
}: {
  title: string;
  address: string;
  isLoading?: boolean;
  hideIcon?: boolean;
  hideChevron?: boolean;
}) => {
  return (
    <div className={`flex items-center ${hideIcon ? "" : "gap-4"}`}>
      {!hideIcon && (
        <Image src="/vercel.svg" alt="Location" width={32} height={32} />
      )}

      <div className="flex-1 flex gap-2 items-center px-3 py-1 bg-slate-700/5 hover:bg-slate-700/15 active:bg-slate-700/10 rounded-lg cursor-pointer overflow-hidden">
        <div className="flex flex-col gap-0 flex-1 min-w-0 py-0.5">
          {isLoading ? (
            <div className="flex flex-col gap-2">
              <div className="h-5 w-24 bg-slate-200 animate-pulse rounded"></div>
              <div className="h-3 w-40 bg-slate-100 animate-pulse rounded mt-1"></div>
            </div>
          ) : (
            <>
              <div className="title text-lg font-medium truncate leading-tight">
                {title}
              </div>
              <div className="address text-sm text-slate-600 truncate">
                {address}
              </div>
            </>
          )}
        </div>
        {!hideChevron && <BiChevronRight className="text-2xl flex-shrink-0" />}
      </div>
    </div>
  );
};

export default AddressBarNavigation;
