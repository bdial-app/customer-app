import { IonIcon } from "@ionic/react";
import {
  analyticsOutline,
  chatbubbles,
  homeOutline,
  person,
} from "ionicons/icons";
import { Icon, Tabbar, TabbarLink, ToolbarPane } from "konsta/react";
import { useAppContext } from "../context/AppContext";

interface BottomBarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const BottomBar = ({ activeTab, setActiveTab }: BottomBarProps) => {
  const { userMode } = useAppContext();
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
        {userMode === "provider" && (
          <TabbarLink
            active={activeTab === "analytics"}
            onClick={() => setActiveTab("analytics")}
            icon={
              <Icon
                ios={<IonIcon className="w-6 h-6" icon={analyticsOutline} />}
                material={
                  <IonIcon className="w-6 h-6" icon={analyticsOutline} />
                }
              />
            }
            label={"Analytics"}
          />
        )}
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
