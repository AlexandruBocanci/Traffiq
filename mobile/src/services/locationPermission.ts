import * as Location from 'expo-location';

let requestedForegroundLocationThisSession = false;

type ForegroundLocationPermissionOptions = {
  forcePrompt?: boolean;
  promptIfUndetermined?: boolean;
};

export async function getForegroundLocationPermission({
  forcePrompt = false,
  promptIfUndetermined = true,
}: ForegroundLocationPermissionOptions = {}) {
  const currentPermission = await Location.getForegroundPermissionsAsync();

  if (currentPermission.status === 'granted') {
    return currentPermission;
  }

  if (!promptIfUndetermined) {
    return currentPermission;
  }

  if (
    !forcePrompt &&
    (requestedForegroundLocationThisSession ||
      currentPermission.status !== 'undetermined')
  ) {
    return currentPermission;
  }

  requestedForegroundLocationThisSession = true;
  return Location.requestForegroundPermissionsAsync();
}
