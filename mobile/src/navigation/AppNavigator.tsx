import { useState } from 'react';

import AccountScreen from '../screens/AccountScreen';
import DriveScreen from '../screens/DriveScreen';
import HistoryScreen from '../screens/HistoryScreen';
import PipelineScreen from '../screens/PipelineScreen';
import type { SavedRouteRecord } from '../types/api';

type ActiveScreen = 'drive' | 'pipeline' | 'account' | 'history';
export type SavedRouteUseRequest = {
  id: number;
  route: SavedRouteRecord;
};

export default function AppNavigator() {
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('drive');
  const [savedRouteUseRequest, setSavedRouteUseRequest] =
    useState<SavedRouteUseRequest | null>(null);

  if (activeScreen === 'pipeline') {
    return <PipelineScreen onBackToDrive={() => setActiveScreen('drive')} />;
  }

  if (activeScreen === 'account') {
    return (
      <AccountScreen
        onBackToDrive={() => setActiveScreen('drive')}
        onOpenPipeline={() => setActiveScreen('pipeline')}
        onUseSavedRoute={(route) => {
          setSavedRouteUseRequest({ id: Date.now(), route });
          setActiveScreen('drive');
        }}
      />
    );
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
      savedRouteUseRequest={savedRouteUseRequest}
      onOpenAccount={() => setActiveScreen('account')}
      onOpenHistory={() => setActiveScreen('history')}
    />
  );
}
