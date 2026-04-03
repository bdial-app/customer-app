import { IonIcon } from "@ionic/react";
import { chatbubbles, homeOutline, person } from "ionicons/icons";
import { Icon, Tabbar, TabbarLink, ToolbarPane } from "konsta/react";
import { useState } from "react";

interface BottomBarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const BottomBar = ({ activeTab, setActiveTab }: BottomBarProps) => {
  return (
    <Tabbar icons={true} labels={true} className="left-0 bottom-0 fixed">
      <ToolbarPane>
        <TabbarLink
          active={activeTab === "home"}
          onClick={() => setActiveTab("home")}
          icon={
            <Icon
              ios={<IonIcon className="w-6 h-6" icon={homeOutline} />}
              material={<IonIcon className="w-6 h-6" icon={homeOutline} />}
            />
          }
          label={"Home"}
        />
        <TabbarLink
          active={activeTab === "chats"}
          onClick={() => setActiveTab("chats")}
          icon={
            <Icon
              ios={<IonIcon className="w-6 h-6" icon={chatbubbles} />}
              material={<IonIcon className="w-6 h-6" icon={chatbubbles} />}
            />
          }
          label={"Chats"}
        />
        <TabbarLink
          active={activeTab === "profile"}
          onClick={() => setActiveTab("profile")}
          icon={
            <Icon
              ios={<IonIcon className="w-6 h-6" icon={person} />}
              material={<IonIcon className="w-6 h-6" icon={person} />}
            />
          }
          label={"Profile"}
        />
      </ToolbarPane>
    </Tabbar>
  );
};

export default BottomBar;
