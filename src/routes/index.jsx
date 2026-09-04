import { createBrowserRouter } from "react-router-dom";

// @routes
import MainRoutes from "./MainRoutes";
import PagesRoutes from "./PagesRoutes";
import EarlySupportRoutes, { InvestRedirect } from "./EarlySupportRoutes";

/***************************  ROUTING RENDER  ***************************/

const router = createBrowserRouter(
  [PagesRoutes, EarlySupportRoutes, InvestRedirect, MainRoutes],
  {
    basename: import.meta.env.VITE_APP_BASE_URL,
  },
);

export default router;
