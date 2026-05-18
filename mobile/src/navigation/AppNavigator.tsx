import { useState } from 'react';

import AccountScreen from '../screens/AccountScreen';
import DriveScreen from '../screens/DriveScreen';
import HistoryScreen from '../screens/HistoryScreen';
import PipelineScreen from '../screens/PipelineScreen';

type ActiveScreen = 'drive' | 'pipeline' | 'account' | 'history';

export default function AppNavigator() {
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('drive');

  if (activeScreen === 'pipeline') {
    return <PipelineScreen onBackToDrive={() => setActiveScreen('drive')} />;
  }

  if (activeScreen === 'account') {
    return <AccountScreen onBackToDrive={() => setActiveScreen('drive')} />;
  }

  if (activeScreen === 'history') {
    return (
      <HistoryScreen
        onBackToDrive={() => setActiveScreen('drive')}
        onOpenAccount={() => setActiveScreen('account')}
      />
    );
  }

  return (
    <DriveScreen
      onOpenAccount={() => setActiveScreen('account')}
      onOpenHistory={() => setActiveScreen('history')}
      onOpenPipeline={() => setActiveScreen('pipeline')}
    />
  );
}
