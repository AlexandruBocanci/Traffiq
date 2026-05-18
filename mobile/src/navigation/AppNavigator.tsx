import { useState } from 'react';

import AccountScreen from '../screens/AccountScreen';
import DriveScreen from '../screens/DriveScreen';
import PipelineScreen from '../screens/PipelineScreen';

type ActiveScreen = 'drive' | 'pipeline' | 'account';

export default function AppNavigator() {
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('drive');

  if (activeScreen === 'pipeline') {
    return <PipelineScreen onBackToDrive={() => setActiveScreen('drive')} />;
  }

  if (activeScreen === 'account') {
    return <AccountScreen onBackToDrive={() => setActiveScreen('drive')} />;
  }

  return (
    <DriveScreen
      onOpenAccount={() => setActiveScreen('account')}
      onOpenPipeline={() => setActiveScreen('pipeline')}
    />
  );
}
