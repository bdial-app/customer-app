import { Block } from "konsta/react";
import { ROUTE_PATH } from "@/utils/contants";
import SectionHeader from "./section-header";
import ProviderList, { type ProviderCard } from "./provider-list";
import { useExploreFeed } from "@/hooks/useExplore";
import { trackAdEvent } from "@/services/explore.service";

/**
 * Boosted businesses.
 *
 * Renders nothing at all when there is nothing to show — no boosts running, the
 * platform boost switch off, or the request failed — so the home screen looks
 * normal rather than showing an empty band.
 */
const SponsoredList = () => {
  const { data, isLoading } = useExploreFeed();
  const sponsored = data?.sponsored ?? [];

  if (isLoading || sponsored.length === 0) return null;

  /**
   * Bill the click. Impressions are counted server-side when the feed is built,
   * so sending them from here would charge the advertiser twice.
   */
  const handleItemClick = (provider: ProviderCard) => {
    if (!provider.sponsoredListingId) return;
    trackAdEvent({
      eventType: "click",
      entityType: "sponsored_listing",
      entityId: provider.sponsoredListingId,
      position: "home_sponsored_carousel",
    });
  };

  return (
    <Block strong inset outline className="!p-0 !mb-2">
      <SectionHeader
        title="Sponsored"
        subtitle="Businesses promoting with Tijarah"
        navigateTo={ROUTE_PATH.ALL_SERVICES}
        navigateToText="See All"
      />
      <ProviderList
        providerList={sponsored}
        sliderMode
        onItemClick={handleItemClick}
      />
    </Block>
  );
};

export default SponsoredList;
