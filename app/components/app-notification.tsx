"use client";
import { Notification } from "konsta/react";
import { useNotification } from "@/app/context/NotificationContext";

export const AppNotification = () => {
  const { open, options, dismiss } = useNotification();

  return (
    <Notification
      opened={open}
      title={options?.title ?? ""}
      subtitle={options?.subtitle ?? ""}
      button
      onClick={dismiss}
    />
  );
};
