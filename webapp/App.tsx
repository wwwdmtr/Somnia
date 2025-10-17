import { TrpcProvider } from './src/lib/trpc';
import { AllDreamsPage } from './src/pages/AllDreamsPage';

export default function App() {
  return (
    <TrpcProvider>
      <AllDreamsPage />
    </TrpcProvider>
  );
}
