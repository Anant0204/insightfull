!macro customUnInstall
  ; Terminate any running agent processes before uninstalling
  nsExec::Exec 'taskkill /F /IM "Insightful Agent.exe" /T'
  nsExec::Exec 'taskkill /F /IM "insightful-agent.exe" /T'

  ; Remove autostart Run registry keys
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "insightful-agent"
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "Insightful Agent"
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "com.ems.tracker"
  DeleteRegValue HKLM "Software\Microsoft\Windows\CurrentVersion\Run" "insightful-agent"
  DeleteRegValue HKLM "Software\Microsoft\Windows\CurrentVersion\Run" "Insightful Agent"
  DeleteRegValue HKLM "Software\Microsoft\Windows\CurrentVersion\Run" "com.ems.tracker"

  ; Remove startup folder shortcut if present
  Delete "$SMSTARTUP\Insightful Agent.lnk"
  Delete "$SMSTARTUP\insightful-agent.lnk"

  ; Delete configuration, tokens, and local cache
  RMDir /r "$APPDATA\insightful-agent"
  RMDir /r "$LOCALAPPDATA\insightful-agent"
  RMDir /r "$LOCALAPPDATA\insightful-agent-updater"
!macroend
