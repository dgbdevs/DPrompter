import { getCurrentWindow } from '@tauri-apps/api/window';
import { TeleprompterShell } from './components/TeleprompterShell';
import { SettingsWindow } from './components/settings/SettingsWindow';

function App() {
  const label = getCurrentWindow().label;

  if (label === 'editor') {
    return <SettingsWindow />;
  }

  return <TeleprompterShell />;
}

export default App;
