[string]$Project_id="example-system"

$regkey=Get-ItemProperty -Path "HKCU:\Datum360\$Project_id"
[string]$client_id = $regkey.client_id
[string]$client_secret= $regkey.client_secret

[string]$URL_pim360 = "https://${Project_id}.pim360.io/"
[string]$URL_acl360 = "https://${Project_id}.acl360.io/"

[string]$Access_token_pim360=""

Function Auth-PIM {
    $scope = "${Project_id}-pim360"
    $Body = @{
       "grant_type" = "client_credentials"
       "Authorization" = "Basic"
       "service_url" = $URL_pim360
       "client_id" = $client_id
       "client_secret" = $client_secret
       "scope" = "$scope"
        }
    $Url=$URL_acl360+"oauth2/token"
    $AuthPim360 = Invoke-RestMethod -Verbose -Uri "$Url"  -Method Post  -Body $Body -StatusCodeVariable scv -SkipHttpErrorCheck
    if ($scv -eq 200 )
    {
        return $AuthPim360
    }
    #Some thing was wrong
    Write-Host -Message "API Fail $scv"
    Write-Host -Message "Error $AuthPim360.error"
    Write-Host -Message "Description $AuthPim360.error_description"
    Read-Host -Prompt "Finished Press Return"
    Break
}

Function ExportLiveView {
    [string]$liveviewHdl = "U3LU480dSISM75A7iJRtQQ"
    [string]$etlTargetHdl = "4_bLCTIdRoy1KHChEd5A9g"
    [string]$outputFormat = "xlsx"
    [string]$outputFilename = "test.xlsx"
    [string]$eicHdl = "Pi6oMK48SlyGfbVmOWoxbQ"
    
    $Headers = @{
		"accept"        = "application/json"
		"authorization" = "Bearer " + $Access_token_pim360
	}

    $requestBody = [PSCustomObject]@{
        liveviewHdl = $liveviewHdl
        etlTargetHdl = $etlTargetHdl
        outputFormat = $outputFormat
        outputFileName = $outputFilename
        eicHdl = $eicHdl
    }

    $json = $requestBody | ConvertTo-Json

    $ExportActivity = Invoke-RestMethod -Verbose -Uri $URL_pim360"api/etl_queue/activities/export" -Method POST -Headers $Headers -ContentType "application/json" -Body $json -StatusCodeVariable scv -SkipHttpErrorCheck
    if ($scv -eq 200 )
    {
		$ExportActivity | ConvertTo-Json
		return $ExportActivity.response.act_handle
    }
}

#Waiting for the provided activity to finish so we know that the file is available to download
Function WaitForActivityToFinish([string]$activityHdl){
    [string]$status = ""
    do{
        $Headers = @{
            "accept"        = "application/json"
            "authorization" = "Bearer " + $Access_token_pim360
        }
    
        $ActivityStatus = Invoke-RestMethod -Verbose -Uri $URL_pim360"api/timeline?hdl="$activityHdl -Method GET -Headers $Headers -StatusCodeVariable scv -SkipHttpErrorCheck
        $status = $ActivityStatus[0].Status
        Start-Sleep -s 3
    }
    while($status -ne "Complete")
    
    return $ActivityStatus
}

#Downloading a file from PIM360 and saving it to the location specified in -OutFile
Function DownloadFileByHdl([string]$fileHdl){
    $Headers = @{
        "accept"        = "application/json"
        "authorization" = "Bearer " + $Access_token_pim360
    }

    Invoke-RestMethod -Verbose -Uri $URL_pim360"api/file/"$fileHdl -Method GET -Headers $Headers -StatusCodeVariable scv -SkipHttpErrorCheck -OutFile "output.xlsx.zip"
}

$AuthPim360=Auth-PIM
$Access_token_pim360=$AuthPim360.access_token

$Activity=ExportLiveView
$CompletedActivity=WaitForActivityToFinish $Activity[1]
$FileHdl=$CompletedActivity.Tasks[0].Attachments[0].Hdl
DownloadFileByHdl $FileHdl