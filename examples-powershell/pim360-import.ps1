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

Function UploadFile {
	$Headers = @{
		"accept"        = "application/json"
		"authorization" = "Bearer " + $Access_token_pim360
		"Content-Type"  = "multipart/form-data;"
	}
	
	$EIC_hndl = ""
    $Source_handle= ""

	$form = @{
		"eicHdl"         = $EIC_hndl
		"etlSourceHdl"     = $Source_handle
		"objectType"       = "TAGGED_ITEM"
		"loadUnknownAttributes"       = "true"
		"upfile"           = Get-Item -Path "LiveView.xlsx"
		"classification"   = "cls"
		"terminateAttributes"    = "empty"
 }
    $UploadFile = Invoke-RestMethod  -Verbose -Uri $URL_pim360"api/etl_queue/activities/wide_import" -Method POST -Headers $Headers -ContentType "multipart/form-data;" -Form $form -StatusCodeVariable scv -SkipHttpErrorCheck
	if ($scv -eq 200 )
    {
		$UploadFile | ConvertTo-Json
		Write-Host -Message "wide_import $scv"
		$Act_Hdl = $UploadFile.data.etlActHdl
		Return $Act_Hdl
    }

    #Some thing was wrong
    Write-Host -Message "API Fail $scv"
    Write-Host -Message "Error $AuthPim360.error"
    Write-Host -Message "Description $AuthPim360.error_description"
    Read-Host -Prompt "Finished Press Return"
    Break
}


$AuthPim360=Auth-PIM
$Access_token_pim360=$AuthPim360.access_token

UploadFile