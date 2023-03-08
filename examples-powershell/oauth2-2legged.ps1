[string]$Project_id="example-system"

$regkey=Get-ItemProperty -Path "HKCU:\Datum360\$Project_id"
[string]$client_id = $regkey.client_id
[string]$client_secret= $regkey.client_secret

[string]$URL_pim360 = "https://${Project_id}.pim360.io/"
[string]$URL_acl360 = "https://${Project_id}.acl360.io/"

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

Auth-PIM