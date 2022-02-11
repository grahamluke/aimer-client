!macro RunApp
  ${StdUtils.ExecShellAsUser} $0 "$launchLink" "open" ""
!macroend

!macro customInstall
    !insertmacro RunApp
    !insertmacro quitSuccess
!macroend