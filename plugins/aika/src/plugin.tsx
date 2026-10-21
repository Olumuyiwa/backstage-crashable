import {
  createFrontendPlugin,
  createRouteRef,
  PageBlueprint,
} from '@backstage/frontend-plugin-api';
import AndroidIcon from '@material-ui/icons/Android';

export const aikaRouteRef = createRouteRef();

export const aikaPageExtension = PageBlueprint.make({
  params: {
    path: '/aika',
    title: 'AIKA',
    icon: <AndroidIcon fontSize="inherit" />,
    routeRef: aikaRouteRef,
    loader: async () => {
      const { AikaPage } = await import('./components/AikaPage/AikaPage');
      return <AikaPage />;
    },
  },
});

export const aikaPlugin = createFrontendPlugin({
  pluginId: 'aika',
  extensions: [aikaPageExtension],
});

export default aikaPlugin;