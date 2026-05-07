import { useState } from 'react';

import DriveScreen from '../screens/DriveScreen';
import PipelineScreen from '../screens/PipelineScreen';

export default function AppNavigator() {
  const [activeScreen, setActiveScreen] = useState<'drive' | 'pipeline'>('drive');

  if (activeScreen === 'pipeline') {
    return <PipelineScreen onBackToDrive={() => setActiveScreen('drive')} />;
  }

  return <DriveScreen onOpenPipeline={() => setActiveScreen('pipeline')} />;
}
