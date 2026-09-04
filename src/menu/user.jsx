/***************************  MENU ITEMS - MEMBER  ***************************/
const workspace = {
  id: "group-workspace",
  title: "Workspace",
  icon: "IconBrandAsana",
  type: "group",
  children: [
    {
      id: "overview",
      title: "Overview",
      type: "item",
      url: "/dashboard",
      icon: "IconLayoutGrid",
    },
    {
      id: "jyson",
      title: "JYSON",
      type: "item",
      url: "/jyson",
      icon: "IconSparkles",
    },
    {
      id: "products",
      title: "Products & Access",
      type: "item",
      url: "/products",
      icon: "IconApps",
    },
    {
      id: "the-mode",
      title: "The Mode",
      type: "item",
      url: "/the-mode",
      icon: "IconNews",
    },
    {
      id: "services",
      title: "My Services",
      type: "item",
      url: "/services",
      icon: "IconBolt",
    },
    {
      id: "concierge",
      title: "Concierge",
      type: "item",
      url: "/concierge",
      icon: "IconHeadset",
    },
  ],
};
const account = {
  id: "group-account",
  title: "Account",
  icon: "IconUserCircle",
  type: "group",
  children: [
    {
      id: "early-support",
      title: "Early Support",
      type: "item",
      url: "/positions",
      icon: "IconNorthStar",
    },
    {
      id: "billing",
      title: "Billing & Payments",
      type: "item",
      url: "/billing",
      icon: "IconCreditCard",
    },
    {
      id: "email-prefs",
      title: "Email Preferences",
      type: "item",
      url: "/email-preferences",
      icon: "IconMail",
    },
    {
      id: "account",
      title: "Account",
      type: "item",
      url: "/account",
      icon: "IconUserCircle",
    },
  ],
};
export default [workspace, account];
