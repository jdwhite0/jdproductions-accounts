// @project
import memberGroups from "./user";
import adminGroup from "./admin";
import recruitingGroup from "./recruiting";
import other from "./other";

/***************************  MENU ITEMS (role-aware)  ***************************/

// Member sees workspace + account + support. Recruiting staff see Careers. Founder/admin also see the Founder group.
export function getMenuItems(isAdmin, canRecruit) {
  const items = [...memberGroups];
  if (canRecruit) items.push(recruitingGroup);
  if (isAdmin) items.push(adminGroup);
  items.push(other);
  return { items };
}

// Default export = member menu (safe fallback for any consumer before role resolves).
const menuItems = { items: [...memberGroups, other] };

export default menuItems;
