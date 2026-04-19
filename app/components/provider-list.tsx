import { ROUTE_PATH } from "@/utils/contants";
import { IonIcon } from "@ionic/react";
import { location, star } from "ionicons/icons";
import { Block, List, ListItem } from "konsta/react";
import { useRouter } from "next/navigation";

const ProviderList = ({
  providerList,
  sliderMode,
}: {
  providerList: any[];
  sliderMode?: boolean;
}) => {
  const router = useRouter();

  const handleNavigate = (id: string) => {
    router.push(`${ROUTE_PATH.PROVIDER_DETAILS}?id=${id}`);
  };

  return 1 ? (
    <Block className="!px-0 !mb-0">
      <div
        className={`pl-4 pr-4 no-scrollbar ${
          sliderMode
            ? "flex flex-row gap-3 overflow-x-auto pb-2"
            : "grid grid-cols-2 gap-2"
        }`}
      >
        {providerList.map((provider: any) => (
          <div
            key={provider.id}
            onClick={() => handleNavigate(provider.id)}
            className={`cursor-pointer bg-white rounded-md relative flex flex-col ${
              sliderMode ? "w-[130px] shrink-0" : ""
            }`}
          >
            {/* Image with its own overflow-hidden for rounded corners */}
            <div className="overflow-hidden rounded-t-lg">
              <img
                src={provider.image}
                alt={provider.name}
                className="w-full h-40 object-cover"
              />
            </div>

            {/* Women-Led chip — absolute top-right over image, not clipped */}
            {provider.womenLed && (
              <span
                className="absolute top-2 right-2 z-10 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold leading-none shadow-sm"
                style={{
                  background: "linear-gradient(135deg, #F0E6FF, #FFE6F0)",
                  color: "#9B59B6",
                }}
              >
                ♀ Women-Led
              </span>
            )}

            <div className="p-2 flex flex-col gap-1">
              <span className="text-sm font-medium line-clamp-1">
                {provider.name}
              </span>

              {/* Star rating */}
              {provider.rating && (
                <div className="flex items-center gap-1">
                  <IonIcon icon={star} className="w-3 h-3 text-yellow-400" />
                  <span className="text-xs font-medium text-gray-700">
                    {provider.rating}
                  </span>
                  {provider.reviews && (
                    <span className="text-xs text-gray-400">
                      ({provider.reviews})
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </Block>
  ) : (
    <List strongIos outlineIos className="mt-4">
      {providerList.map((provider: any) => (
        <ListItem
          key={provider.id}
          onClick={() => handleNavigate(provider.id)}
          className="cursor-pointer material:border-b material:border-b-slate-300"
          title={
            <div className="flex items-center gap-2 flex-wrap">
              <span>{provider.name}</span>
              {provider.womenLed && (
                <span
                  className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-semibold leading-none"
                  style={{
                    background: "linear-gradient(135deg, #F0E6FF, #FFE6F0)",
                    color: "#9B59B6",
                  }}
                >
                  ♀ Women-Led
                </span>
              )}
            </div>
          }
          subtitle={
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-1">
                <IonIcon icon={star} className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-medium">{provider.rating}</span>
                <span className="text-sm text-gray-500">
                  ({provider.reviews})
                </span>
              </div>
              <div className="flex items-center gap-1 text-gray-600">
                <IonIcon icon={location} className="w-4 h-4" />
                <span className="text-sm">{provider.location}</span>
              </div>
            </div>
          }
          text={
            <div className="flex flex-col mt-2">
              <p className="line-clamp-1 overflow-hidden text-ellipsis">
                {provider.description}
              </p>
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
      ))}
      <div className="h-40"></div>
    </List>
  );
};

export default ProviderList;
