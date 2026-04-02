import { ROUTE_PATH } from "@/utils/contants"
import { IonIcon } from "@ionic/react"
import { location, star } from "ionicons/icons"
import { Link, List, ListItem } from "konsta/react"

const ProviderList = ({ providerList }: { providerList: any[] }) =>
  <List strongIos outlineIos className="mt-4">
    {providerList.map((provider: any) => (
      <Link key={provider.id} href={ROUTE_PATH.PROVIDER_DETAILS}>
        <ListItem
          className="material:border-b material:border-b-slate-300"
          link
          title={
            <div className="flex items-center gap-2">
              <span>{provider.name}</span>
              {/* {provider.verified && (
                  <span className="absolute- left-[-8em] top-4 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                    ✓ Verified
                  </span>
                )} */}
            </div>
          }
          subtitle={
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-1">
                <IonIcon icon={star} className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-medium">{provider.rating}</span>
                <span className="text-sm text-gray-500">({provider.reviews})</span>
              </div>
              <div className="flex items-center gap-1 text-gray-600">
                  <IonIcon icon={location} className="w-4 h-4" />
                  <span className="text-sm">{provider.location}</span>
                </div>
            </div>
          }
          text={
            <div className="flex flex-col mt-2">
              <p className="line-clamp-1 overflow-hidden text-ellipsis">{provider.description}</p>
              {/* <div className="flex gap-2 mt-2">
                <Button outline className="p-0 min-w-0">
                  <IonIcon icon={chatbubble} className="w-4 h-4" /> <span className="ml-2">Chat</span>
                </Button>
                <Button className="p-0 min-w-0">
                  <IonIcon icon={call} className="w-4 h-4" /> <span className="ml-2">Call</span>
                </Button>
              </div> */}
            </div>
          }
          media={
            <img
              className="ios:rounded-lg material:rounded-lg ios:w-20 material:w-20 h-20"
              src={provider.image}
              width="80"
              alt={provider.name}
            />
          }
        />
      </Link>
    ))}
  </List>


export default ProviderList