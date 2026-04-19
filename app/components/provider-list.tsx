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

  return (
    <Block className="!px-0 !mb-0">
      <div
        className={`pl-4 pr-4 no-scrollbar ${
          sliderMode
            ? "flex flex-row gap-3 overflow-x-auto pb-2"
            : "grid grid-cols-2 gap-2"
        }`}
      >
        {providerList.map((provider: any, index: number) => (
          <div
            key={provider.id}
            onClick={() => handleNavigate(provider.id)}
            className={`cursor-pointer bg-white rounded-md relative flex flex-col ${
              sliderMode
                ? "w-[130px] shrink-0"
                : index % 2 !== 0
                  ? "relative top-10"
                  : ""
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
      {!sliderMode && <div className="h-20"></div>}
    </Block>
  );
};

export default ProviderList;
