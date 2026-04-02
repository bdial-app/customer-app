"use client"
import { Block, Navbar, Searchbar, Button, Card, Page, List, ListItem, Fab, Tabbar, ToolbarPane, TabbarLink, Icon } from "konsta/react";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { IonIcon } from "@ionic/react";
import { chatbubbles, heartOutline, heartSharp, homeOutline, person } from 'ionicons/icons';
import { ROUTE_PATH } from "@/utils/contants";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");

  const banners = [
    {
      id: 1,
      title: "Special Offer",
      subtitle: "Get 20% off on all services",
      image: "/banner1.jpg"
    },
    {
      id: 2,
      title: "New Providers",
      subtitle: "Join our growing network",
      image: "/banner2.jpg"
    },
    {
      id: 3,
      title: "Premium Services",
      subtitle: "Experience the best quality",
      image: "/banner3.jpg"
    }
  ];

  const [activeTab, setActiveTab] = useState('tab-1');

  return (
    <Page style={{
      background: 'radial-gradient(at 0% 10%, #f0eff4, #f0ecff)',
    }}>
      <Navbar
        medium
        centerTitle={false}
        className="text-left"
        title={"Welcome, Anonymous!"}
        titleClassName="mb-2!"
        subtitle="Discover amazing services"
      />

      <Block className="mt-4 mb-0!">
        <Searchbar
          placeholder="Search services or providers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          clearButton
        />
      </Block>

      <Block>

        <div className="overflow-x-auto -mx-4 px-4">
          <div className="flex gap-0" style={{ width: 'max-content' }}>
            {banners.map((banner) => (
              <Card
                key={banner.id}
                className="w-80 flex-shrink-0 rounded-lg"
                style={{
                  backgroundImage: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url(${banner.image})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  minHeight: '180px'
                }}

              >
                <div className="text-white p-4 flex flex-col justify-end h-full">
                  <h3 className="text-xl font-bold mb-1">{banner.title}</h3>
                  <p className="text-sm opacity-90">{banner.subtitle}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </Block>

      <Navbar
        centerTitle={false}
        className="text-left"
        title="Featured Services"
        titleClassName="text-slate-600"
        subtitle="Discover amazing services"
        rightClassName="bg-transparent shadow-none"
        right={<Link href={ROUTE_PATH.ALL_SERVICES}><Button small clear>See All</Button></Link>}
      />

      <List strongIos outlineIos className="mt-4" >
        <ListItem
          className="material:border-b material:border-b-slate-300"
          link
          title="Clothing"
          after="View"
          subtitle="Rida, Burqa and other garments"
          text="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla sagittis tellus ut turpis condimentum, ut dignissim lacus tincidunt. Cras dolor metus, ultrices condimentum sodales sit amet, pharetra sodales eros. Phasellus vel felis tellus. Mauris rutrum ligula nec dapibus feugiat. In vel dui laoreet, commodo augue id, pulvinar lacus."
          media={
            <img
              className="ios:rounded-lg material:rounded-lg ios:w-20 material:w-20 h-20"
              src="https://i.pinimg.com/originals/fc/6a/be/fc6abe6990d4faab93760ac471745a6d.jpg"
              width="80"
              alt="demo"
            />
          }
        />
      </List>

       <Tabbar
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

      {/* Floating Icon */}
       {/* <Fab className="fixed right-safe-8 bottom-safe-24 z-20" icon={<IonIcon icon={chatbubbles} />} /> */}
    </Page>
  );
}
