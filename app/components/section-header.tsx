import { ROUTE_PATH } from "@/utils/contants";
import { Button, Navbar } from "konsta/react";
import Link from "next/link";

const SectionHeader = ({
  title,
  subtitle,
  navigateTo,
  navigateToText,
}: {
  title: string;
  subtitle: string;
  navigateTo?: string;
  navigateToText?: string;
}) => {
  return (
    <Navbar
      centerTitle={false}
      className="text-left"
      title={title}
      titleClassName="text-slate-600"
      subtitle={subtitle}
      rightClassName="bg-transparent shadow-none"
      right={
        navigateTo ? (
          <Link href={navigateTo}>
            <Button small clear>
              {navigateToText || "See All"}
            </Button>
          </Link>
        ) : null
      }
    />
  );
};

export default SectionHeader;
