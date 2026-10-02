# Speech speed setting

## What will change
- Add a speech speed control as the first option on the Settings page.
- Use a slider from 0.1× to 2.0×, with 1.0× as the default and the current value shown on its right.
- Save changes immediately and remember the chosen speed after reloads.
- Apply the selected speed to ElevenLabs speech and to the browser voice fallback.
- Localize the setting label and accessible slider text in English, Italian, and Chinese.

## Technical details
- Extend the existing shared settings state with a numeric speech-speed preference and safe parsing for previously saved settings.
- Send the speed to the existing speech endpoint and map it to ElevenLabs voice speed settings.
- Set the same rate on `SpeechSynthesisUtterance` when fallback speech is used.
- Verify the Settings screen and a Listen flow in the preview, then confirm the latest build status is clean.
