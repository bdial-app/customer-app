"use client";
/* eslint-disable react/no-array-index-key */
import React, { useState, useRef, useEffect } from "react";
import {
  Page,
  Navbar,
  NavbarBackLink,
  Messagebar,
  Messages,
  Message,
  MessagesTitle,
  Link,
  Icon,
  ToolbarPane,
} from "konsta/react";
import { arrowBack, arrowUpCircle, camera, search } from "ionicons/icons";
import { MdCameraAlt, MdSend } from "react-icons/md";
import { IonIcon } from "@ionic/react";

interface MessagesPageProps {
  onBack: () => void;
  chatName?: string;
}

export default function MessagesPage({
  onBack,
  chatName = "Messages",
}: MessagesPageProps) {
  const [messageText, setMessageText] = useState("");
  const [messagesData, setMessagesData] = useState([
    {
      type: "sent",
      text: "Hi, Kate",
    },
    {
      type: "sent",
      text: "How are you?",
    },
    {
      name: "Kate",
      type: "received",
      text: "Hi, I am good!",
      avatar: "https://cdn.framework7.io/placeholder/people-100x100-9.jpg",
    },
    {
      name: "Blue Ninja",
      type: "received",
      text: "Hi there, I am also fine, thanks! And how are you?",
      avatar: "https://cdn.framework7.io/placeholder/people-100x100-7.jpg",
    },
    {
      type: "sent",
      text: "Hey, Blue Ninja! Glad to see you ;)",
    },
    {
      type: "sent",
      text: "How do you feel about going to the movies today?",
    },
    {
      name: "Kate",
      type: "received",
      text: " Oh, great idea!",
      avatar: "https://cdn.framework7.io/placeholder/people-100x100-9.jpg",
    },
    {
      name: "Kate",
      type: "received",
      text: " What cinema are we going to?",
      avatar: "https://cdn.framework7.io/placeholder/people-100x100-9.jpg",
    },
    {
      name: "Blue Ninja",
      type: "received",
      text: "Great. And what movie?",
      avatar: "https://cdn.framework7.io/placeholder/people-100x100-7.jpg",
    },
    {
      name: "Blue Ninja",
      type: "received",
      text: "What time?",
      avatar: "https://cdn.framework7.io/placeholder/people-100x100-7.jpg",
    },
  ]);

  const pageRef = useRef<any>(null);
  const initiallyScrolled = useRef(false);

  const scrollToBottom = () => {
    const pageElement = pageRef.current?.el || pageRef.current;
    if (pageElement) {
      pageElement.scrollTo({
        top: pageElement.scrollHeight - pageElement.offsetHeight,
        behavior: initiallyScrolled.current ? "smooth" : "auto",
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
    initiallyScrolled.current = true;
  }, [messagesData]);

  const handleSendClick = () => {
    const text = messageText.replace(/\n/g, "<br>").trim();
    const type = "sent";
    const messagesToSend = [];
    if (text.length) {
      messagesToSend.push({
        text,
        type: type as any,
      });
    }
    if (messagesToSend.length === 0) {
      return;
    }
    setMessagesData([...messagesData, ...messagesToSend]);
    setMessageText("");
  };

  const inputOpacity = messageText ? 1 : 0.3;
  const isClickable = messageText.trim().length > 0;

  const currentDate = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  })
    .formatToParts(new Date())
    .map((part) => {
      if (["weekday", "month", "day"].includes(part.type)) {
        return <b key={part.type}>{part.value}</b>;
      }
      return part.value;
    });

  return (
    <Page className="ios:bg-white ios:dark:bg-black !pb-20" ref={pageRef}>
      <Navbar title={chatName} left={<NavbarBackLink onClick={onBack} />} />
      <Messages>
        <MessagesTitle>{currentDate}</MessagesTitle>
        {messagesData.map((message, index) => (
          <Message
            key={index}
            type={message.type as any}
            name={message.name}
            text={message.text}
            avatar={
              message.type === "received" && (
                <img
                  alt="avatar"
                  src={message.avatar}
                  className="w-8 h-8 rounded-full"
                />
              )
            }
          />
        ))}
      </Messages>
      <Messagebar
        className="z-20 fixed bottom-0 left-0"
        placeholder="Message"
        value={messageText}
        onInput={(e: any) => setMessageText(e.target.value)}
        // left={
        //   <ToolbarPane className="ios:h-10">
        //     <Link onClick={() => console.log('click')} iconOnly>
        //       <Icon
        //         ios={<Icon ios={<CameraFill className="w-5 h-5" />} />}
        //         material={
        //           <MdCameraAlt className="w-6 h-6 fill-black dark:fill-md-dark-on-surface" />
        //         }
        //       />
        //     </Link>
        //   </ToolbarPane>
        // }
        right={
          <ToolbarPane className="ios:h-10">
            <Link
              onClick={isClickable ? handleSendClick : undefined}
              iconOnly
              style={{
                opacity: inputOpacity,
                cursor: isClickable ? "pointer" : "default",
              }}
            >
              <Icon
                ios={
                  <IonIcon
                    icon={arrowUpCircle}
                    className={`w-7 h-7${isClickable ? " text-primary" : ""}`}
                  />
                }
                material={
                  <MdSend className="w-6 h-6 fill-black dark:fill-md-dark-on-surface" />
                }
              />
            </Link>
          </ToolbarPane>
        }
      />
    </Page>
  );
}
