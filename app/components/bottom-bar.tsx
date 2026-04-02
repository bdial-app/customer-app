import { IonIcon } from "@ionic/react"
import { chatbubbles, homeOutline, person } from "ionicons/icons"
import { Icon, Tabbar, TabbarLink, ToolbarPane } from "konsta/react"
import { useState } from "react"

const BottomBar = () => {
    const [activeTab, setActiveTab] = useState('tab-1')
    return <Tabbar
        icons={true}
        labels={true}
        className="left-0 bottom-0 fixed"
    >
        <ToolbarPane>
            <TabbarLink
                active={activeTab === 'tab-1'}
                onClick={() => setActiveTab('tab-1')}
                icon={
                    <Icon
                        ios={<IonIcon className="w-6 h-6" icon={homeOutline} />}
                        material={<IonIcon className="w-6 h-6" icon={homeOutline} />}
                    />
                }
                label={'Home'}
            />
            <TabbarLink
                active={activeTab === 'tab-2'}
                onClick={() => setActiveTab('tab-2')}
                icon={
                    <Icon
                        ios={<IonIcon className="w-6 h-6" icon={chatbubbles} />}
                        material={<IonIcon className="w-6 h-6" icon={chatbubbles} />}
                    />
                }
                label={'Chats'}
            />
            <TabbarLink
                active={activeTab === 'tab-3'}
                onClick={() => setActiveTab('tab-3')}
                icon={
                    <Icon
                        ios={<IonIcon className="w-6 h-6" icon={person} />}
                        material={<IonIcon className="w-6 h-6" icon={person} />}
                    />
                }
                label={'Profile'}
            />
        </ToolbarPane>
    </Tabbar>
}

export default BottomBar