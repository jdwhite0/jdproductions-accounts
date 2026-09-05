import { RouterProvider } from 'react-router-dom';

// @project
import Notistack from '@/components/third-party/Notistack';
import { ConfigProvider } from '@/contexts/ConfigContext';

import router from '@/routes';
import ThemeCustomization from '@/themes';
import InvestSessionRestoreProvider from '@/views/auth/InvestSessionRestore';

function App() {
  return (
    <>
      <ConfigProvider>
        <ThemeCustomization>
          <Notistack>
            <InvestSessionRestoreProvider>
              <RouterProvider router={router} />
            </InvestSessionRestoreProvider>
          </Notistack>
        </ThemeCustomization>
      </ConfigProvider>
    </>
  );
}

export default App;
