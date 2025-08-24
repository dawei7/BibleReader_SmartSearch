Option Explicit
' Minimal VBA glue: reads python_exe and prophecies_json paths from settings sheet
' Buttons should assign macros: ImportProphecies / ExportProphecies

Private Const SETTINGS_SHEET As String = "settings"
Private Const ARG_COL As Long = 1
Private Const VAL_COL As Long = 2

Private Function GetSetting(argName As String) As String
    Dim ws As Worksheet, lastRow As Long, r As Long
    On Error GoTo fail
    Set ws = ThisWorkbook.Worksheets(SETTINGS_SHEET)
    lastRow = ws.Cells(ws.Rows.Count, ARG_COL).End(xlUp).Row
    For r = 1 To lastRow
        If Trim$(CStr(ws.Cells(r, ARG_COL).Value)) = argName Then
            GetSetting = Trim$(CStr(ws.Cells(r, VAL_COL).Value))
            Exit Function
        End If
    Next r
fail:
End Function

Private Function SafeFileExists(p As String) As Boolean
    On Error Resume Next
    If Len(p) = 0 Then Exit Function
    SafeFileExists = (Dir$(p, vbNormal) <> "")
End Function

Private Function BridgeScriptPath() As String
    Dim override As String
    override = GetSetting("bridge_script")
    If Len(override) > 0 Then
        If SafeFileExists(override) Then BridgeScriptPath = override: Exit Function
    End If
    Dim base As String, sep As String, candidate As String, attempts As String
    On Error GoTo fallback
    sep = Application.PathSeparator
    base = ThisWorkbook.Path
    ' If workbook not yet saved, Path can be empty -> use current directory
    If Len(base) = 0 Then base = CurDir$
    ' Normalize any trailing separator
    If Right$(base, 1) = sep Then base = Left$(base, Len(base) - 1)
    Dim i As Integer, parentBase As String
    parentBase = base
    For i = 1 To 4 ' search current + up to 3 parents
        ' 1. Same folder as workbook / parent
        candidate = parentBase & sep & "prophecies_excel_bridge.py"
        attempts = attempts & candidate & vbCrLf
        If SafeFileExists(candidate) Then BridgeScriptPath = candidate: Exit Function
        ' 2. scripts subfolder under this level
        candidate = parentBase & sep & "scripts" & sep & "prophecies_excel_bridge.py"
        attempts = attempts & candidate & vbCrLf
        If SafeFileExists(candidate) Then BridgeScriptPath = candidate: Exit Function
        ' move one level up
        If InStrRev(parentBase, sep) > 0 Then
            parentBase = Left$(parentBase, InStrRev(parentBase, sep) - 1)
        Else
            Exit For
        End If
    Next i
fallback:
    If BridgeScriptPath = "" Then
        ' store attempted paths in a hidden cell for debugging if settings sheet exists
        On Error Resume Next
        Dim ws As Worksheet
        Set ws = ThisWorkbook.Worksheets(SETTINGS_SHEET)
        If Not ws Is Nothing Then ws.Range("Z1").Value = "Bridge attempts:" & vbCrLf & attempts
    End If
End Function

Private Sub RunBridge(mode As String)
    Dim py As String, jsonPath As String, cmd As String, rc As Long
    py = GetSetting("python_exe")
    If Len(py) = 0 Then
        MsgBox "python_exe not set in settings sheet", vbCritical
        Exit Sub
    End If
    jsonPath = GetSetting("prophecies_json")
    If Len(jsonPath) = 0 Then
        MsgBox "prophecies_json not set in settings sheet", vbCritical
        Exit Sub
    End If
    Dim scriptPath As String
    scriptPath = BridgeScriptPath()
    If Len(scriptPath) = 0 Or Dir$(scriptPath) = "" Then
        MsgBox "Bridge script not found after searching workbook folder and parents. Add optional 'bridge_script' override in settings or place workbook in project root. Workbook Path: " & ThisWorkbook.Path, vbCritical
        Exit Sub
    End If
    cmd = """" & py & """ " & """" & scriptPath & """ --mode " & mode & " --json """ & jsonPath & """"
    ' Use WScript.Shell for synchronous wait so user sees result before editing sheet
    Dim sh As Object, exitCode As Long
    On Error Resume Next
    Set sh = CreateObject("WScript.Shell")
    If sh Is Nothing Then
        On Error GoTo 0
        rc = Shell(cmd, vbNormalFocus)
        If rc = 0 Then MsgBox "Failed to launch Python process", vbCritical
        Exit Sub
    End If
    On Error GoTo 0
    exitCode = sh.Run(cmd, 1, True)
    If exitCode <> 0 Then
        MsgBox "Bridge exited with code " & exitCode & ". Check Logs sheet (or Z1 attempts).", vbExclamation
    End If
End Sub

Public Sub ImportProphecies()
    RunBridge "import"
End Sub

Public Sub ExportProphecies()
    RunBridge "export"
End Sub
