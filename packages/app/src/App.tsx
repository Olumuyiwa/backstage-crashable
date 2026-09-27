//packages/app/src/App.tsx
import { createApp } from '@backstage/frontend-defaults';
import catalogPlugin from '@backstage/plugin-catalog/alpha';
import kubernetesPlugin from '@backstage/plugin-kubernetes/alpha'; // <-- Changed to default import
import { navModule } from './modules/nav';
import { homeModule } from './modules/home';

export default createApp({
  features: [kubernetesPlugin, catalogPlugin, navModule, homeModule],
});
