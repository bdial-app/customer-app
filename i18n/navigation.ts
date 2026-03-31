import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Create navigation helpers without locale prefix
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
