#Function Library


#Authenticate with PIM360. Sets Access token in variable "Access_token_pim360"
function Auth-PIM360 {
	$Body = @{
		"grant_type"    = "client_credentials"
		"Authorization" = "Basic"
		"service_url"   = $URL_pim360
		"client_id"     = $client_id
		"client_secret" = $client_secret
	}
	$Result = Invoke-RestMethod -Uri "${URL_acl360}oauth2/token" -Method Post -Body $Body
	$Global:Access_token_pim360 = $Result.access_token
}

#Authenticate with PIM360. Sets Access token in variable "Access_token_cls360"
function Auth-CLS360 {
	$Body = @{
		"grant_type"    = "client_credentials"
		"Authorization" = "Basic"
		"service_url"   = $URL_cls360
		"client_id"     = $client_id
		"client_secret" = $client_secret
	}
	$Result = Invoke-RestMethod -Uri "${URL_acl360}oauth2/token" -Method Post -Body $Body
	$Global:Access_token_cls360 = $Result.access_token
}

#Takes an EIC number and returns the handle associated with that EIC
function Get_EIC_Hdl {
	param(
		[string]$eic
	)
	$Headers = @{

		"authorization" = "Bearer " + $Access_token_pim360
	}
	$PIM_GET_EIC = Invoke-RestMethod -Uri $URL_pim360"api/eic/list" -Method GET -Headers $Headers
	$PIM_GET_EIC | convertto-json -depth 6 > download_EIC.json

	#the returned json has id and ID , so ConvertFrom-Json has issues, so replace ID with _ID to fix this:
	$PIM_GET_EIC2 = $PIM_GET_EIC.ToString().Replace("ID", "_ID") | ConvertFrom-Json

	$EIC_hndl = $PIM_GET_EIC2.rows | Where-Object { ($_._ID -eq $eic) } | ForEach-Object { $_.id }
	return  $EIC_hndl
}

#Creates a deliverable with the name specified in Doc_name on the EIC specified by eic_hdl
function EIC_create_del {
	param (
		[string]$Doc_name,
		[string]$eic_Hdl
	)
	$Headers = @{
		"authorization" = "Bearer " +$Access_token_pim360
		"accept"        = "application/json"
		"Content-Type"  = "application/json"
	}
	$Body = @{
		"ID"         = $Doc_name
		"Responsible" = "Client"
		"DueDate"     ="2023-12-12" 
		
	} | ConvertTo-Json
    
	$EIC_del_create = Invoke-RestMethod -Uri "${URL_pim360}api/eic/$eic_Hdl/deliverables" -Method Post -Headers $Headers -Body [$Body]
	RETURN $EIC_del_create
}

#Get a deliverable on an EIC specified by deliverable name. Returns the handle of the deliverable if found
function Get_EIC_Deliverable {
	param(
		[string]$EIC_hndl,
		[string]$Deliverable_name
	)
	$Headers = @{

		"authorization" = "Bearer " + $Access_token_pim360
	}

	$PIM_GET_del = Invoke-RestMethod -Uri ${URL_pim360}"api/eic/${EIC_hndl}/deliverables" -Method GET -Headers $Headers
	$PIM_GET_del_hndl= $PIM_GET_del.Deliverables | Where-Object { ($_.ID -eq $Deliverable_name) }  | ForEach-Object { $_.Hdl }
	
	return  $PIM_GET_del_hndl
}


#Submits a wide import activity with the parameters specified.
#Returns the handle of the activity
function upload-wide-file {	
	param(
		[string]$Upload_file,
		[string]$EIC_hndl,
		[string]$object_type,
		[string]$Source_handle,
		[string]$deliverble_handle,
		[string]$worksheet
	)
	$Headers = @{
		"accept"        = "application/json"
		"authorization" = "Bearer " + $Access_token_pim360
		"Content-Type"  = "multipart/form-data" 
 }
	$form = @{
		filename              = 'Import.xlsx'
		deliverableHdl        = $deliverble_handle
		eicHdl                = $EIC_hndl
		etlSourceHdl          = $Source_handle
		objectType            = $object_type
		loadUnknownAttributes = "true"
		classification        = "cls"
		terminateAttributes   = "empty"
		upfile                = Get-Item -Path $Upload_file
		type          = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
		worksheets = @( $worksheet)
 }

 	${Upload-File} = Invoke-RestMethod -Uri $URL_pim360"api/etl_queue/activities/wide_import" -Method POST -Headers $Headers -Form $Form
	$Act_Hdl = ${Upload-File}.data.etlActHdl
	return $Act_Hdl
}

#Gets the handle of the domain currently used by PIM360
function Get-DomainForPIM360 {
	$Headers = @{
		"authorization" = "Bearer " + $Access_token_pim360
	}

	$PIM_GET_domain = Invoke-RestMethod -Uri ${URL_pim360}"api/snapshotversion" -Method GET -Headers $Headers
	$domHdl = $PIM_GET_domain.hdl

	return $domHdl
}

#Gets the handle of the ETL source specified
function Get-Source-Hdl {
	param(
		[string]$Domain_handle,
		[string]$Source_name
	)
	$Headers = @{
		"accept"        = "application/json"
		"authorization" = "Bearer " + $Access_token_cls360
	}

	$Result = Invoke-RestMethod -Uri "${URL_cls360}api/domains/${Domain_handle}/classes?filter=Name%20eq%20%5B${Source_name}%5D%20and%20%20%5BObject%20Type%5D%20eq%20%5BData%20Source%5D" -Method Get -Header $Headers
	$Source_handle = $Result.value.Hdl

	return $Source_handle
}

#Gets the status of the activity specified by the activity handle
function Get-ActivityStatus {
	param(
		[string]${Activity}
	)
	$Headers = @{

		"authorization" = "Bearer " + $Access_token_pim360
	}
	$Result = Invoke-RestMethod -Uri $URL_pim360"api/etl_queue/activities/${Activity}" -Method GET -Headers $Headers
	#the returned json has id and ID , so ConvertFrom-Json has issues, so replace ID with _ID to fix this:
	$Acivity_status = $Result.status

	return $Acivity_status
}

#Gets information on the activity specified by the dataset reference
function Get-Dataset-Meta{
	param(
		[string] $Dataset_Name
	)
	$Headers = @{
 
		"authorization" = "Bearer " + $Access_token_pim360
		"accept"        = "application/zip"
	}
	$Dataset_Meta = Invoke-RestMethod -Uri ${URL_pim360}"api/etl_queue/activities/reference/$Dataset_Name" -Method GET -Headers $Headers
	
	return $Dataset_Meta
}

#Gets the file asscociated with a dataset reference export
function Get-Dataset-File {
	param(
		[string] $Dataset_Name,
		[string] $Out_Dir,
		[string] $file_extension
	)
	$Headers = @{
 
		"authorization" = "Bearer " + $Access_token_pim360
		"accept"        = "application/zip"
	}

	$get_URL = "${URL_pim360}api/etl_queue/activities/reference/$Dataset_Name/data"
	Invoke-WebRequest -Uri $get_URL  -Headers $Headers -OutFile "${Out_Dir}${Dataset_Name}.${file_extension}" 
}

#Used to resubmit an activiy using an existing activty handle
function Post-Activity_Hdl {
	param(
		[string] $Activity_Hdl
	)
	$Headers = @{
 
		"authorization" = "Bearer " + $Access_token_pim360
		"accept"        = "application/json"
		"Content-Type" =  "application/json"
	}
	$Result = Invoke-RestMethod -Uri ${URL_pim360}"api/etl_queue/activities/$Dataset_Hdl" -Method POST -Headers $Headers -Body "{}"
	return $Result.hdl
}

#Gets details of the activity specified by its handle
function Get-Activity_Hdl {
	param(
		[string] $Activity_Hdl
	)
	$Headers = @{
 
		"authorization" = "Bearer " + $Access_token_pim360
		"accept"        = "application/json"
	}
	$Result = Invoke-RestMethod -Uri ${URL_pim360}"api/etl_queue/activities/$Dataset_Hdl" -Method GET -Headers $Headers -Body "{}"
	return $Result
}


#Takes a liveview name and gets the data from that liveview
function Get-LiveViewDataByName {
param(
		[string] $LiveView_Name
	)
	$Headers = @{
 
		"authorization" = "Bearer " + $Access_token_pim360
		"accept"        = "application/json"
	}
 
	# get the Liveview handle
	$Result = Invoke-RestMethod -Uri ${URL_pim360}"api/customviews?type=LIVE_VIEW" -Method GET -Headers $Headers
	$LiveViewHdl = $Result | Where-Object { $_.Name -eq $LiveView_Name } | select-object -last 1 | Select-Object -expandProperty Hdl

	$Result = Invoke-RestMethod -Uri ${URL_pim360}"api/queryresults/views/${LiveViewHdl}?count=true" -Method Get -Header $Headers -StatusCodeVariable apistatus
	$Result  | convertto-json -depth 6 > liveview.json
	Write-Verbose "API return status $apistatus"
	[int]$Count = $Result.Count
	Write-verbose "Records To read $Count"

	
	$objects = New-Object System.Collections.ArrayList($null)
	[int]$n = 0;
	[int]$limit = 200
	[int]$page = 0
	[Int64]$skip = $page * $limit
	
	do {
		$Result = Invoke-RestMethod -Verbose -Uri ${URL_pim360}"api/queryresults/views/${LiveViewHdl}?skip=${skip}&limit=${limit}" -Method Get -Header $Headers -StatusCodeVariable apistatus
		$Result  | convertto-json -depth 6 > liveview.json
		
		Write-Verbose "API return status $apistatus"
		$page = $page + 1
		$skip = $page * $limit	
		$n = $n + $Result.data.Count			
		foreach ($item in $Result.data) {
			#Building up an object containing the data from the liveview
			$object = New-Object PSObject 
			if ($null -NE $item."hdl")
			{				
				Add-Member -Force -InputObject $object -MemberType NoteProperty  -Name "hdl" -Value $item."hdl"
			}
			if ($null -NE $item."type")
			{				
				Add-Member -Force -InputObject $object -MemberType NoteProperty  -Name "objectType" -Value $item."type"
			}
			if ($null -NE $item."objectChange")
			{				
				Add-Member -Force -InputObject $object -MemberType NoteProperty  -Name "objectChange" -Value $item."objectChange"
			}
			$template = 'yyyy-MM-dd HH:mm:ss'
			if ($null -NE $item."Modified.Ts".value)
			{
				#Formatting the timestamp into the format in $template
				$dt=[DateTime]::ParseExact($item."Modified.Ts".value, $template, $null) 

				Add-Member -Force -InputObject $object -MemberType NoteProperty  -Name "LastModified" -Value  $dt							
			}
			if ($null -NE $item."Published.Ts".value)
			{
				$dt=[DateTime]::ParseExact($item."Published.Ts".value, $template, $null) 
				Add-Member -Force -InputObject $object -MemberType NoteProperty  -Name "LastPublished" -Value  $dt							
			}
			else 
			{				
				Add-Member -Force -InputObject $object -MemberType NoteProperty  -Name "LastPublished" -Value  $null
			}

			$items = $item.PSObject.Properties.value | select-object -property name, value |  Where-Object { $null -NE $_.'name'  } 
			
			$pn=1
			foreach ($property in $items ) {  
				$pname = $property.name		
				if ($pname -eq "(unresolved)")
				{
					$pname = "$pname$pn"
					$pn=$pn+1				
				}
				Add-Member -Force -InputObject $object -MemberType NoteProperty  -Name $pname -Value  $property.value								
			}
						
			$objects.add($object ) | Out-Null
		}
	} while ($Result.hasmore -eq $true)

	Write-Verbose $n
	Write-verbose "Records we did read $n"
	return $objects
}

 #Submit a tag-doc association activty using the file specified by the filepath
function upload-refs-file {
	param(
		[string]$Upload_file,
		[string]$eic_handle
	)
	$Headers = @{
		"accept"        = "application/json"
		"authorization" = "Bearer " + $Access_token_pim360
		"Content-Type"  = "multipart/form-data" 
 }
	$form = @{
		inputfilename = 'refs.csv'
		upfile        = Get-Item -Path $Upload_file
		content_type  = 'multipart/form-data' 
		"eicHdl"  = $eic_handle
		"fromType"   = "TAGGED_ITEM"
		"toType"     = "DOCUMENT"      
 }
 ${Upload-File} = Invoke-RestMethod -Uri $URL_pim360"api/etl_queue/activities/association_import" -Method POST -Headers $Headers -Form $form
 $Act_Hdl = ${Upload-File}.data.etlActHdl
 return $Act_Hdl
}
